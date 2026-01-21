import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { payments, pricingPlans, creditPackages, systemSettings, users, tools, seoSettings, pageContents, providerConfigs, aiJobs, auditLogs, envOverrides } from "@shared/models/auth";
import { eq, desc, sql, asc } from "drizzle-orm";
import { isAuthenticated } from "./auth";
import * as liqpay from "./liqpay";
import * as stripe from "./stripe";
import * as fondy from "./fondy";
import * as wayforpay from "./wayforpay";
import { storage } from "./storage";
import { z } from "zod";

const createPlanSchema = z.object({
  name: z.string().min(1, "Назва обов'язкова"),
  nameUk: z.string().optional().default(""),
  nameEn: z.string().optional().default(""),
  planType: z.enum(["standard", "pro"]).default("standard"),
  period: z.enum(["monthly", "yearly"]).default("monthly"),
  priceUah: z.coerce.number().int().min(0).default(0),
  priceUsd: z.coerce.number().int().min(0).optional().nullable(),
  credits: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.number().int().min(0).max(1).default(1),
  sortOrder: z.coerce.number().int().default(0),
});

const createPackageSchema = z.object({
  credits: z.coerce.number().int().min(1, "Кредити обов'язкові"),
  priceUah: z.coerce.number().int().min(0).default(0),
  priceUsd: z.coerce.number().int().min(0).optional().nullable(),
  bonusCredits: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.number().int().min(0).max(1).default(1),
  sortOrder: z.coerce.number().int().default(0),
});

const createSettingSchema = z.object({
  key: z.string().min(1, "Ключ обов'язковий"),
  value: z.string().default(""),
  description: z.string().optional().nullable(),
});

const createToolSchema = z.object({
  id: z.string().min(1, "ID обов'язковий"),
  nameRu: z.string().min(1, "Назва обов'язкова"),
  nameUk: z.string().optional().default(""),
  nameEn: z.string().optional().default(""),
  descriptionRu: z.string().optional().nullable(),
  descriptionUk: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  category: z.enum(["enhance", "face", "background", "restore", "edit", "effects"]).default("enhance"),
  creditCost: z.coerce.number().int().min(0).default(10),
  creditCostPro: z.coerce.number().int().min(0).optional().nullable(),
  isActive: z.coerce.number().int().min(0).max(1).default(1),
  isPro: z.coerce.number().int().min(0).max(1).default(0),
  sortOrder: z.coerce.number().int().default(0),
  iconName: z.string().optional().default(""),
});

const updateToolSchema = z.object({
  nameRu: z.string().min(1).optional(),
  nameUk: z.string().optional(),
  nameEn: z.string().optional(),
  descriptionRu: z.string().optional().nullable(),
  descriptionUk: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  category: z.enum(["enhance", "face", "background", "restore", "edit", "effects"]).optional(),
  creditCost: z.coerce.number().int().min(0).optional(),
  creditCostPro: z.coerce.number().int().min(0).optional().nullable(),
  isActive: z.coerce.number().int().min(0).max(1).optional(),
  isPro: z.coerce.number().int().min(0).max(1).optional(),
  sortOrder: z.coerce.number().int().optional(),
  iconName: z.string().optional(),
});

const createSeoSchema = z.object({
  page: z.string().min(1, "Сторінка обов'язкова"),
  titleRu: z.string().optional().default(""),
  titleUk: z.string().optional().default(""),
  titleEn: z.string().optional().default(""),
  descriptionRu: z.string().optional().default(""),
  descriptionUk: z.string().optional().default(""),
  descriptionEn: z.string().optional().default(""),
  keywordsRu: z.string().optional().default(""),
  keywordsUk: z.string().optional().default(""),
  keywordsEn: z.string().optional().default(""),
  ogImage: z.string().optional().default(""),
});

const updateSeoSchema = z.object({
  titleRu: z.string().optional(),
  titleUk: z.string().optional(),
  titleEn: z.string().optional(),
  descriptionRu: z.string().optional(),
  descriptionUk: z.string().optional(),
  descriptionEn: z.string().optional(),
  keywordsRu: z.string().optional(),
  keywordsUk: z.string().optional(),
  keywordsEn: z.string().optional(),
  ogImage: z.string().optional(),
});

const createContentSchema = z.object({
  id: z.string().min(1, "ID обов'язковий"),
  page: z.string().min(1, "Сторінка обов'язкова"),
  section: z.string().min(1, "Секція обов'язкова"),
  contentRu: z.string().optional().default(""),
  contentUk: z.string().optional().default(""),
  contentEn: z.string().optional().default(""),
  isActive: z.coerce.number().int().min(0).max(1).default(1),
});

const updateContentSchema = z.object({
  contentRu: z.string().optional(),
  contentUk: z.string().optional(),
  contentEn: z.string().optional(),
  isActive: z.coerce.number().int().min(0).max(1).optional(),
});

function isAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ message: "Не авторизован" });
  }
  if (user.isAdmin !== 1) {
    console.log(`Admin access denied for user ${user.id}, isAdmin=${user.isAdmin}`);
    return res.status(403).json({ message: "Доступ запрещен" });
  }
  next();
}

export function registerPaymentRoutes(app: Express) {
  app.get("/api/payment/plans", async (req, res) => {
    try {
      const plans = await db.select().from(pricingPlans).where(eq(pricingPlans.isActive, 1)).orderBy(pricingPlans.sortOrder);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Ошибка получения тарифов" });
    }
  });

  app.get("/api/payment/packages", async (req, res) => {
    try {
      const packages = await db.select().from(creditPackages).where(eq(creditPackages.isActive, 1)).orderBy(creditPackages.sortOrder);
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "Ошибка получения пакетов" });
    }
  });

  app.get("/api/payment/status", async (req, res) => {
    try {
      const configured = liqpay.isLiqPayConfigured();
      const enabledSetting = await db.select().from(systemSettings).where(eq(systemSettings.key, "liqpay_enabled")).limit(1);
      const enabled = enabledSetting[0]?.value === "true";
      res.json({ configured, enabled, available: configured && enabled });
    } catch (error) {
      console.error("Error checking payment status:", error);
      res.status(500).json({ message: "Ошибка проверки статуса оплаты" });
    }
  });

  app.post("/api/payment/create", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { type, planId, packageId, language } = req.body;

      if (!liqpay.isLiqPayConfigured()) {
        return res.status(503).json({ message: "Оплата временно недоступна. Обратитесь к администратору." });
      }

      let amount: number;
      let credits: number;
      let description: string;

      if (type === "plan") {
        const plan = await db.select().from(pricingPlans).where(eq(pricingPlans.id, planId)).limit(1);
        if (!plan[0]) {
          return res.status(400).json({ message: "Тариф не найден" });
        }
        amount = plan[0].priceUah;
        credits = plan[0].credits;
        description = `NeuraPix ${plan[0].name} - ${credits} кредитів`;
      } else if (type === "package") {
        const pkg = await db.select().from(creditPackages).where(eq(creditPackages.id, packageId)).limit(1);
        if (!pkg[0]) {
          return res.status(400).json({ message: "Пакет не найден" });
        }
        amount = pkg[0].priceUah;
        credits = pkg[0].credits + (pkg[0].bonusCredits || 0);
        description = `NeuraPix ${pkg[0].credits} кредитів`;
      } else {
        return res.status(400).json({ message: "Неверный тип покупки" });
      }

      const orderId = `np_${userId}_${Date.now()}`;
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : process.env.CUSTOM_DOMAIN 
          ? `https://${process.env.CUSTOM_DOMAIN}` 
          : "http://localhost:5000";

      await db.insert(payments).values({
        userId,
        amount: amount * 100,
        credits,
        status: "pending",
        liqpayOrderId: orderId,
        description,
      });

      const paymentData = liqpay.createPaymentData({
        orderId,
        amount,
        description,
        resultUrl: `${baseUrl}/payment/success`,
        serverUrl: `${baseUrl}/api/payment/callback`,
        language: language || "uk",
      });

      res.json({
        checkoutUrl: liqpay.getLiqPayCheckoutUrl(),
        data: paymentData.data,
        signature: paymentData.signature,
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Ошибка создания платежа" });
    }
  });

  app.post("/api/payment/callback", async (req, res) => {
    try {
      const { data, signature } = req.body;

      if (!liqpay.verifyCallback(data, signature)) {
        console.error("Invalid LiqPay signature");
        return res.status(400).json({ message: "Invalid signature" });
      }

      const callbackData = liqpay.parseCallbackData(data);
      if (!callbackData) {
        return res.status(400).json({ message: "Invalid callback data" });
      }

      console.log("LiqPay callback:", callbackData);

      const orderId = callbackData.order_id;
      const status = liqpay.getPaymentStatus(callbackData.status);
      const liqpayPaymentId = callbackData.payment_id?.toString();

      const payment = await db.select().from(payments).where(eq(payments.liqpayOrderId, orderId)).limit(1);
      if (!payment[0]) {
        console.error("Payment not found:", orderId);
        return res.status(404).json({ message: "Payment not found" });
      }

      await db.update(payments).set({
        status,
        liqpayPaymentId,
        updatedAt: new Date(),
      }).where(eq(payments.liqpayOrderId, orderId));

      if (status === "success" && payment[0].status !== "success") {
        await storage.addCredits(
          payment[0].userId,
          payment[0].credits,
          "purchase",
          payment[0].description || `Покупка ${payment[0].credits} кредитов`
        );
        console.log(`Credits added: ${payment[0].credits} to user ${payment[0].userId}`);
      }

      res.json({ status: "ok" });
    } catch (error) {
      console.error("Error processing callback:", error);
      res.status(500).json({ message: "Error processing callback" });
    }
  });

  // ============== STRIPE ==============
  app.post("/api/stripe/create-checkout", isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe.isStripeConfigured()) {
        return res.status(400).json({ message: "Stripe не налаштований" });
      }

      const userId = req.user.id;
      const { amount, credits, description, language } = req.body;

      if (!amount || !credits) {
        return res.status(400).json({ message: "Невірні дані платежу" });
      }

      const orderId = `stripe_${Date.now()}_${userId}`;
      const baseUrl = process.env.REPL_SLUG 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : process.env.CUSTOM_DOMAIN 
          ? `https://${process.env.CUSTOM_DOMAIN}` 
          : "http://localhost:5000";

      await db.insert(payments).values({
        userId,
        amount: Math.round(amount * 100),
        credits,
        status: "pending",
        liqpayOrderId: orderId,
        description: description || `Stripe: ${credits} кредитів`,
      });

      const session = await stripe.createCheckoutSession({
        orderId,
        amount,
        currency: "USD",
        description: description || `${credits} кредитів NeuraPix`,
        successUrl: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/payment/cancel`,
        customerEmail: req.user.email,
      });

      if (!session) {
        return res.status(500).json({ message: "Помилка створення сесії Stripe" });
      }

      res.json({ url: session.url, sessionId: session.sessionId });
    } catch (error) {
      console.error("Stripe checkout error:", error);
      res.status(500).json({ message: "Помилка створення платежу Stripe" });
    }
  });

  app.post("/api/stripe/webhook", async (req: any, res) => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const rawBody = req.rawBody as Buffer;
      
      if (!rawBody) {
        console.error("Stripe webhook: raw body not available");
        return res.status(400).json({ message: "Raw body required" });
      }
      
      const event = stripe.verifyWebhook(rawBody, sig);
      
      if (!event) {
        return res.status(400).json({ message: "Invalid webhook signature" });
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const orderId = session.metadata?.order_id;
        
        if (orderId) {
          const payment = await db.select().from(payments).where(eq(payments.liqpayOrderId, orderId)).limit(1);
          if (payment[0] && payment[0].status !== "success") {
            await db.update(payments).set({
              status: "success",
              liqpayPaymentId: session.payment_intent,
              updatedAt: new Date(),
            }).where(eq(payments.liqpayOrderId, orderId));

            await storage.addCredits(
              payment[0].userId,
              payment[0].credits,
              "purchase",
              `Stripe: ${payment[0].credits} кредитів`
            );
          }
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(500).json({ message: "Webhook error" });
    }
  });

  // ============== FONDY ==============
  app.post("/api/fondy/create-payment", isAuthenticated, async (req: any, res) => {
    try {
      if (!fondy.isFondyConfigured()) {
        return res.status(400).json({ message: "Fondy не налаштований" });
      }

      const userId = req.user.id;
      const { amount, credits, description, language } = req.body;

      if (!amount || !credits) {
        return res.status(400).json({ message: "Невірні дані платежу" });
      }

      const orderId = `fondy_${Date.now()}_${userId}`;
      const baseUrl = process.env.REPL_SLUG 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : process.env.CUSTOM_DOMAIN 
          ? `https://${process.env.CUSTOM_DOMAIN}` 
          : "http://localhost:5000";

      await db.insert(payments).values({
        userId,
        amount: Math.round(amount * 100),
        credits,
        status: "pending",
        liqpayOrderId: orderId,
        description: description || `Fondy: ${credits} кредитів`,
      });

      const result = await fondy.createPayment({
        orderId,
        amount,
        currency: "UAH",
        description: description || `${credits} кредитів NeuraPix`,
        responseUrl: `${baseUrl}/payment/success`,
        callbackUrl: `${baseUrl}/api/fondy/callback`,
        language: language || "uk",
      });

      if (!result) {
        return res.status(500).json({ message: "Помилка створення платежу Fondy" });
      }

      res.json({ checkoutUrl: result.checkoutUrl, paymentId: result.paymentId });
    } catch (error) {
      console.error("Fondy payment error:", error);
      res.status(500).json({ message: "Помилка створення платежу Fondy" });
    }
  });

  app.post("/api/fondy/callback", async (req, res) => {
    try {
      if (!fondy.verifyCallback(req.body)) {
        return res.status(400).json({ message: "Invalid signature" });
      }

      const { order_id, order_status, payment_id } = req.body;
      const status = fondy.getPaymentStatus(order_status);

      const payment = await db.select().from(payments).where(eq(payments.liqpayOrderId, order_id)).limit(1);
      if (!payment[0]) {
        return res.status(404).json({ message: "Payment not found" });
      }

      await db.update(payments).set({
        status,
        liqpayPaymentId: payment_id,
        updatedAt: new Date(),
      }).where(eq(payments.liqpayOrderId, order_id));

      if (status === "success" && payment[0].status !== "success") {
        await storage.addCredits(
          payment[0].userId,
          payment[0].credits,
          "purchase",
          `Fondy: ${payment[0].credits} кредитів`
        );
      }

      res.json({ status: "ok" });
    } catch (error) {
      console.error("Fondy callback error:", error);
      res.status(500).json({ message: "Callback error" });
    }
  });

  // ============== WAYFORPAY ==============
  app.post("/api/wayforpay/create-payment", isAuthenticated, async (req: any, res) => {
    try {
      if (!wayforpay.isWayForPayConfigured()) {
        return res.status(400).json({ message: "WayForPay не налаштований" });
      }

      const userId = req.user.id;
      const { amount, credits, description, language } = req.body;

      if (!amount || !credits) {
        return res.status(400).json({ message: "Невірні дані платежу" });
      }

      const orderId = `wfp_${Date.now()}_${userId}`;
      const baseUrl = process.env.REPL_SLUG 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : process.env.CUSTOM_DOMAIN 
          ? `https://${process.env.CUSTOM_DOMAIN}` 
          : "http://localhost:5000";

      await db.insert(payments).values({
        userId,
        amount: Math.round(amount * 100),
        credits,
        status: "pending",
        liqpayOrderId: orderId,
        description: description || `WayForPay: ${credits} кредитів`,
      });

      const formData = wayforpay.createPaymentForm({
        orderId,
        amount,
        currency: "UAH",
        productName: `${credits} кредитів NeuraPix`,
        productCount: 1,
        productPrice: amount,
        returnUrl: `${baseUrl}/payment/success`,
        serviceUrl: `${baseUrl}/api/wayforpay/callback`,
        language: language || "UA",
      });

      res.json({ 
        checkoutUrl: wayforpay.getCheckoutUrl(),
        formData,
      });
    } catch (error) {
      console.error("WayForPay payment error:", error);
      res.status(500).json({ message: "Помилка створення платежу WayForPay" });
    }
  });

  app.post("/api/wayforpay/callback", async (req, res) => {
    try {
      if (!wayforpay.verifyCallback(req.body)) {
        return res.status(400).json({ message: "Invalid signature" });
      }

      const { orderReference, transactionStatus, authCode } = req.body;
      const status = wayforpay.getPaymentStatus(transactionStatus);

      const payment = await db.select().from(payments).where(eq(payments.liqpayOrderId, orderReference)).limit(1);
      if (!payment[0]) {
        const response = wayforpay.createCallbackResponse(orderReference, 'refuse');
        return res.json(response);
      }

      await db.update(payments).set({
        status,
        liqpayPaymentId: authCode,
        updatedAt: new Date(),
      }).where(eq(payments.liqpayOrderId, orderReference));

      if (status === "success" && payment[0].status !== "success") {
        await storage.addCredits(
          payment[0].userId,
          payment[0].credits,
          "purchase",
          `WayForPay: ${payment[0].credits} кредитів`
        );
      }

      const response = wayforpay.createCallbackResponse(orderReference, 'accept');
      res.json(response);
    } catch (error) {
      console.error("WayForPay callback error:", error);
      res.status(500).json({ message: "Callback error" });
    }
  });

  // ============== PAYMENT PROVIDERS STATUS ==============
  app.get("/api/payment/providers", async (req, res) => {
    try {
      const settings = await db.select().from(systemSettings);
      const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));

      res.json({
        liqpay: {
          enabled: settingsMap['liqpay_enabled'] === 'true' && liqpay.isLiqPayConfigured(),
          configured: liqpay.isLiqPayConfigured(),
        },
        stripe: {
          enabled: settingsMap['stripe_enabled'] === 'true' && stripe.isStripeConfigured(),
          configured: stripe.isStripeConfigured(),
        },
        fondy: {
          enabled: settingsMap['fondy_enabled'] === 'true' && fondy.isFondyConfigured(),
          configured: fondy.isFondyConfigured(),
        },
        wayforpay: {
          enabled: settingsMap['wayforpay_enabled'] === 'true' && wayforpay.isWayForPayConfigured(),
          configured: wayforpay.isWayForPayConfigured(),
        },
      });
    } catch (error) {
      console.error("Error fetching payment providers:", error);
      res.status(500).json({ message: "Error" });
    }
  });

  app.get("/api/payment/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const history = await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt)).limit(50);
      res.json(history);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      res.status(500).json({ message: "Ошибка получения истории платежей" });
    }
  });

  app.get("/api/admin/payments", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const allPayments = await db.select().from(payments).orderBy(desc(payments.createdAt)).limit(100);
      res.json(allPayments);
    } catch (error) {
      console.error("Error fetching all payments:", error);
      res.status(500).json({ message: "Ошибка получения платежей" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        credits: users.credits,
        plan: users.plan,
        planExpiresAt: users.planExpiresAt,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
      }).from(users).orderBy(desc(users.createdAt)).limit(200);
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Ошибка получения пользователей" });
    }
  });

  app.patch("/api/admin/users/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const { credits, plan, isAdmin: newIsAdmin } = req.body;

      const updates: any = { updatedAt: new Date() };
      if (credits !== undefined) updates.credits = credits;
      if (plan !== undefined) updates.plan = plan;
      if (newIsAdmin !== undefined) updates.isAdmin = newIsAdmin;

      await db.update(users).set(updates).where(eq(users.id, userId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Ошибка обновления пользователя" });
    }
  });

  app.get("/api/admin/settings", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const settings = await db.select().from(systemSettings);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Ошибка получения настроек" });
    }
  });

  app.patch("/api/admin/settings", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const updates = req.body as { key: string; value: string }[];
      for (const { key, value } of updates) {
        await db.update(systemSettings).set({ value, updatedAt: new Date() }).where(eq(systemSettings.key, key));
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Ошибка обновления настроек" });
    }
  });

  app.get("/api/admin/plans", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const plans = await db.select().from(pricingPlans).orderBy(pricingPlans.sortOrder);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Ошибка получения тарифов" });
    }
  });

  app.patch("/api/admin/plans/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const planId = req.params.id;
      const { id, updatedAt, createdAt, ...safeUpdates } = req.body;
      const updates = { ...safeUpdates, updatedAt: new Date() };
      await db.update(pricingPlans).set(updates).where(eq(pricingPlans.id, planId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating plan:", error);
      res.status(500).json({ message: "Ошибка обновления тарифа" });
    }
  });

  app.get("/api/admin/packages", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const packages = await db.select().from(creditPackages).orderBy(creditPackages.sortOrder);
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "Ошибка получения пакетов" });
    }
  });

  app.patch("/api/admin/packages/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const packageId = req.params.id;
      const { id, updatedAt, createdAt, ...safeUpdates } = req.body;
      const updates = { ...safeUpdates, updatedAt: new Date() };
      await db.update(creditPackages).set(updates).where(eq(creditPackages.id, packageId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating package:", error);
      res.status(500).json({ message: "Ошибка обновления пакета" });
    }
  });

  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
      const totalPayments = await db.select({ 
        count: sql<number>`count(*)`, 
        sum: sql<number>`COALESCE(sum(amount), 0)` 
      }).from(payments).where(eq(payments.status, "success"));
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayPayments = await db.select({ 
        count: sql<number>`count(*)`, 
        sum: sql<number>`COALESCE(sum(amount), 0)` 
      }).from(payments).where(sql`status = 'success' AND created_at >= ${today}`);

      res.json({
        totalUsers: Number(totalUsers[0]?.count || 0),
        totalPayments: Number(totalPayments[0]?.count || 0),
        totalRevenue: Number(totalPayments[0]?.sum || 0) / 100,
        todayPayments: Number(todayPayments[0]?.count || 0),
        todayRevenue: Number(todayPayments[0]?.sum || 0) / 100,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Ошибка получения статистики" });
    }
  });

  // Create new plan
  app.post("/api/admin/plans", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const validation = createPlanSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0]?.message || "Невірні дані" });
      }
      const data = validation.data;
      const planId = `${data.planType}_${data.period}_${Date.now()}`;
      const [newPlan] = await db.insert(pricingPlans).values({
        id: planId,
        name: data.name,
        nameUk: data.nameUk,
        nameEn: data.nameEn,
        planType: data.planType,
        period: data.period,
        priceUah: data.priceUah,
        priceUsd: data.priceUsd,
        credits: data.credits,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      }).returning();
      res.json(newPlan);
    } catch (error) {
      console.error("Error creating plan:", error);
      res.status(500).json({ message: "Помилка створення тарифу" });
    }
  });

  // Delete plan
  app.delete("/api/admin/plans/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const planId = req.params.id;
      await db.delete(pricingPlans).where(eq(pricingPlans.id, planId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting plan:", error);
      res.status(500).json({ message: "Ошибка удаления тарифа" });
    }
  });

  // Create new package
  app.post("/api/admin/packages", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const validation = createPackageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0]?.message || "Невірні дані" });
      }
      const data = validation.data;
      const packageId = `pkg_${data.credits}_${Date.now()}`;
      const [newPackage] = await db.insert(creditPackages).values({
        id: packageId,
        credits: data.credits,
        priceUah: data.priceUah,
        priceUsd: data.priceUsd,
        bonusCredits: data.bonusCredits,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      }).returning();
      res.json(newPackage);
    } catch (error) {
      console.error("Error creating package:", error);
      res.status(500).json({ message: "Помилка створення пакету" });
    }
  });

  // Delete package
  app.delete("/api/admin/packages/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const packageId = req.params.id;
      await db.delete(creditPackages).where(eq(creditPackages.id, packageId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting package:", error);
      res.status(500).json({ message: "Ошибка удаления пакета" });
    }
  });

  // Create new setting
  app.post("/api/admin/settings", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const validation = createSettingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0]?.message || "Невірні дані" });
      }
      const data = validation.data;
      const [newSetting] = await db.insert(systemSettings).values({
        key: data.key,
        value: data.value,
        description: data.description,
      }).returning();
      res.json(newSetting);
    } catch (error) {
      console.error("Error creating setting:", error);
      res.status(500).json({ message: "Помилка створення налаштування" });
    }
  });

  // Delete setting
  app.delete("/api/admin/settings/:key", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const settingKey = req.params.key;
      await db.delete(systemSettings).where(eq(systemSettings.key, settingKey));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting setting:", error);
      res.status(500).json({ message: "Ошибка удаления настройки" });
    }
  });

  // Search users
  app.get("/api/admin/users/search", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.json([]);
      }
      const searchTerm = `%${q}%`;
      const results = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        credits: users.credits,
        plan: users.plan,
        planExpiresAt: users.planExpiresAt,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
      }).from(users)
        .where(sql`email ILIKE ${searchTerm} OR first_name ILIKE ${searchTerm} OR last_name ILIKE ${searchTerm}`)
        .limit(50);
      res.json(results);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Ошибка поиска пользователей" });
    }
  });

  // Export users as CSV
  app.get("/api/admin/export/users", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        credits: users.credits,
        plan: users.plan,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
      }).from(users).orderBy(desc(users.createdAt));

      const csv = [
        "ID,Email,First Name,Last Name,Credits,Plan,Is Admin,Created At",
        ...allUsers.map(u => 
          `${u.id},${u.email || ""},${u.firstName || ""},${u.lastName || ""},${u.credits},${u.plan},${u.isAdmin},${u.createdAt}`
        )
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=users.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error exporting users:", error);
      res.status(500).json({ message: "Ошибка экспорта пользователей" });
    }
  });

  // Export payments as CSV
  app.get("/api/admin/export/payments", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const allPayments = await db.select().from(payments).orderBy(desc(payments.createdAt));

      const csv = [
        "ID,User ID,Amount,Currency,Credits,Status,Description,Created At",
        ...allPayments.map(p => 
          `${p.id},${p.userId},${(p.amount / 100).toFixed(2)},${p.currency},${p.credits},${p.status},"${p.description || ""}",${p.createdAt}`
        )
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=payments.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error exporting payments:", error);
      res.status(500).json({ message: "Ошибка экспорта платежей" });
    }
  });

  // Delete user (only if not admin and has no payments)
  app.delete("/api/admin/users/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      
      if (user.isAdmin === 1) {
        return res.status(403).json({ message: "Нельзя удалить администратора" });
      }

      await db.delete(users).where(eq(users.id, userId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Ошибка удаления пользователя" });
    }
  });

  // ==================== CMS: TOOLS ====================
  
  // Get all tools (public)
  app.get("/api/tools", async (req, res) => {
    try {
      const allTools = await db.select().from(tools).orderBy(asc(tools.sortOrder));
      res.json(allTools);
    } catch (error) {
      console.error("Error fetching tools:", error);
      res.status(500).json({ message: "Помилка отримання інструментів" });
    }
  });

  // Get active tools only (public)
  app.get("/api/tools/active", async (req, res) => {
    try {
      const activeTools = await db.select().from(tools).where(eq(tools.isActive, 1)).orderBy(asc(tools.sortOrder));
      res.json(activeTools);
    } catch (error) {
      console.error("Error fetching active tools:", error);
      res.status(500).json({ message: "Помилка отримання інструментів" });
    }
  });

  // Admin: Update tool
  app.patch("/api/admin/tools/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const toolId = req.params.id;
      const parsed = updateToolSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Невірні дані" });
      }
      const updates = { ...parsed.data, updatedAt: new Date() };
      await db.update(tools).set(updates).where(eq(tools.id, toolId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating tool:", error);
      res.status(500).json({ message: "Помилка оновлення інструменту" });
    }
  });

  // Admin: Create tool
  app.post("/api/admin/tools", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const parsed = createToolSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Невірні дані" });
      }
      const [newTool] = await db.insert(tools).values({
        id: parsed.data.id,
        nameRu: parsed.data.nameRu,
        nameUk: parsed.data.nameUk || "",
        nameEn: parsed.data.nameEn || "",
        category: parsed.data.category,
        creditCost: parsed.data.creditCost,
        isActive: parsed.data.isActive,
        sortOrder: parsed.data.sortOrder,
        iconName: parsed.data.iconName || "",
      }).returning();
      res.json(newTool);
    } catch (error) {
      console.error("Error creating tool:", error);
      res.status(500).json({ message: "Помилка створення інструменту" });
    }
  });

  // Admin: Delete tool
  app.delete("/api/admin/tools/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await db.delete(tools).where(eq(tools.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting tool:", error);
      res.status(500).json({ message: "Помилка видалення інструменту" });
    }
  });

  // ==================== CMS: SEO SETTINGS ====================

  // Get SEO settings (public)
  app.get("/api/seo", async (req, res) => {
    try {
      const seo = await db.select().from(seoSettings);
      res.json(seo);
    } catch (error) {
      console.error("Error fetching SEO:", error);
      res.status(500).json({ message: "Помилка отримання SEO" });
    }
  });

  // Get SEO for specific page
  app.get("/api/seo/:page", async (req, res) => {
    try {
      const [seo] = await db.select().from(seoSettings).where(eq(seoSettings.page, req.params.page));
      res.json(seo || null);
    } catch (error) {
      console.error("Error fetching SEO:", error);
      res.status(500).json({ message: "Помилка отримання SEO" });
    }
  });

  // Admin: Update SEO
  app.patch("/api/admin/seo/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const parsed = updateSeoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Невірні дані" });
      }
      const updates = { ...parsed.data, updatedAt: new Date() };
      await db.update(seoSettings).set(updates).where(eq(seoSettings.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating SEO:", error);
      res.status(500).json({ message: "Помилка оновлення SEO" });
    }
  });

  // Admin: Create SEO entry
  app.post("/api/admin/seo", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const parsed = createSeoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Невірні дані" });
      }
      const [newSeo] = await db.insert(seoSettings).values({
        id: parsed.data.page,
        page: parsed.data.page,
        titleRu: parsed.data.titleRu,
        titleUk: parsed.data.titleUk,
        titleEn: parsed.data.titleEn,
        descriptionRu: parsed.data.descriptionRu,
        descriptionUk: parsed.data.descriptionUk,
        descriptionEn: parsed.data.descriptionEn,
        keywordsRu: parsed.data.keywordsRu,
        keywordsUk: parsed.data.keywordsUk,
        keywordsEn: parsed.data.keywordsEn,
        ogImage: parsed.data.ogImage,
      }).returning();
      res.json(newSeo);
    } catch (error) {
      console.error("Error creating SEO:", error);
      res.status(500).json({ message: "Помилка створення SEO" });
    }
  });

  // Admin: Delete SEO
  app.delete("/api/admin/seo/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await db.delete(seoSettings).where(eq(seoSettings.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting SEO:", error);
      res.status(500).json({ message: "Помилка видалення SEO" });
    }
  });

  // ==================== PUBLIC: CREDIT PACKAGES & PRICING PLANS ====================

  // Get active credit packages (public)
  app.get("/api/credit-packages", async (req, res) => {
    try {
      const packages = await db.select().from(creditPackages)
        .where(eq(creditPackages.isActive, 1))
        .orderBy(asc(creditPackages.sortOrder));
      res.json(packages);
    } catch (error) {
      console.error("Error fetching credit packages:", error);
      res.status(500).json({ message: "Ошибка получения пакетов кредитов" });
    }
  });

  // Get active pricing plans (public)
  app.get("/api/pricing-plans", async (req, res) => {
    try {
      const plans = await db.select().from(pricingPlans)
        .where(eq(pricingPlans.isActive, 1))
        .orderBy(asc(pricingPlans.sortOrder));
      res.json(plans);
    } catch (error) {
      console.error("Error fetching pricing plans:", error);
      res.status(500).json({ message: "Ошибка получения тарифов" });
    }
  });

  // ==================== CMS: PAGE CONTENTS ====================

  // Get all page contents
  app.get("/api/content", async (req, res) => {
    try {
      const content = await db.select().from(pageContents);
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Помилка отримання контенту" });
    }
  });

  // Get content for specific page
  app.get("/api/content/:page", async (req, res) => {
    try {
      const content = await db.select().from(pageContents).where(eq(pageContents.page, req.params.page));
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Помилка отримання контенту" });
    }
  });

  // Admin: Update page content
  app.patch("/api/admin/content/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const parsed = updateContentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Невірні дані" });
      }
      const updates = { ...parsed.data, updatedAt: new Date() };
      await db.update(pageContents).set(updates).where(eq(pageContents.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ message: "Помилка оновлення контенту" });
    }
  });

  // Admin: Create page content
  app.post("/api/admin/content", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const parsed = createContentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Невірні дані" });
      }
      const [newContent] = await db.insert(pageContents).values({
        id: parsed.data.id,
        page: parsed.data.page,
        section: parsed.data.section,
        contentRu: parsed.data.contentRu,
        contentUk: parsed.data.contentUk,
        contentEn: parsed.data.contentEn,
        isActive: parsed.data.isActive,
      }).returning();
      res.json(newContent);
    } catch (error) {
      console.error("Error creating content:", error);
      res.status(500).json({ message: "Помилка створення контенту" });
    }
  });

  // Admin: Delete page content
  app.delete("/api/admin/content/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await db.delete(pageContents).where(eq(pageContents.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting content:", error);
      res.status(500).json({ message: "Помилка видалення контенту" });
    }
  });

  // ==================== PROVIDER CONFIGS ====================

  // Get all providers
  app.get("/api/admin/providers", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const providers = await db.select().from(providerConfigs).orderBy(providerConfigs.toolId, providerConfigs.priority);
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ message: "Помилка отримання провайдерів" });
    }
  });

  // Create provider
  app.post("/api/admin/providers", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { name, providerType, toolId, endpoint, apiKeyEnvVar, model, config, priority, isActive, isDefault } = req.body;
      const [newProvider] = await db.insert(providerConfigs).values({
        name,
        providerType,
        toolId,
        endpoint,
        apiKeyEnvVar,
        model,
        config: config || {},
        priority: priority || 1,
        isActive: isActive ?? 1,
        isDefault: isDefault ?? 0,
      }).returning();
      
      await logAuditAction(req.user?.id, 'create', 'provider', newProvider.id, null, newProvider, req);
      res.json(newProvider);
    } catch (error) {
      console.error("Error creating provider:", error);
      res.status(500).json({ message: "Помилка створення провайдера" });
    }
  });

  // Update provider
  app.patch("/api/admin/providers/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const oldProvider = await db.select().from(providerConfigs).where(eq(providerConfigs.id, req.params.id)).limit(1);
      
      const updates: any = { updatedAt: new Date() };
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.providerType !== undefined) updates.providerType = req.body.providerType;
      if (req.body.toolId !== undefined) updates.toolId = req.body.toolId;
      if (req.body.endpoint !== undefined) updates.endpoint = req.body.endpoint;
      if (req.body.apiKeyEnvVar !== undefined) updates.apiKeyEnvVar = req.body.apiKeyEnvVar;
      if (req.body.model !== undefined) updates.model = req.body.model;
      if (req.body.config !== undefined) updates.config = req.body.config;
      if (req.body.priority !== undefined) updates.priority = Number(req.body.priority);
      if (req.body.isActive !== undefined) updates.isActive = Number(req.body.isActive);
      if (req.body.isDefault !== undefined) updates.isDefault = Number(req.body.isDefault);

      await db.update(providerConfigs).set(updates).where(eq(providerConfigs.id, req.params.id));
      
      await logAuditAction(req.user?.id, 'update', 'provider', req.params.id, oldProvider[0], updates, req);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating provider:", error);
      res.status(500).json({ message: "Помилка оновлення провайдера" });
    }
  });

  // Delete provider
  app.delete("/api/admin/providers/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const oldProvider = await db.select().from(providerConfigs).where(eq(providerConfigs.id, req.params.id)).limit(1);
      await db.delete(providerConfigs).where(eq(providerConfigs.id, req.params.id));
      
      await logAuditAction(req.user?.id, 'delete', 'provider', req.params.id, oldProvider[0], null, req);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting provider:", error);
      res.status(500).json({ message: "Помилка видалення провайдера" });
    }
  });

  // Test provider health
  app.post("/api/admin/providers/:id/test", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { ProviderFactory } = await import('./providers');
      const result = await ProviderFactory.checkProviderHealth(req.params.id);
      res.json(result);
    } catch (error: any) {
      console.error("Error testing provider:", error);
      res.status(500).json({ healthy: false, message: error.message });
    }
  });

  // ==================== AI JOBS ====================

  // Get all jobs with pagination
  app.get("/api/admin/jobs", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string;
      
      let jobs;
      if (status) {
        jobs = await db.select().from(aiJobs).where(eq(aiJobs.status, status)).orderBy(desc(aiJobs.createdAt)).limit(limit).offset(offset);
      } else {
        jobs = await db.select().from(aiJobs).orderBy(desc(aiJobs.createdAt)).limit(limit).offset(offset);
      }
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Помилка отримання завдань" });
    }
  });

  // Get job stats
  app.get("/api/admin/jobs/stats", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const stats = await db.execute(sql`
        SELECT 
          status,
          COUNT(*) as count,
          AVG(processing_time_ms) as avg_time
        FROM ai_jobs
        GROUP BY status
      `);
      res.json(stats.rows);
    } catch (error) {
      console.error("Error fetching job stats:", error);
      res.status(500).json({ message: "Помилка отримання статистики" });
    }
  });

  // Cancel job
  app.post("/api/admin/jobs/:id/cancel", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await db.update(aiJobs).set({ status: 'cancelled' }).where(eq(aiJobs.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error cancelling job:", error);
      res.status(500).json({ message: "Помилка скасування завдання" });
    }
  });

  // Retry job
  app.post("/api/admin/jobs/:id/retry", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await db.update(aiJobs).set({ 
        status: 'queued', 
        errorMessage: null,
        startedAt: null,
        completedAt: null 
      }).where(eq(aiJobs.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error retrying job:", error);
      res.status(500).json({ message: "Помилка повтору завдання" });
    }
  });

  // ==================== ENV OVERRIDES ====================

  // Get all env overrides
  app.get("/api/admin/env", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const envs = await db.select().from(envOverrides).orderBy(envOverrides.category, envOverrides.key);
      const masked = envs.map(e => ({
        ...e,
        value: e.isSecret ? '••••••••' : e.value
      }));
      res.json(masked);
    } catch (error) {
      console.error("Error fetching env:", error);
      res.status(500).json({ message: "Помилка отримання конфігів" });
    }
  });

  // Create/Update env override
  app.post("/api/admin/env", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { key, value, description, category, isSecret } = req.body;
      
      const existing = await db.select().from(envOverrides).where(eq(envOverrides.key, key)).limit(1);
      
      if (existing.length > 0) {
        await db.update(envOverrides).set({
          value,
          description,
          category: category || 'general',
          isSecret: isSecret ?? 0,
          updatedBy: req.user?.id,
          updatedAt: new Date()
        }).where(eq(envOverrides.key, key));
        
        await logAuditAction(req.user?.id, 'update', 'env', key, { key: existing[0].key }, { key, category }, req);
      } else {
        await db.insert(envOverrides).values({
          key,
          value,
          description,
          category: category || 'general',
          isSecret: isSecret ?? 0,
          updatedBy: req.user?.id,
        });
        
        await logAuditAction(req.user?.id, 'create', 'env', key, null, { key, category }, req);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving env:", error);
      res.status(500).json({ message: "Помилка збереження конфігу" });
    }
  });

  // Delete env override
  app.delete("/api/admin/env/:key", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await db.delete(envOverrides).where(eq(envOverrides.key, req.params.key));
      await logAuditAction(req.user?.id, 'delete', 'env', req.params.key, null, null, req);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting env:", error);
      res.status(500).json({ message: "Помилка видалення конфігу" });
    }
  });

  // ==================== AUDIT LOGS ====================

  // Get audit logs
  app.get("/api/admin/audit", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Помилка отримання логів" });
    }
  });

  // ==================== ANALYTICS ====================

  // Get analytics summary
  app.get("/api/admin/analytics", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const period = (req.query.period as string) || '30d';
      let days = 30;
      if (period === '7d') days = 7;
      if (period === '90d') days = 90;

      const intervalStr = `${days} days`;

      const revenueStats = await db.execute(sql`
        SELECT 
          COALESCE(SUM(amount), 0) as total_revenue,
          COUNT(*) as total_payments
        FROM payments 
        WHERE status = 'success' 
        AND created_at > NOW() - CAST(${intervalStr} AS INTERVAL)
      `);

      const userStats = await db.execute(sql`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN created_at > NOW() - CAST(${intervalStr} AS INTERVAL) THEN 1 END) as new_users
        FROM users
      `);

      const jobStats = await db.execute(sql`
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(CASE WHEN status = 'done' THEN 1 END) as completed_jobs,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_jobs,
          AVG(processing_time_ms) as avg_processing_time
        FROM ai_jobs
        WHERE created_at > NOW() - CAST(${intervalStr} AS INTERVAL)
      `);

      const toolUsage = await db.execute(sql`
        SELECT 
          tool_id,
          COUNT(*) as usage_count
        FROM ai_jobs
        WHERE created_at > NOW() - CAST(${intervalStr} AS INTERVAL)
        GROUP BY tool_id
        ORDER BY usage_count DESC
        LIMIT 10
      `);

      res.json({
        revenue: revenueStats.rows?.[0] || { total_revenue: 0, total_payments: 0 },
        users: userStats.rows?.[0] || { total_users: 0, new_users: 0 },
        jobs: jobStats.rows?.[0] || { total_jobs: 0, completed_jobs: 0, failed_jobs: 0, avg_processing_time: null },
        toolUsage: toolUsage.rows || [],
        period
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Помилка отримання аналітики" });
    }
  });

  // ==================== EXPORT ====================

  // Export users
  app.get("/api/admin/export/users", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        credits: users.credits,
        plan: users.plan,
        createdAt: users.createdAt,
      }).from(users);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=users_${new Date().toISOString().split('T')[0]}.json`);
      res.json(allUsers);
    } catch (error) {
      console.error("Error exporting users:", error);
      res.status(500).json({ message: "Помилка експорту" });
    }
  });

  // Export payments
  app.get("/api/admin/export/payments", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const allPayments = await db.select().from(payments);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=payments_${new Date().toISOString().split('T')[0]}.json`);
      res.json(allPayments);
    } catch (error) {
      console.error("Error exporting payments:", error);
      res.status(500).json({ message: "Помилка експорту" });
    }
  });

  // Export configs
  app.get("/api/admin/export/config", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const allProviders = await db.select().from(providerConfigs);
      const allTools = await db.select().from(tools);
      const allEnv = await db.select({
        key: envOverrides.key,
        description: envOverrides.description,
        category: envOverrides.category,
        isSecret: envOverrides.isSecret,
      }).from(envOverrides);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=config_${new Date().toISOString().split('T')[0]}.json`);
      res.json({
        providers: allProviders,
        tools: allTools,
        envKeys: allEnv,
        exportedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error exporting config:", error);
      res.status(500).json({ message: "Помилка експорту" });
    }
  });

  // Helper function for audit logging
  async function logAuditAction(
    userId: string | undefined,
    action: string,
    entityType: string,
    entityId: string | null,
    oldValue: any,
    newValue: any,
    req: any
  ) {
    try {
      await db.insert(auditLogs).values({
        userId: userId || null,
        action,
        entityType,
        entityId,
        oldValue,
        newValue,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
        userAgent: req.headers['user-agent'] || null,
      });
    } catch (err) {
      console.error("Error logging audit:", err);
    }
  }
}
