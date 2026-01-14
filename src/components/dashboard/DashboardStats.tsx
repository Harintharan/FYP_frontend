import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { Truck, Activity, AlertTriangle, Megaphone } from "lucide-react";

const formatNumber = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
};

const statAccent: Record<
  string,
  { ring: string; badge: string; iconBg: string; iconColor: string }
> = {
  total: {
    ring: "ring-primary/30",
    badge: "text-primary bg-primary/10",
    iconBg: "bg-gradient-to-br from-primary/20 to-primary/5",
    iconColor: "text-primary",
  },
  active: {
    ring: "ring-secondary/30",
    badge: "text-secondary bg-secondary/10",
    iconBg: "bg-gradient-to-br from-secondary/20 to-secondary/5",
    iconColor: "text-secondary",
  },
  alerts: {
    ring: "ring-amber-400/30",
    badge: "text-amber-500 bg-amber-100",
    iconBg: "bg-gradient-to-br from-amber-200/40 to-amber-100/10",
    iconColor: "text-amber-500",
  },
  complaints: {
    ring: "ring-rose-400/30",
    badge: "text-rose-500 bg-rose-100",
    iconBg: "bg-gradient-to-br from-rose-200/40 to-rose-100/10",
    iconColor: "text-rose-500",
  },
};

interface DashboardStatsProps {
  dashboardData?: any;
}

export function DashboardStats({ dashboardData }: DashboardStatsProps) {
  const { shipments, alerts } = useAppStore();

  // Use live data if available, otherwise fall back to store data
  const totalShipments =
    dashboardData?.stats?.totalShipments ?? shipments.length;
  const activeShipments =
    dashboardData?.stats?.activeShipments ??
    shipments.filter((shipment) =>
      ["IN_TRANSIT", "PREPARING"].includes(shipment.status)
    ).length;
  const activeAlerts =
    dashboardData?.stats?.unreadNotifications ??
    alerts.filter((alert) => !alert.acknowledged).length;
  const criticalAlerts =
    dashboardData?.stats?.criticalAlerts ??
    alerts.filter(
      (alert) =>
        ["CRITICAL", "EMERGENCY"].includes(alert.level) ||
        alert.type === "RECALL"
    ).length;

  const totalProducts = dashboardData?.stats?.totalProducts || 0;
  const deliveredShipments = dashboardData?.stats?.deliveredShipments || 0;
  const preparingShipments = dashboardData?.stats?.preparingShipments || 0;

  const stats = [
    {
      key: "total",
      title: "Total Shipments",
      value: totalShipments,
      subtext: "All tracked consignments",
      delta:
        deliveredShipments > 0
          ? `${deliveredShipments} completed`
          : "No completed yet",
      icon: Truck,
      trend: deliveredShipments > 0 ? "up" : "neutral",
    },
    {
      key: "active",
      title: "In Transit",
      value: activeShipments,
      subtext: "Currently moving",
      delta:
        preparingShipments > 0
          ? `${preparingShipments} pending dispatch`
          : "None pending",
      icon: Activity,
      trend: activeShipments > 0 ? "up" : "neutral",
    },
    {
      key: "alerts",
      title: "Notifications",
      value: activeAlerts,
      subtext: "Unread messages",
      delta: criticalAlerts > 0 ? `${criticalAlerts} critical` : "All normal",
      icon: AlertTriangle,
      trend: criticalAlerts > 0 ? "alert" : "neutral",
    },
    {
      key: "products",
      title: "Product Catalog",
      value: totalProducts,
      subtext: "Registered products",
      delta: totalProducts > 0 ? "Active catalog" : "No products yet",
      icon: Megaphone,
      trend: "neutral",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const theme = statAccent[stat.key] ?? statAccent.total;
        return (
          <Card
            key={stat.key}
            className={`group relative overflow-hidden border-none bg-card/90 shadow-card ring-1 ${theme.ring} transition-all hover:shadow-lg hover:ring-2`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/10 to-background/5" />

            {/* Decorative elements - hidden on small screens */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary/5 to-transparent opacity-50 hidden sm:block" />
            <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-gradient-to-tl from-secondary/5 to-transparent opacity-50 hidden sm:block" />

            <CardHeader className="relative flex flex-col gap-2 sm:gap-3 p-3 sm:p-4 pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-1">
                  {stat.title}
                </CardTitle>
                {stat.trend === "alert" && stat.value > 0 && (
                  <span className="flex h-2 w-2">
                    <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div
                  className={`rounded-xl sm:rounded-2xl p-2 sm:p-3 ${theme.iconBg} shadow-inner transition-transform group-hover:scale-110`}
                >
                  <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${theme.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tabular-nums">
                    {formatNumber(stat.value)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                    {stat.subtext}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative border-t border-dashed border-border/40 pt-2 sm:pt-3 pb-2 sm:pb-3 px-3 sm:px-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] sm:text-xs font-medium text-foreground truncate">
                  {stat.delta}
                </p>
                <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wider flex-shrink-0">
                  Live
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
