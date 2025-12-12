import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Package,
  Truck,
  QrCode,
  Settings,
  BarChart3,
  PlusCircle,
  Menu,
  X,
  Users,
  Warehouse,
  MapPin,
  UserPlus,
  Archive,
  Tag,
  ChevronDown,
  ChevronRight,
  BellRing,
  LogOut,
  Home,
  Bell,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
  setCollapsed?: (value: boolean) => void;
  isMobile?: boolean;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (value: boolean) => void;
}

export function Sidebar({
  className,
  collapsed = false,
  setCollapsed,
  isMobile = false,
  mobileMenuOpen = false,
  setMobileMenuOpen,
}: SidebarProps) {
  const { role } = useAppStore();
  const userRole = role ?? "GUEST"; // ✅ fallback for null
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // 🧭 Role-based navigation items
  const getNavigationItems = () => {
    switch (userRole) {
      case "ADMIN":
        return [{ path: "/users", label: "Manage Users", icon: Users }];

      case "MANUFACTURER":
        return [
          { path: "/", label: "Dashboard", icon: LayoutDashboard },
          {
            type: "group",
            key: "manage-products",
            label: "Manage Products",
            icon: PlusCircle,
            children: [
              {
                path: "/products/create?tab=packages",
                label: "Packages",
                icon: Package,
              },
              {
                path: "/products/create?tab=batches",
                label: "Batches",
                icon: Archive,
              },
              {
                path: "/products/create?tab=products",
                label: "Products",
                icon: Package,
              },
              {
                path: "/products/create?tab=categories",
                label: "Product Categories",
                icon: Tag,
              },
            ],
          },
          { path: "/qr-scan", label: "QR Scanner", icon: QrCode },
          // { path: "/checkpoints", label: "Checkpoints", icon: MapPin },
          { path: "/shipment", label: "Shipments", icon: Truck },
          // { path: "/analytics", label: "Analytics", icon: BarChart3 },
          { path: "/settings", label: "Settings", icon: Settings },
          // { path: "/register", label: "Register", icon: UserPlus },
        ];

      case "SUPPLIER":
        return [
          { path: "/", label: "Dashboard", icon: LayoutDashboard },
          // { path: "/checkpoints", label: "Checkpoints", icon: MapPin },
          { path: "/shipment", label: "Shipments", icon: Truck },
          { path: "/settings", label: "Settings", icon: Settings },
          // { path: "/register", label: "Register", icon: UserPlus },
        ];

      case "WAREHOUSE":
        return [
          // { path: "/", label: "Dashboard", icon: LayoutDashboard },
          // { path: "/inventory", label: "Inventory", icon: Warehouse },
          // { path: "/checkpoints", label: "Checkpoints", icon: MapPin },
          // { path: "/handover", label: "Receive / Dispatch", icon: Truck },
          { path: "/qr-scan", label: "QR Scanner", icon: QrCode },
          { path: "/settings", label: "Settings", icon: Settings },
          // { path: "/register", label: "Register", icon: UserPlus },
        ];

      case "CONSUMER":
        return [{ path: "/qr-scan", label: "QR Scanner", icon: QrCode }];

      case "USER":
        return [
          { path: "/qr-scan", label: "QR Scanner", icon: QrCode },
          { path: "/register", label: "Register", icon: UserPlus },
        ];

      default:
        return [
          { path: "/qr-scan", label: "QR Scanner", icon: QrCode },
          { path: "/register", label: "Register", icon: UserPlus },
        ];
    }
  };

  // Handle navigation click - close mobile menu
  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile && setMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  const navigationItems = getNavigationItems();

  // Don't render sidebar on mobile unless menu is open
  if (isMobile && !mobileMenuOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in"
          onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-gradient-to-b from-card via-card to-muted/20 border-r border-border/50 shadow-xl flex flex-col transition-all duration-300 ease-in-out",
          isMobile
            ? "fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 z-50 animate-in slide-in-from-left"
            : "fixed left-0 top-16 h-[calc(100vh-4rem)]",
          isMobile ? "" : collapsed ? "w-20" : "w-72",
          className
        )}
      >
        {/* Header with Gradient */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 opacity-60" />
          <div className="relative flex items-center justify-between p-4 border-b border-border/50">
            {(!collapsed || isMobile) && (
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/30 rounded-lg blur-sm group-hover:blur transition-all" />
                  <div className="relative w-10 h-10 bg-gradient-to-br from-primary via-primary to-secondary rounded-lg flex items-center justify-center shadow-lg ring-1 ring-primary/20">
                    <Home className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <h2 className="font-bold text-sm tracking-tight">
                    {userRole !== "GUEST" ? userRole : "Menu"}
                  </h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    Control Panel
                  </p>
                </div>
              </div>
            )}
            {(!collapsed || isMobile) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (isMobile && setMobileMenuOpen) {
                    setMobileMenuOpen(false);
                  } else if (setCollapsed) {
                    setCollapsed(!collapsed);
                  }
                }}
                className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            {collapsed && !isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed && setCollapsed(false)}
                className="w-full h-8 hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Menu className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <Separator className="opacity-50" />

        {/* Navigation Section */}
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-2">
            {navigationItems.map((item, idx) => {
              if (item.type === "group") {
                const isExpanded = expandedItems.has(item.key);
                const hasActiveChild = item.children.some((child) => {
                  const [path, query] = child.path.split("?");
                  const tab = query.split("=")[1];
                  return (
                    location.pathname === path &&
                    searchParams.get("tab") === tab
                  );
                });
                return (
                  <div key={item.key} className="space-y-1">
                    <Button
                      onClick={() => {
                        setExpandedItems((prev) => {
                          const newSet = new Set(prev);
                          if (newSet.has(item.key)) newSet.delete(item.key);
                          else newSet.add(item.key);
                          return newSet;
                        });
                      }}
                      variant="ghost"
                      className={cn(
                        "group relative w-full justify-start gap-3 h-12 rounded-xl transition-all duration-200 overflow-hidden",
                        hasActiveChild
                          ? "bg-gradient-to-r from-primary/15 via-primary/10 to-transparent text-primary font-semibold shadow-sm border border-primary/20"
                          : "hover:bg-muted/50 hover:text-foreground text-muted-foreground",
                        collapsed && !isMobile && "justify-center"
                      )}
                    >
                      {hasActiveChild && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-secondary rounded-r" />
                      )}
                      <div
                        className={cn(
                          "flex items-center justify-center rounded-lg transition-all",
                          hasActiveChild
                            ? "bg-primary/10 p-2"
                            : "p-2 group-hover:bg-primary/5"
                        )}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                      </div>
                      {(!collapsed || isMobile) && (
                        <>
                          <span className="flex-1 truncate text-sm font-medium">
                            {item.label}
                          </span>
                          <ChevronRight
                            className={cn(
                              "w-4 h-4 transition-transform duration-200 shrink-0",
                              isExpanded ? "rotate-90" : ""
                            )}
                          />
                        </>
                      )}
                    </Button>
                    {isExpanded && (!collapsed || isMobile) && (
                      <div className="ml-3 pl-4 border-l-2 border-border/30 space-y-1 animate-in slide-in-from-top-2">
                        {item.children.map((child) => {
                          const Icon = child.icon;
                          const [path, query] = child.path.split("?");
                          const tab = query.split("=")[1];
                          const isActive =
                            location.pathname === path &&
                            searchParams.get("tab") === tab;
                          return (
                            <Button
                              key={child.path}
                              onClick={() => handleNavClick(child.path)}
                              variant="ghost"
                              className={cn(
                                "w-full justify-start gap-3 h-10 rounded-lg transition-all duration-200",
                                isActive
                                  ? "bg-primary/10 text-primary font-medium border border-primary/20 shadow-sm"
                                  : "hover:bg-muted/50 hover:text-foreground text-muted-foreground"
                              )}
                            >
                              <Icon className="w-4 h-4 shrink-0" />
                              <span className="truncate text-sm">
                                {child.label}
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              } else {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  location.pathname.startsWith(item.path + "/");

                return (
                  <Button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    variant="ghost"
                    className={cn(
                      "group relative w-full justify-start gap-3 h-12 rounded-xl transition-all duration-200 overflow-hidden",
                      isActive
                        ? "bg-gradient-to-r from-primary/15 via-primary/10 to-transparent text-primary font-semibold shadow-sm border border-primary/20"
                        : "hover:bg-muted/50 hover:text-foreground text-muted-foreground",
                      collapsed && !isMobile && "justify-center"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-secondary rounded-r" />
                    )}
                    <div
                      className={cn(
                        "flex items-center justify-center rounded-lg transition-all",
                        isActive
                          ? "bg-primary/10 p-2"
                          : "p-2 group-hover:bg-primary/5"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                    {(!collapsed || isMobile) && (
                      <span className="truncate text-sm font-medium">
                        {item.label}
                      </span>
                    )}
                  </Button>
                );
              }
            })}
          </div>
        </ScrollArea>

        <Separator className="opacity-50" />

        {/* Footer Section */}
        <div className="p-3 space-y-2 border-t border-border/50 bg-gradient-to-t from-muted/40 to-transparent">
          {(!collapsed || isMobile) && (
            <div className="px-3 py-2.5 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 rounded-full blur-sm opacity-50" />
                  <div className="relative w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <span className="text-xs font-semibold text-foreground">
                  System Status
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">
                All systems operational
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
