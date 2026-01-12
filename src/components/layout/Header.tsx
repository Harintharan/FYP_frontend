import {
  Bell,
  User,
  Package,
  Truck,
  Warehouse,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import { useDisconnect } from "wagmi";
import { NotificationBell } from "@/components/NotificationBell";

interface HeaderProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export function Header({ onMenuClick, isMobile = false }: HeaderProps) {
  const { user, unreadAlertsCount, logout, role } = useAppStore();
  const navigate = useNavigate();
  const { disconnect } = useDisconnect();

  const handleLogout = () => {
    logout();
    disconnect();
    navigate("/login");
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case "MANUFACTURER":
        return Package;
      case "TRANSPORTER":
        return Truck;
      case "WAREHOUSE":
        return Warehouse;
      case "WHOLESALER":
        return Package;
      case "RETAILER":
        return Package;
      case "END_USER":
        return User;
      default:
        return User;
    }
  };

  const userRole = role || user?.role;
  const RoleIcon = userRole ? getRoleIcon(userRole) : User;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Hamburger menu for mobile */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="mr-2 hover:bg-primary/10 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          <div className="flex items-center space-x-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-75 rounded-lg blur group-hover:blur-md transition-all" />
              <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <Package className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-base md:text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                TrackChain
              </h1>
              <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
                Supply Chain DApp
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3">
          {userRole && (
            <div className="flex items-center space-x-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10 shadow-sm hover:shadow-md transition-all">
              <div className="p-1 rounded-md bg-primary/10">
                <RoleIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
              </div>
              {!isMobile && (
                <div className="text-sm">
                  <p className="font-semibold text-xs">{userRole || "User"}</p>
                </div>
              )}
            </div>
          )}

          {/* Real-time Notifications */}
          <NotificationBell />

          <Button
            variant="ghost"
            size={isMobile ? "icon" : "sm"}
            onClick={handleLogout}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            {!isMobile && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </div>
    </header>
  );
}
