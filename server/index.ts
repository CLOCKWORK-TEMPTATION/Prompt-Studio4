import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { setupWebSocket } from "./websocket";
import { initializeCacheCleanup, shutdownCacheCleanup } from "./services/CacheCleanupScheduler";
import { monitoringService } from "./services/MonitoringService";
import { alertService } from "./services/AlertService";
import { setupMonitoringMiddleware } from "./middleware/monitoring";
import monitoringRoutes from "./routes/monitoring";
import agentRouter from "./controllers/AgentController";
import "./services/QueueService"; // Start workers
import { securityHeaders, generalRateLimiter, requestId, validateContentLength } from "./middleware/security";
import { csrfProtection, attachCsrfToken, getCsrfToken } from "./middleware/csrf";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

import { ensureAuthenticated } from "./middleware/auth";

// Security middleware
app.use(requestId);
app.use(securityHeaders);

// Auth Middleware (Global for /api, exclude /auth and /health)
app.use('/api', (req, res, next) => {
  const openPaths = ['/auth/login', '/auth/register', '/auth/logout', '/health'];
  if (openPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  ensureAuthenticated(req, res, next);
});

// Content length validation (10MB max for most requests)
app.use(validateContentLength(10 * 1024 * 1024));

// Rate limiting for API routes
app.use('/api', generalRateLimiter);
app.use('/api/agents', agentRouter);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:3001,http://localhost:5000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .filter((origin) => {
    // Validate origin format to prevent SSRF
    try {
      const url = new URL(origin);
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        return false;
      }
      // Always block private IP ranges and localhost (CWE-918)
      const hostname = url.hostname.toLowerCase();
      const privatePatterns = [
        /^localhost$/,
        /^127\.\d+\.\d+\.\d+$/,
        /^0\.0\.0\.0$/,
        /^::1$/,
        /^::$/,
        /^192\.168\.\d+\.\d+$/,
        /^10\.\d+\.\d+\.\d+$/,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/,
        /^169\.254\.\d+\.\d+$/,
        /^\[::1\]$/,
        /^\[::1\]:\d+$/
      ];

      for (const pattern of privatePatterns) {
        if (pattern.test(hostname)) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  });

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// Session configuration (PostgreSQL store)
const PgSession = connectPgSimple(session);
app.set("trust proxy", 1);
app.use(
  session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      tableName: "session",
    }),
    secret: process.env.SESSION_SECRET || "dev-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
    name: "psid",
  }),
);

// Passport configuration
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { users } from "@shared/schema";
import { db } from "./storage";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import authRoutes from "./routes/auth";

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) return done(null, false, { message: "Invalid credentials" });
    if (!user.password) return done(null, false, { message: "Invalid credentials" }); // No password set (oauth user?)

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return done(null, false, { message: "Invalid credentials" });

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Mount Auth Routes
app.use("/api/auth", authRoutes);

// Sanitize log messages to prevent log injection
function sanitizeLogMessage(message: string): string {
  return message.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${sanitizeLogMessage(message)}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const method = sanitizeLogMessage(req.method);
      const sanitizedPath = sanitizeLogMessage(path);
      let logLine = `${method} ${sanitizedPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // بدء خدمة المراقبة
  monitoringService.start(30000); // كل 30 ثانية
  log("Monitoring service started", "monitoring");

  // إضافة CSRF token إلى response headers
  app.use(attachCsrfToken);

  // مسار للحصول على CSRF token
  app.get('/api/csrf-token', getCsrfToken);

  // تطبيق حماية CSRF على جميع مسارات API (ما عدا GET)
  app.use('/api', csrfProtection);

  log("Registering routes...", "server");
  await registerRoutes(httpServer, app);
  log("Routes registered successfully", "server");

  // إعداد middleware المراقبة
  setupMonitoringMiddleware(app);

  // إضافة مسارات المراقبة
  app.use('/api/monitoring', monitoringRoutes);

  // Setup WebSocket server
  setupWebSocket(httpServer);
  log("WebSocket server initialized", "websocket");

  // Initialize cache cleanup scheduler (disabled for testing)
  // initializeCacheCleanup();
  // log("Cache cleanup scheduler initialized", "cache");

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  log("Setting up static serving...", "server");
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
    log("Static files setup complete", "server");
  } else {
    // في development mode، الـ Vite يشتغل standalone على port 3000
    // ويعمل proxy للـ backend على port 3001
    log("Development mode: Vite runs standalone", "server");
  }

  // ALWAYS serve the app on port 3001 for development, 5000 for production
  // Other ports are firewalled. Default to 3001 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "3001", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );

  // Graceful shutdown handler
  const gracefulShutdown = (signal: string) => {
    log(`${signal} received, shutting down gracefully...`, "server");

    // إيقاف خدمة المراقبة
    monitoringService.stop();
    log("Monitoring service stopped", "monitoring");

    // إيقاف مُجدول التنظيف
    shutdownCacheCleanup();
    log("Cache cleanup scheduler stopped", "cache");

    // إغلاق الخادم
    httpServer.close(() => {
      log("HTTP server closed", "server");
      process.exit(0);
    });

    // إجبار الإغلاق بعد 10 ثواني
    setTimeout(() => {
      log("Forcing shutdown...", "server");
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
})();
