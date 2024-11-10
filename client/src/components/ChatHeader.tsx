import { useUser } from "../hooks/use-user";
import { useLocation } from "wouter";
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
  Menu,
  HelpCircle,
  BookOpen,
  Package,
  Building2,
  Wrench,
  Cpu,
  Zap,
  Sliders,
  BarChart3,
  Play,
  Shield,
  CircuitBoard,
  FileText,
  Boxes,
  ListTodo,
  TestTube,
  Factory,
  Users,
  Briefcase,
  Phone,
  Newspaper,
  LineChart,
  PieChart,
} from "lucide-react";

export default function ChatHeader() {
  const { user, logout } = useUser();
  const [, setLocation] = useLocation();

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Research</DropdownMenuLabel>
              <DropdownMenuItem>
                <Cpu className="mr-2 h-4 w-4" />
                Analog Electronics
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CircuitBoard className="mr-2 h-4 w-4" />
                Digital Electronics
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Zap className="mr-2 h-4 w-4" />
                Power Electronics
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Sliders className="mr-2 h-4 w-4" />
                Control Systems
              </DropdownMenuItem>
              <DropdownMenuItem>
                <PieChart className="mr-2 h-4 w-4" />
                Signal Processing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BarChart3 className="mr-2 h-4 w-4" />
                Analysis
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Play className="mr-2 h-4 w-4" />
                Simulation
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Shield className="mr-2 h-4 w-4" />
                EMI_EMC
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Wrench className="mr-2 h-4 w-4" />
                PCB Design
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                Standards
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Products</DropdownMenuLabel>
              <DropdownMenuItem>
                <Wrench className="mr-2 h-4 w-4" />
                Design Tools
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BarChart3 className="mr-2 h-4 w-4" />
                Analysis
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Play className="mr-2 h-4 w-4" />
                Simulation
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Boxes className="mr-2 h-4 w-4" />
                BOM
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ListTodo className="mr-2 h-4 w-4" />
                Prototyping
              </DropdownMenuItem>
              <DropdownMenuItem>
                <TestTube className="mr-2 h-4 w-4" />
                Testing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Factory className="mr-2 h-4 w-4" />
                Manufacturing
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Company</DropdownMenuLabel>
              <DropdownMenuItem>
                <Building2 className="mr-2 h-4 w-4" />
                About Us
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Users className="mr-2 h-4 w-4" />
                Our Team
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Briefcase className="mr-2 h-4 w-4" />
                Careers
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Phone className="mr-2 h-4 w-4" />
                Contact
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Newspaper className="mr-2 h-4 w-4" />
                Blog
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>
                  Documentation
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Contact Support
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
