import { useState } from "react";
import {
  Bell,
  CheckCheck,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  XCircle,
  Calendar,
  MapPin,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export function NotificationDrawer() {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    dismiss,
  } = useNotifications();

  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead([notification.id]);
    }
    setSelectedNotification(notification);
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await markAllAsRead();
  };

  const handleDismiss = async (notificationId: string) => {
    await dismiss([notificationId]);
    if (selectedNotification?.id === notificationId) {
      setSelectedNotification(null);
    }
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="relative hover:bg-accent"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-semibold animate-pulse"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          {!isConnected && (
            <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 bg-yellow-500 rounded-full border-2 border-background animate-pulse" />
          )}
        </Button>

        <DrawerContent className="max-w-2xl mx-auto max-h-[85vh]">
          <DrawerHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10 px-3 sm:px-4 py-2.5 sm:py-3">
            <div className="flex items-center justify-between">
              <DrawerTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </DrawerTitle>
              <div className="flex items-center gap-1 sm:gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllRead}
                    className="text-xs hover:bg-primary/10 gap-1 h-7 sm:h-8 px-2 sm:px-3"
                  >
                    <CheckCheck className="h-3 w-3" />
                    <span className="hidden sm:inline">Mark all read</span>
                  </Button>
                )}
                <DrawerClose />
              </div>
            </div>
          </DrawerHeader>

          <ScrollArea className="h-[400px] sm:h-[600px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 sm:h-40 text-muted-foreground">
                <div className="rounded-full bg-muted p-3 sm:p-4 mb-2 sm:mb-3">
                  <Bell className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
                <p className="text-xs sm:text-sm font-medium">No notifications yet</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-1">
                  You're all caught up!
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((notification, index) => (
                  <div key={notification.id}>
                    <NotificationItem
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                      onDismiss={() => handleDismiss(notification.id)}
                      isSelected={selectedNotification?.id === notification.id}
                    />
                    {index < notifications.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {!isConnected && (
            <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-yellow-50 dark:bg-yellow-950 border-t border-yellow-200 dark:border-yellow-800 text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
              <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="truncate">Reconnecting...</span>
            </div>
          )}

          {/* Detail View */}
          {selectedNotification && (
            <div className="border-t p-3 sm:p-4 bg-muted/30">
              <NotificationDetail
                notification={selectedNotification}
                onClose={() => setSelectedNotification(null)}
              />
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onDismiss: () => void;
  isSelected?: boolean;
}

function NotificationItem({
  notification,
  onClick,
  onDismiss,
  isSelected = false,
}: NotificationItemProps) {
  const getSeverityConfig = (severity: string) => {
    const configs = {
      INFO: {
        icon: Info,
        bgColor: "bg-blue-50 dark:bg-blue-950/30",
        borderColor: "border-l-blue-500",
        iconColor: "text-blue-600 dark:text-blue-400",
        badgeBg:
          "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
      },
      SUCCESS: {
        icon: CheckCircle,
        bgColor: "bg-green-50 dark:bg-green-950/30",
        borderColor: "border-l-green-500",
        iconColor: "text-green-600 dark:text-green-400",
        badgeBg:
          "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
      },
      WARNING: {
        icon: AlertTriangle,
        bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
        borderColor: "border-l-yellow-500",
        iconColor: "text-yellow-600 dark:text-yellow-400",
        badgeBg:
          "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
      },
      ERROR: {
        icon: XCircle,
        bgColor: "bg-red-50 dark:bg-red-950/30",
        borderColor: "border-l-red-500",
        iconColor: "text-red-600 dark:text-red-400",
        badgeBg: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
      },
      CRITICAL: {
        icon: AlertCircle,
        bgColor: "bg-red-100 dark:bg-red-950/50",
        borderColor: "border-l-red-700",
        iconColor: "text-red-700 dark:text-red-400",
        badgeBg: "bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200",
      },
    };
    return configs[severity as keyof typeof configs] || configs.INFO;
  };

  const config = getSeverityConfig(notification.severity);
  const SeverityIcon = config.icon;

  return (
    <div
      className={cn(
        "px-3 sm:px-4 py-2.5 sm:py-3.5 hover:bg-accent/50 cursor-pointer transition-all duration-200 border-l-4",
        isSelected && "bg-primary/5",
        !notification.read ? config.bgColor : "bg-muted/20",
        config.borderColor,
        notification.read && "opacity-60"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div className={cn("flex-shrink-0 mt-0.5", config.iconColor)}>
          <SeverityIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>

        <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {!notification.read && (
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary flex-shrink-0 animate-pulse" />
            )}
            <h4 className="font-semibold text-xs sm:text-sm leading-tight flex-1 line-clamp-1">
              {notification.title}
            </h4>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-3">
            {notification.message}
          </p>

          <div className="flex items-center gap-1.5 sm:gap-2 pt-0.5 sm:pt-1">
            <Badge className={cn("text-[10px] sm:text-xs font-medium", config.badgeBg)}>
              {notification.severity}
            </Badge>
            <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/40" />
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground hover:bg-destructive/10"
        >
          <X className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
}

interface NotificationDetailProps {
  notification: Notification;
  onClose: () => void;
}

function NotificationDetail({
  notification,
  onClose,
}: NotificationDetailProps) {
  const getSeverityConfig = (severity: string) => {
    const configs = {
      INFO: {
        icon: Info,
        bgColor: "bg-blue-50 dark:bg-blue-950/30",
        iconColor: "text-blue-600 dark:text-blue-400",
        badgeBg:
          "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
      },
      SUCCESS: {
        icon: CheckCircle,
        bgColor: "bg-green-50 dark:bg-green-950/30",
        iconColor: "text-green-600 dark:text-green-400",
        badgeBg:
          "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
      },
      WARNING: {
        icon: AlertTriangle,
        bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
        iconColor: "text-yellow-600 dark:text-yellow-400",
        badgeBg:
          "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
      },
      ERROR: {
        icon: XCircle,
        bgColor: "bg-red-50 dark:bg-red-950/30",
        iconColor: "text-red-600 dark:text-red-400",
        badgeBg: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
      },
      CRITICAL: {
        icon: AlertCircle,
        bgColor: "bg-red-100 dark:bg-red-950/50",
        iconColor: "text-red-700 dark:text-red-400",
        badgeBg: "bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200",
      },
    };
    return configs[severity as keyof typeof configs] || configs.INFO;
  };

  const config = getSeverityConfig(notification.severity);
  const SeverityIcon = config.icon;
  const metadata = notification.metadata || {};

  return (
    <div className={cn("rounded-lg border", config.bgColor)}>
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex items-start gap-2 sm:gap-4">
          <div className={cn("flex-shrink-0 mt-1", config.iconColor)}>
            <SeverityIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg">{notification.title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
              {notification.message}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 p-0">
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>

        {/* Status Badge */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Badge className={cn("text-xs sm:text-sm font-medium", config.badgeBg)}>
            {notification.severity}
          </Badge>
          <span className="text-[10px] sm:text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>

        {/* Additional Details */}
        {Object.keys(metadata).length > 0 && (
          <div className="pt-2 border-t">
            <h4 className="font-semibold text-[10px] sm:text-xs text-muted-foreground uppercase mb-2 sm:mb-3">
              Additional Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              {notification.shipmentId && (
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    📦 Shipment ID
                  </p>
                  <p className="text-xs sm:text-sm font-mono mt-0.5 sm:mt-1 break-all">
                    {notification.shipmentId.substring(0, 20)}...
                  </p>
                </div>
              )}

              {metadata.start_checkpoint && (
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Start Checkpoint
                  </p>
                  <p className="text-xs sm:text-sm mt-0.5 sm:mt-1">{metadata.start_checkpoint}</p>
                </div>
              )}

              {metadata.end_checkpoint && (
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Truck className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> End Checkpoint
                  </p>
                  <p className="text-xs sm:text-sm mt-0.5 sm:mt-1">{metadata.end_checkpoint}</p>
                </div>
              )}

              {metadata.expected_ship_date && (
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Expected Ship Date
                  </p>
                  <p className="text-xs sm:text-sm mt-0.5 sm:mt-1">
                    {new Date(metadata.expected_ship_date).toLocaleDateString()}
                  </p>
                </div>
              )}

              {metadata.estimated_arrival_date && (
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Estimated Arrival
                  </p>
                  <p className="text-xs sm:text-sm mt-0.5 sm:mt-1">
                    {new Date(
                      metadata.estimated_arrival_date
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}

              {metadata.breach_time && (
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Breach Time
                  </p>
                  <p className="text-xs sm:text-sm mt-0.5 sm:mt-1">
                    {new Date(metadata.breach_time).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              )}

              {metadata.allowed_range && (
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Allowed Range
                  </p>
                  <p className="text-xs sm:text-sm mt-0.5 sm:mt-1">{metadata.allowed_range}</p>
                </div>
              )}

              {metadata.location_latitude && (
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Latitude
                  </p>
                  <p className="text-xs sm:text-sm mt-0.5 sm:mt-1 font-mono">
                    {parseFloat(metadata.location_latitude).toFixed(4)}
                  </p>
                </div>
              )}

              {metadata.location_longitude && (
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Longitude
                  </p>
                  <p className="text-xs sm:text-sm mt-0.5 sm:mt-1 font-mono">
                    {parseFloat(metadata.location_longitude).toFixed(4)}
                  </p>
                </div>
              )}

              {metadata.location_latitude && metadata.location_longitude && (
                <div className="col-span-1 sm:col-span-2">
                  <a
                    href={`https://www.google.com/maps?q=${parseFloat(
                      metadata.location_latitude
                    )},${parseFloat(metadata.location_longitude)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] sm:text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    View on Google Maps →
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
