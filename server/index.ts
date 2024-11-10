import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { setupAuth } from "./auth";
import { createServer } from "http";
import path from "path";

const app = express();

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Trust proxy settings for production
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

(async () => {
  const server = createServer(app);

  // Setup authentication first
  setupAuth(app);

  // Register API routes after auth
  registerRoutes(app);

  // Set up Vite or static file serving after API routes
  if (process.env.NODE_ENV !== "production") {
    console.log("[express] Setting up Vite middleware...");
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

  // Parse PORT as number to fix type error
  const PORT = parseInt(process.env.PORT || "5000", 10);
  const HOST = "0.0.0.0";

  server.listen(PORT, HOST, () => {
    console.log(`[express] Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
})();
