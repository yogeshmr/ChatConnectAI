import useSWR from "swr";
import type { User, InsertUser } from "db/schema";
import { useEffect } from "react";
import { useLocation } from "wouter";

export function useUser() {
  const [location, setLocation] = useLocation();
  const { data, error, mutate } = useSWR<User, Error>("/api/user", {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    refreshInterval: 0,
    dedupingInterval: 0,
    errorRetryCount: 0
  });

  // Add logging for debugging
  useEffect(() => {
    if (data) {
      console.log("[Auth] User state updated:", { id: data.id, username: data.username });
    }
    if (error) {
      console.log("[Auth] Authentication error:", error);
      if (error.message === "Authentication required" && 
          !location.startsWith("/login") && 
          !location.startsWith("/register")) {
        console.log("[Auth] Redirecting to login due to authentication error");
        setLocation("/login");
      }
    }
  }, [data, error, setLocation, location]);

  const clearAllCookies = () => {
    // Get all cookies and remove them
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      // Remove cookie for all possible paths and domains
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
    }
  };

  const clearLocalStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error("[Auth] Error clearing storage:", error);
    }
  };

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
        
        // First, clear all client-side state
        clearLocalStorage();
        clearAllCookies();
        
        // Clear the SWR cache and set user to undefined
        await mutate(undefined, { 
          revalidate: false,
          rollbackOnError: false,
          populateCache: false 
        });

        // Make the logout request
        const response = await fetch("/logout", {
          method: "POST",
          credentials: "include",
        });

        let result = { ok: true };
        try {
          const data = await response.json();
          if (!response.ok) {
            console.error("[Auth] Logout failed:", data.message);
            result = { ok: false, message: data.message };
          }
        } catch (e) {
          console.warn("[Auth] Could not parse logout response:", e);
        }

        // Redirect to login page immediately after clearing state
        console.log("[Auth] Logout complete, redirecting to login");
        setLocation("/login");
        
        return result;
      } catch (e: any) {
        console.error("[Auth] Logout error:", e);
        // Still clear state and redirect on error
        clearLocalStorage();
        clearAllCookies();
        setLocation("/login");
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
