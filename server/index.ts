import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { setupAuth } from "./auth";
import { createServer } from "http";

const app = express();

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Trust proxy settings for production
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

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
  setupAuth(app);

  // Add authentication error handler
  app.use(handleAuthError);

  // API request handling middleware
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || ['/login', '/register', '/logout'].includes(req.path)) {
      console.log(`[API] ${req.method} ${req.path}`);
      res.type('application/json');
    }
    next();
  });

  // Register API routes
  registerRoutes(app);

  // Set up Vite or static file serving
  if (process.env.NODE_ENV === "development") {
    console.log("[express] Setting up Vite development server...");
    await setupVite(app, server);
  } else {
    console.log("[express] Setting up static file serving...");
    serveStatic(app);
  }

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[express] Error:", err.stack);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // Get port from environment, defaulting to 5000 if not specified
  const PORT = parseInt(process.env.PORT || "5000", 10);
  const HOST = "0.0.0.0";

  server.listen(PORT, HOST, () => {
    console.log(`[express] Server running at http://${HOST}:${PORT}`);
    console.log(`[express] Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`[express] Port: ${PORT}`);
  });
})();
