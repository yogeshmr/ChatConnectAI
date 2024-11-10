import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { useUser } from "../hooks/use-user";
import { insertUserSchema, type InsertUser } from "db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, user, isLoading: userLoading } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Handle redirection when user state updates
  useEffect(() => {
    if (user) {
      console.log("[Auth] User authenticated, redirecting to homepage");
      setLocation("/");
    }
  }, [user, setLocation]);

  // Don't render form if user is already logged in
  if (userLoading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return null;
  }

  const onSubmit = async (data: InsertUser) => {
    setIsLoading(true);
    try {
      console.log("[Auth] Submitting login form");
      const result = await login(data);
      console.log("[Auth] Login response:", result);
      console.log("[Auth] User state after login:", user);
      if (result.ok) {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        // Redirection will be handled by the useEffect hook when user state updates
      } else {
        console.error("[Auth] Login form submission failed:", result.message);
        toast({
          title: "Login Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[Auth] Unexpected error during login:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Button
              variant="link"
              className="p-0"
              onClick={() => setLocation("/register")}
              disabled={isLoading}
            >
              Register
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}