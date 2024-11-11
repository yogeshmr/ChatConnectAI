import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { setupAuth } from "./auth";
import { setupSandbox } from "./sandbox";
import { createServer } from "http";

const app = express();

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// CORS configuration
const isDevelopment = process.env.NODE_ENV === "development";
const HOST = process.env.HOST || "0.0.0.0";
const PORT = parseInt(process.env.PORT || "5000", 10);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      `http://${HOST}:${PORT}`,
      `http://localhost:${PORT}`,
      `http://localhost:3000`,
      `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`,
    ];
    const pattern = /\.repl\.co$/;
    
    if (!origin || allowedOrigins.includes(origin) || pattern.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS before any route handlers
app.use(cors(corsOptions));

// Trust proxy settings for proper cookie handling in Replit environment
app.set("trust proxy", 1);

// Global error handler for authentication
const handleAuthError = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[Auth] Error:", err);
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next(err);
};

(async () => {
  const server = createServer(app);

  // Setup authentication first - before any routes
  const { requireAuth } = setupAuth(app);

  // Add authentication error handler
  app.use(handleAuthError);

  // Setup sandbox
  setupSandbox(app);

  // API request handling middleware with detailed logging
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || ['/login', '/register', '/logout'].includes(req.path)) {
      console.log(`[API] ${req.method} ${req.path}`);
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Pragma', 'no-cache');
    }
    next();
  });

  // Register API routes with authentication
  registerRoutes(app);

  // Set up Vite or static file serving
  if (isDevelopment) {
    console.log("[express] Setting up Vite development server...");
    await setupVite(app, server);
  } else {
    console.log("[express] Setting up static file serving...");
    serveStatic(app);
  }

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[express] Error:", err.stack);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  server.listen(PORT, HOST, () => {
    console.log(`[express] Server running at http://${HOST}:${PORT}`);
    console.log(`[express] Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`[express] CORS configuration enabled`);
  });
})();
