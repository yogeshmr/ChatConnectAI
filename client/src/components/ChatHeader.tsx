import { useUser } from "../hooks/use-user";
import { useLocation } from "wouter";
import { useChat } from "../hooks/use-chat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  User,
  Settings,
  LogOut,
} from "lucide-react";

interface ChatHeaderProps {
  children?: React.ReactNode;
}

export default function ChatHeader({ children }: ChatHeaderProps) {
  const { user, logout } = useUser();
  const [, setLocation] = useLocation();
  const { resetChat } = useChat();

  const handleLogout = async () => {
    try {
      console.log("[Auth] Starting logout process");
      
      // Reset chat state before logout to prevent state persistence issues
      resetChat();
      
      // Perform logout
      const result = await logout();
      
      if (!result.ok) {
        console.error("[Auth] Logout failed:", result.message);
        // Redirect to login even on error to ensure user is logged out
        setLocation("/login");
      }
    } catch (error) {
      console.error("[Auth] Logout error:", error);
      // Force redirect to login on error
      setLocation("/login");
    }
  };

  if (!user) {
    return (
      <header className="border-b p-4">
        <div className="flex justify-between items-center max-w-3xl mx-auto">
          <h1 className="text-xl font-semibold">gibivi.ai</h1>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setLocation("/login")}>
              Login
            </Button>
            <Button onClick={() => setLocation("/register")}>
              Register
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b p-4">
      <div className="flex justify-between items-center max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          {children}
          <h1 className="text-xl font-semibold">gibivi.ai</h1>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              Account
            </DropdownMenuLabel>
            <DropdownMenuItem disabled>
              {user.username}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Preferences
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
