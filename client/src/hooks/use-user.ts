import useSWR from "swr";
import type { User, InsertUser } from "db/schema";
import { useEffect } from "react";

export function useUser() {
  const { data, error, mutate } = useSWR<User, Error>("/api/user", {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    refreshInterval: 0,
    dedupingInterval: 0,
    credentials: 'include'
  });

  // Add logging for debugging
  useEffect(() => {
    if (data) {
      console.log("[Auth] User state updated:", { id: data.id, username: data.username });
    }
    if (error) {
      console.error("[Auth] Authentication error:", error);
    }
  }, [data, error]);

  return {
    user: data,
    isLoading: !error && !data,
    error,
    login: async (user: InsertUser) => {
      try {
        console.log("[Auth] Attempting login...");
        const response = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
          credentials: "include",
        });

        const data = await response.json();
        console.log("[Auth] Login response:", data);
        
        if (!response.ok) {
          console.error("[Auth] Login failed:", data.message);
          return { ok: false, message: data.message };
        }

        console.log("[Auth] Login successful, invalidating user cache");
        await mutate(); // Force revalidation of user data after login
        return { ok: true };
      } catch (e: any) {
        console.error("[Auth] Login error:", e);
        return { 
          ok: false, 
          message: e.message || "Failed to connect to the server" 
        };
      }
    },
    logout: async () => {
      try {
        console.log("[Auth] Attempting logout...");
        const response = await fetch("/logout", {
          method: "POST",
          credentials: "include",
        });

        const data = await response.json();
        
        if (!response.ok) {
          console.error("[Auth] Logout failed:", data.message);
          return { ok: false, message: data.message };
        }

        console.log("[Auth] Logout successful, clearing user cache");
        await mutate(undefined, { revalidate: false }); // Clear user data without revalidating
        return { ok: true };
      } catch (e: any) {
        console.error("[Auth] Logout error:", e);
        return { 
          ok: false, 
          message: e.message || "Failed to connect to the server" 
        };
      }
    },
    register: async (user: InsertUser) => {
      try {
        console.log("[Auth] Attempting registration...");
        const response = await fetch("/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
          credentials: "include",
        });

        const data = await response.json();
        console.log("[Auth] Registration response:", data);
        
        if (!response.ok) {
          console.error("[Auth] Registration failed:", data.message);
          return { ok: false, message: data.message };
        }

        console.log("[Auth] Registration successful, invalidating user cache");
        await mutate(); // Force revalidation of user data after registration
        return { ok: true };
      } catch (e: any) {
        console.error("[Auth] Registration error:", e);
        return { 
          ok: false, 
          message: e.message || "Failed to connect to the server" 
        };
      }
    },
  };
}
