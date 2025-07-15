import { useState } from "react";
import { Menu, X, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Sidebar from "./sidebar";
import { useLocation } from "wouter";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location, navigate] = useLocation();

  const logout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/new-entry":
        return "New Product Entry";
      case "/scan":
        return "Scan Products";
      case "/farms":
        return "Farms";
      case "/users":
        return "Users";
      case "/map":
        return "Map";
      case "/warehouses":
        return "Warehouses";
      case "/lots":
        return "Lots";
      case "/reports":
        return "Reports";
      case "/statistics":
        return "Statistics";
      default:
        return "Dashboard";
    }
  };

  const getPageSubtitle = () => {
    switch (location) {
      case "/new-entry":
        return "Add a new product to your inventory";
      case "/scan":
        return "Scan barcodes or enter manually";
      case "/warehouses":
        return "Manage your warehouses";
      case "/lots":
        return "Manage your lots";
      case "/reports":
        return "View and download reports";
      case "/statistics":
        return "View detailed statistics and analytics";
      default:
        return "";
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Mobile Sidebar Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div>
              <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
              {getPageSubtitle() && (
                <p className="text-sm text-neutral-500">{getPageSubtitle()}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/communication-dashboard')}>
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={logout}>
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

  

        {/* Page Content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
