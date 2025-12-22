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
import { securityHeaders, generalRateLimiter, requestId, validateContentLength } from "./middleware/security";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Security middleware
app.use(requestId);
app.use(securityHeaders);

// Content length validation (10MB max for most requests)
app.use(validateContentLength(10 * 1024 * 1024));

// Rate limiting for API routes
app.use('/api', generalRateLimiter);

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
  .filter(Boolean);

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

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
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
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// إعداد middleware المراقبة
setupMonitoringMiddleware(app);

// إضافة مسارات المراقبة
app.use('/api/monitoring', monitoringRoutes);

(async () => {
  // بدء خدمة المراقبة
  monitoringService.start(30000); // كل 30 ثانية
  log("Monitoring service started", "monitoring");

  await registerRoutes(httpServer, app);

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
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
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
