import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import type { Express, RequestHandler } from "express";
import { db } from "./db";
import { users, emailVerificationCodes } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import { sendVerificationEmail, generateVerificationCode } from "./email";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: true, // Trust the reverse proxy (required for Replit/HTTPS)
    cookie: {
      httpOnly: true,
      secure: true, // Always use secure cookies on HTTPS
      sameSite: "lax" as const, // Lax allows OAuth redirects
      maxAge: sessionTtl,
    },
  });
}

async function findOrCreateGoogleUser(profile: any) {
  const googleId = profile.id;
  const email = profile.emails?.[0]?.value;
  const firstName = profile.name?.givenName || profile.displayName?.split(" ")[0];
  const lastName = profile.name?.familyName || profile.displayName?.split(" ").slice(1).join(" ");
  const profileImageUrl = profile.photos?.[0]?.value;

  // Check if user exists by Google ID
  let [user] = await db.select().from(users).where(eq(users.googleId, googleId));
  
  if (!user && email) {
    // Check if user exists by email (link accounts)
    [user] = await db.select().from(users).where(eq(users.email, email));
    if (user) {
      // Link Google ID to existing email account
      await db.update(users).set({ googleId, profileImageUrl }).where(eq(users.id, user.id));
      user.googleId = googleId;
    }
  }

  if (!user) {
    // Create new user
    const [newUser] = await db.insert(users).values({
      googleId,
      email,
      firstName,
      lastName,
      profileImageUrl,
      credits: 10,
      plan: "free",
    }).returning();
    return newUser;
  }

  return user;
}

async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

async function createEmailUser(email: string, password: string, firstName?: string, lastName?: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const [newUser] = await db.insert(users).values({
    email,
    password: hashedPassword,
    firstName,
    lastName,
    credits: 10,
    plan: "free",
  }).returning();
  return newUser;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      done(null, user || null);
    } catch (err) {
      done(err, null);
    }
  });

  // Google OAuth Strategy
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    const callbackURL = process.env.NODE_ENV === 'production' 
      ? "https://neurapix.net/api/auth/google/callback"
      : "/api/auth/google/callback";
    
    passport.use(new GoogleStrategy({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL,
      proxy: true,
      scope: ["openid", "profile", "email"],
    } as any, async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateGoogleUser(profile);
        done(null, user);
      } catch (err) {
        done(err as Error, undefined);
      }
    }));
  }

  // Local (Email/Password) Strategy
  passport.use(new LocalStrategy({
    usernameField: "email",
    passwordField: "password",
  }, async (email, password, done) => {
    try {
      const user = await findUserByEmail(email);
      if (!user || !user.password) {
        return done(null, false, { message: "Invalid email or password" });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: "Invalid email or password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  // Google OAuth routes
  app.get("/api/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"],
  }));

  app.get("/api/auth/google/callback", (req, res, next) => {
    console.log("[Google OAuth] Callback received, query:", req.query);
    next();
  }, passport.authenticate("google", {
    failureRedirect: "/login?error=google_auth_failed",
  }), (req, res) => {
    console.log("[Google OAuth] Success, user:", (req.user as any)?.id);
    res.redirect("/");
  });

  // Step 1: Send verification code
  app.post("/api/auth/send-code", async (req, res) => {
    try {
      const { email, language } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Delete old codes for this email
      await db.delete(emailVerificationCodes).where(eq(emailVerificationCodes.email, email));

      // Generate and save new code
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await db.insert(emailVerificationCodes).values({
        email,
        code,
        expiresAt
      });

      // Send email
      await sendVerificationEmail(email, code, language || 'ru');

      res.json({ success: true, message: "Verification code sent" });
    } catch (error) {
      console.error("Send code error:", error);
      res.status(500).json({ message: "Failed to send verification code" });
    }
  });

  // Step 2: Verify code and complete registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, code } = req.body;
      
      if (!email || !password || !code) {
        return res.status(400).json({ message: "Email, password and verification code are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Verify the code
      const [verification] = await db.select()
        .from(emailVerificationCodes)
        .where(and(
          eq(emailVerificationCodes.email, email),
          eq(emailVerificationCodes.code, code),
          gt(emailVerificationCodes.expiresAt, new Date())
        ));

      if (!verification) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }

      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Delete the used code
      await db.delete(emailVerificationCodes).where(eq(emailVerificationCodes.email, email));

      const user = await createEmailUser(email, password, firstName, lastName);
      
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed after registration" });
        }
        return res.json({ success: true, user: { id: user.id, email: user.email, firstName: user.firstName } });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Email/Password login
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        return res.json({ success: true, user: { id: user.id, email: user.email, firstName: user.firstName } });
      });
    })(req, res, next);
  });

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    console.log("[Auth] /api/auth/user called, isAuthenticated:", req.isAuthenticated(), "hasUser:", !!req.user, "sessionID:", req.sessionID?.slice(0,8));
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.user);
  });

  // Dev-only: Quick login for testing in Replit preview (bypasses OAuth)
  app.get("/api/auth/dev-login", async (req, res) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, "gyozumyan@gmail.com"));
      if (!user) {
        return res.status(404).json({ message: "Test user not found" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.redirect("/");
      });
    } catch (error) {
      res.status(500).json({ message: "Dev login failed" });
    }
  });

  // Logout
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy((err) => {
        res.clearCookie("connect.sid");
        res.redirect("/");
      });
    });
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy((err) => {
        res.clearCookie("connect.sid");
        res.json({ success: true });
      });
    });
  });

  // Setup first admin - only works for specific email
  app.post("/api/auth/setup-admin", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as any;
      const allowedEmails = ["gyozumyan@gmail.com"];
      
      if (!allowedEmails.includes(user.email)) {
        return res.status(403).json({ message: "Not allowed" });
      }
      
      // Update user to admin with PRO plan
      await db.update(users)
        .set({ 
          isAdmin: 1, 
          plan: "pro",
          planExpiresAt: new Date("2027-12-31")
        })
        .where(eq(users.email, user.email));
      
      // Get updated user
      const [updatedUser] = await db.select().from(users).where(eq(users.email, user.email));
      
      // Update session
      req.login(updatedUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Session update failed" });
        }
        res.json({ success: true, user: updatedUser });
      });
    } catch (error) {
      console.error("Setup admin error:", error);
      res.status(500).json({ message: "Failed to setup admin" });
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export { findUserByEmail };
