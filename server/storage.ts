import { db } from "./db";
import { 
  images, edits, users, creditTransactions,
  type Image, type InsertImage, type Edit,
  type User, type CreditTransaction
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // Images
  getImage(id: number): Promise<Image | undefined>;
  createImage(image: InsertImage): Promise<Image>;
  
  // Edits
  getEdit(id: number): Promise<(Edit & { originalImage?: Image }) | undefined>;
  createEdit(edit: { imageId: number; toolType: string; maskUrl?: string; prompt?: string }): Promise<Edit>;
  updateEditStatus(id: number, status: string, resultUrl?: string, error?: string): Promise<Edit>;
  
  // Users (auth-based)
  getUser(id: string): Promise<User | undefined>;
  getUserInfo(userId: string): Promise<{ credits: number; plan: string; planExpiresAt: Date | null }>;
  
  // Credits
  getUserCredits(userId: string): Promise<number>;
  deductCredits(userId: string, amount: number, description: string, editId?: number): Promise<boolean>;
  addCredits(userId: string, amount: number, type: string, description: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getImage(id: number): Promise<Image | undefined> {
    const [image] = await db.select().from(images).where(eq(images.id, id));
    return image;
  }

  async createImage(insertImage: InsertImage): Promise<Image> {
    const [image] = await db.insert(images).values(insertImage).returning();
    return image;
  }

  async getEdit(id: number): Promise<(Edit & { originalImage?: Image }) | undefined> {
    const result = await db.select({
      edit: edits,
      image: images
    })
    .from(edits)
    .innerJoin(images, eq(edits.imageId, images.id))
    .where(eq(edits.id, id));

    if (result.length === 0) return undefined;

    return {
      ...result[0].edit,
      originalImage: result[0].image
    };
  }

  async createEdit(insertEdit: { imageId: number; toolType: string; maskUrl?: string | null; prompt?: string | null }): Promise<Edit> {
    const [edit] = await db.insert(edits).values({
      ...insertEdit,
      maskUrl: insertEdit.maskUrl ?? undefined,
      prompt: insertEdit.prompt ?? undefined
    }).returning();
    return edit;
  }

  async updateEditStatus(id: number, status: string, resultUrl?: string, error?: string): Promise<Edit> {
    const [updated] = await db.update(edits)
      .set({ 
        status, 
        resultUrl: resultUrl || undefined,
        error: error || undefined
      })
      .where(eq(edits.id, id))
      .returning();
    return updated;
  }

  // User methods (for auth users)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserInfo(userId: string): Promise<{ credits: number; plan: string; planExpiresAt: Date | null }> {
    const [user] = await db.select({ 
      credits: users.credits,
      plan: users.plan,
      planExpiresAt: users.planExpiresAt
    })
      .from(users)
      .where(eq(users.id, userId));
    
    // Check if plan has expired and persist the downgrade
    if (user?.planExpiresAt && new Date(user.planExpiresAt) < new Date()) {
      // Persist the plan downgrade in the database
      await db.update(users)
        .set({ 
          plan: 'free',
          planExpiresAt: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      return { credits: user.credits, plan: 'free', planExpiresAt: null };
    }
    
    return { 
      credits: user?.credits ?? 0, 
      plan: user?.plan || 'free',
      planExpiresAt: user?.planExpiresAt || null
    };
  }

  // Credit methods
  async getUserCredits(userId: string): Promise<number> {
    const [user] = await db.select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, userId));
    return user?.credits ?? 0;
  }

  async deductCredits(userId: string, amount: number, description: string, editId?: number): Promise<boolean> {
    const currentCredits = await this.getUserCredits(userId);
    if (currentCredits < amount) {
      return false;
    }

    await db.update(users)
      .set({ 
        credits: sql`${users.credits} - ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    await db.insert(creditTransactions).values({
      userId,
      amount: -amount,
      type: 'usage',
      description,
      editId
    });

    return true;
  }

  async addCredits(userId: string, amount: number, type: string, description: string): Promise<void> {
    await db.update(users)
      .set({ 
        credits: sql`${users.credits} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    await db.insert(creditTransactions).values({
      userId,
      amount,
      type,
      description
    });
  }
}

export const storage = new DatabaseStorage();
