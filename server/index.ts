import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import path from "path";

const app = express();

// Trust proxy settings (consolidated here)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  const server = createServer(app);

  // Set up static file serving and vite middleware
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    // In production, serve from the dist/public directory
    const distPath = path.join(process.cwd(), "dist", "public");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Register API routes
  registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // Use Replit's port for production deployment
  const PORT = process.env.PORT || 3000;
  const HOST = "0.0.0.0";

  server.listen(PORT, HOST, () => {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    console.log(`${formattedTime} [express] Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
})();
