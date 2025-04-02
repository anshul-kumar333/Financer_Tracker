
import { Link, useLocation } from "wouter";
import { HomeIcon, PlusCircleIcon, PieChartIcon, BellIcon, UserIcon, LogOutIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/", icon: HomeIcon, label: "Home" },
  { href: "/add", icon: PlusCircleIcon, label: "Add" },
  { href: "/analytics", icon: PieChartIcon, label: "Analytics" },
  { href: "/reminders", icon: BellIcon, label: "Reminders" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Don't show header or navbar on auth page
  const isAuthPage = location === "/auth";
  if (isAuthPage) {
    return <div className="min-h-screen bg-[#F8F9FA]">{children}</div>;
  }
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {user && (
        <header className="bg-white border-b border-gray-200 py-3 px-4 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-semibold text-primary">Finance Tracker</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled className="font-medium">
                  {user.username}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOutIcon className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
      )}
      
      <div className="max-w-2xl mx-auto pb-32 p-4">
        {children}
      </div>
      
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-around py-2">
              {navItems.map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href}>
                  <div className="flex flex-col items-center p-2 text-gray-600 hover:text-blue-500 cursor-pointer">
                    <Icon className={`h-6 w-6 ${location === href ? 'text-primary' : ''}`} />
                    <span className={`text-xs mt-1 ${location === href ? 'text-primary font-medium' : ''}`}>{label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
