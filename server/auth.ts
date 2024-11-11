import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema, type User as SelectUser } from "db/schema";
import { db } from "db";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const isDevelopment = process.env.NODE_ENV === "development";
  const HOST = process.env.HOST || "0.0.0.0";
  const PORT = parseInt(process.env.PORT || "5000", 10);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || process.env.REPL_ID || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: {
      secure: !isDevelopment,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: isDevelopment ? 'lax' : 'strict',
      path: '/',
      domain: isDevelopment ? undefined : process.env.REPL_SLUG ? '.repl.co' : undefined
    },
    name: 'session.id',
    proxy: true,
    rolling: true // Refresh session with each request
  };

  app.set('trust proxy', 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`[Auth] Login attempt for user: ${username}`);
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user) {
          console.log(`[Auth] User not found: ${username}`);
          return done(null, false, { message: "Incorrect username or password." });
        }

        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          console.log(`[Auth] Invalid password for user: ${username}`);
          return done(null, false, { message: "Incorrect username or password." });
        }

        console.log(`[Auth] Login successful for user: ${username}`);
        return done(null, user);
      } catch (err) {
        console.error("[Auth] Login error:", err);
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    console.log(`[Auth] Serializing user: ${user.username}`);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`[Auth] Deserializing user ID: ${id}`);
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      
      if (!user) {
        console.log(`[Auth] User not found for ID: ${id}`);
        return done(null, false);
      }
      
      console.log(`[Auth] Successfully deserialized user: ${user.username}`);
      done(null, user);
    } catch (err) {
      console.error("[Auth] Deserialization error:", err);
      done(err);
    }
  });

  // Enhanced logout route with better session cleanup
  app.post("/logout", (req, res) => {
    if (req.user) {
      const username = (req.user as SelectUser).username;
      console.log(`[Auth] Logging out user: ${username}`);
      
      req.logout((err) => {
        if (err) {
          console.error("[Auth] Logout error:", err);
          return res.status(500).json({ message: "Logout failed" });
        }
        
        req.session.destroy((err) => {
          if (err) {
            console.error("[Auth] Session destruction error:", err);
            return res.status(500).json({ message: "Logout failed" });
          }
          
          // Clear session cookie with same settings as it was set
          const cookieOptions = {
            path: '/',
            httpOnly: true,
            secure: !isDevelopment,
            sameSite: isDevelopment ? 'lax' : 'strict',
            domain: isDevelopment ? undefined : process.env.REPL_SLUG ? '.repl.co' : undefined
          };
          
          res.clearCookie('session.id', cookieOptions);
          
          console.log(`[Auth] Logout successful for user: ${username}`);
          res.json({ message: "Logout successful" });
        });
      });
    } else {
      console.log("[Auth] Logout requested but no user session found");
      res.status(200).json({ message: "No active session" });
    }
  });

  app.post("/login", (req, res, next) => {
    console.log("[Auth] Login attempt:", req.body.username);
    passport.authenticate("local", (err: any, user: Express.User, info: IVerifyOptions) => {
      if (err) {
        console.error("[Auth] Login error:", err);
        return next(err);
      }
      if (!user) {
        console.log("[Auth] Login failed:", info.message);
        return res.status(400).json({
          message: info.message ?? "Login failed",
        });
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error("[Auth] Session creation error:", err);
          return next(err);
        }
        console.log(`[Auth] Login successful: ${user.username}`);
        return res.json({
          message: "Login successful",
          user: { id: user.id, username: user.username },
        });
      });
    })(req, res, next);
  });

  app.post("/register", async (req, res, next) => {
    try {
      console.log("[Auth] Registration attempt:", req.body.username);
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        console.log("[Auth] Registration validation failed:", result.error);
        return res
          .status(400)
          .json({ message: "Invalid input", errors: result.error.flatten() });
      }

      const { username, password } = result.data;

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        console.log(`[Auth] Username already exists: ${username}`);
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await crypto.hash(password);
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          password: hashedPassword,
        })
        .returning();

      console.log(`[Auth] User registered successfully: ${username}`);

      req.login(newUser, (err) => {
        if (err) {
          console.error("[Auth] Auto-login after registration failed:", err);
          return next(err);
        }
        return res.json({
          message: "Registration successful",
          user: { id: newUser.id, username: newUser.username },
        });
      });
    } catch (error) {
      console.error("[Auth] Registration error:", error);
      next(error);
    }
  });

  app.get("/api/user", requireAuth, (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    console.log(`[Auth] User session verified: ${req.user.username}`);
    res.json(req.user);
  });

  return { requireAuth };
}
