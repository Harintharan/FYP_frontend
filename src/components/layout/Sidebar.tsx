import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Truck,
  AlertTriangle,
  QrCode,
  Settings,
  Map,
  BarChart3,
  PlusCircle,
  LogOut,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useLocation, useNavigate } from "react-router-dom";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user, setUser } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  const getNavigationItems = () => {
    const baseItems = [
      { path: "/", label: "Dashboard", icon: LayoutDashboard },
      { path: "/products", label: "Products", icon: Package },
      { path: "/alerts", label: "Alerts", icon: AlertTriangle },
      { path: "/handover", label: "Handover", icon: Truck },
      { path: "/tracking", label: "Live Tracking", icon: Map },
      { path: "/analytics", label: "Analytics", icon: BarChart3 },
    ];

    if (user?.role === "MANUFACTURER") {
      baseItems.splice(2, 0, {
        path: "/products/create",
        label: "Create Product",
        icon: PlusCircle,
      });
    }

    // if (user?.role === "DISTRIBUTOR") {
    //   baseItems.splice(2, 0, {
    //     path: "/handover",
    //     label: "Distribution",
    //     icon: Truck,
    //   });
    // }

    // if (user?.role === "HEALTHCARE_PROVIDER") {
    //   baseItems.splice(2, 0, {
    //     path: "/handover",
    //     label: "Administer",
    //     icon: Package,
    //   });
    // }

    baseItems.push(
      { path: "/qr-scan", label: "QR Scanner", icon: QrCode },
      { path: "/settings", label: "Settings", icon: Settings }
    );

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  const handleLogout = () => {
    setUser(null);
    navigate("/login");
  };

  return (
    <div className={cn("flex flex-col w-64 bg-card border-r h-full", className)}>
      <div className="p-6 flex-1 flex flex-col">
        <h2 className="font-semibold text-lg mb-6">Navigation</h2>

        {/* Main Navigation */}
        <nav className="space-y-2 flex-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + "/");

            return (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20 glow-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="mt-6 border-t pt-4">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
