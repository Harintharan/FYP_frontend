import { useEffect, useMemo, useState } from "react";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store";
import {
  mockProducts,
  mockUsers,
  mockAlerts,
  mockShipments,
  generateMockTelemetry,
} from "@/lib/mock-data";
import type { Alert, Shipment } from "@/types";
import type { SupplierShipmentRecord } from "@/features/handover/types";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  MapPin,
  Clock,
  Activity,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Bus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  HandoverProvider,
  useSupplierContext,
} from "@/features/handover/context";
import { dashboardService } from "@/services/dashboardService";

const Index = () => {
  const navigate = useNavigate();
  const {
    user,
    products,
    alerts,
    shipments,
    setUser,
    addProduct,
    addAlert,
    addTelemetryPoint,
    addShipment,
    role: persistedRole,
  } = useAppStore();
  const effectiveRole = persistedRole ?? user?.role ?? "MANUFACTURER";

  // Initialize mock data (for demo)
  useEffect(() => {
    if (!user) {
      setUser(mockUsers[0]); // Default manufacturer
    }

    if (products.length === 0) {
      mockProducts.forEach(addProduct);
      mockAlerts.forEach(addAlert);
      mockShipments.forEach(addShipment);
      mockProducts.forEach((product) => {
        const telemetry = generateMockTelemetry(product.id, 12);
        telemetry.forEach((point) => addTelemetryPoint(product.id, point));
      });
    }
  }, [
    user,
    products.length,
    shipments.length,
    setUser,
    addProduct,
    addAlert,
    addTelemetryPoint,
    addShipment,
  ]);

  if (effectiveRole === "SUPPLIER") {
    return (
      <HandoverProvider>
        <SupplierDashboard alerts={alerts} navigate={navigate} />
      </HandoverProvider>
    );
  }

  return (
    <ManufacturerDashboard
      products={products}
      alerts={alerts}
      shipments={shipments}
      navigate={navigate}
    />
  );
};

type ManufacturerDashboardProps = {
  products: typeof mockProducts;
  alerts: Alert[];
  shipments: Shipment[];
  navigate: ReturnType<typeof useNavigate>;
};

const ManufacturerDashboard = ({
  products,
  alerts,
  shipments,
  navigate,
}: ManufacturerDashboardProps) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dashboardService.getManufacturerDashboard();
        setDashboardData(data);
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const activeAlerts = dashboardData?.recentNotifications || [];
  const liveShipments = dashboardData?.recentShipments?.slice(0, 3) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-destructive/50 bg-destructive/10 p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <h3 className="font-semibold text-destructive">
              Error loading dashboard
            </h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-primary/20 via-background to-background p-6 sm:p-10 shadow-card">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.6),_transparent_55%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <Badge
              variant="outline"
              className="w-fit border-primary/30 text-primary"
            >
              Manufacturer dashboard
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Keep every shipment compliant and on schedule
              </h1>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                Monitor live cold-chain activities, quickly respond to alerts,
                and share updates with partners in real time.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="gap-2">
                Open Operations Center <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/qr-scan")}>
                Scan QR
              </Button>
            </div>
          </div>
          <Card className="w-full max-w-sm border-none bg-background/80 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Live logistics snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Active shipments
                  </p>
                  <p className="text-3xl font-semibold">
                    {dashboardData?.stats?.activeShipments || 0}
                  </p>
                </div>
                <Badge className="bg-primary/10 text-primary">
                  {dashboardData?.stats?.totalShipments || 0} total
                </Badge>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{liveShipments.length} recent shipments</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Activity className="h-4 w-4 text-secondary" />
                  <span>{activeAlerts.length} alerts awaiting response</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DashboardStats dashboardData={dashboardData} />

      <div className="space-y-6">
        <Card className="border border-border/60 bg-gradient-to-br from-primary/5 via-background to-background shadow-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent shipments</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest shipment activity
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/shipment")}
              className="text-primary"
            >
              View all <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {liveShipments.length === 0 ? (
              <div className="text-center py-8 rounded-2xl border border-dashed border-border/60 bg-muted/10">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground mb-1">
                  No recent shipments
                </p>
                <p className="text-xs text-muted-foreground">
                  Create a shipment to start tracking
                </p>
              </div>
            ) : (
              liveShipments.map((shipment, shipmentIdx) => {
                const segments = shipment.segments || [];
                const lastSegment = segments[segments.length - 1];
                const destination = lastSegment?.end_checkpoint || {};

                return (
                  <div
                    key={`${shipment.id}-${shipmentIdx}`}
                    className="group relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/20 p-4 transition-all hover:shadow-md hover:border-primary/30 cursor-pointer"
                    onClick={() => setSelectedShipment(shipment)}
                  >
                    {/* Status badge positioned top-right */}
                    <div className="absolute top-4 right-4">
                      <Badge
                        variant="outline"
                        className={`${
                          shipment.status === "DELIVERED"
                            ? "border-green-500/50 bg-green-500/10 text-green-700"
                            : shipment.status === "IN_TRANSIT"
                            ? "border-blue-500/50 bg-blue-500/10 text-blue-700"
                            : shipment.status === "PENDING"
                            ? "border-amber-500/50 bg-amber-500/10 text-amber-700"
                            : "border-border/50 bg-muted/10"
                        }`}
                      >
                        {shipment.status.replace(/_/g, " ").toLowerCase()}
                      </Badge>
                    </div>

                    {/* Main content */}
                    <div className="pr-24">
                      {/* Shipment reference */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Truck className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono text-muted-foreground truncate">
                            {shipment.id.substring(0, 8)}...
                            {shipment.id.substring(shipment.id.length - 6)}
                          </p>
                        </div>
                      </div>

                      {/* Destination info */}
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-foreground mb-1">
                          {shipment.destinationName}
                        </p>
                        {destination.name && (
                          <div className="flex items-start gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                            <span>
                              {destination.name}
                              {destination.state && `, ${destination.state}`}
                              {destination.country &&
                                `, ${destination.country}`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <div className="h-2 w-2 rounded-full bg-primary/30" />
                          <span>
                            {segments.length}{" "}
                            {segments.length === 1 ? "segment" : "segments"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <div className="h-2 w-2 rounded-full bg-secondary/30" />
                          <span>
                            {shipment.packageCount}{" "}
                            {shipment.packageCount === 1
                              ? "package"
                              : "packages"}
                          </span>
                        </div>
                      </div>

                      {/* Timing info */}
                      <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            Created{" "}
                            {new Date(shipment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {shipment.estimatedDelivery && (
                          <div className="text-muted-foreground">
                            ETA:{" "}
                            {new Date(
                              shipment.estimatedDelivery
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hover indicator */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* <Card className="border border-border/60 bg-gradient-to-br from-secondary/5 via-background to-background shadow-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Active notifications
                {activeAlerts.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeAlerts.length}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest alerts and updates
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/alerts")}
              className="text-secondary"
            >
              View all <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeAlerts.length === 0 ? (
              <div className="text-center py-8 rounded-2xl border border-dashed border-border/60 bg-muted/10">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500/40 mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">
                  All clear!
                </p>
                <p className="text-xs text-muted-foreground">
                  No active notifications at the moment
                </p>
              </div>
            ) : (
              activeAlerts.slice(0, 4).map((notification, notifIdx) => {
                const severityConfig = {
                  CRITICAL: {
                    bg: "bg-red-500/10 border-red-500/30 hover:bg-red-500/20",
                    icon: "bg-red-500",
                    text: "text-red-700 dark:text-red-400",
                    pulse: true,
                  },
                  ERROR: {
                    bg: "bg-red-500/10 border-red-500/30 hover:bg-red-500/20",
                    icon: "bg-red-500",
                    text: "text-red-700 dark:text-red-400",
                    pulse: false,
                  },
                  WARNING: {
                    bg: "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20",
                    icon: "bg-amber-400",
                    text: "text-amber-700 dark:text-amber-400",
                    pulse: false,
                  },
                  SUCCESS: {
                    bg: "bg-green-500/10 border-green-500/30 hover:bg-green-500/20",
                    icon: "bg-green-500",
                    text: "text-green-700 dark:text-green-400",
                    pulse: false,
                  },
                  INFO: {
                    bg: "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20",
                    icon: "bg-blue-500",
                    text: "text-blue-700 dark:text-blue-400",
                    pulse: false,
                  },
                };

                const config =
                  severityConfig[notification.severity] || severityConfig.INFO;

                return (
                  <div
                    key={`${notification.id}-${notifIdx}`}
                    className={`group relative flex items-start gap-3 rounded-xl border ${config.bg} p-3 transition-all cursor-pointer`}
                  >
                    <div className="relative flex-shrink-0">
                      {config.pulse && (
                        <span className="absolute flex h-3 w-3">
                          <span
                            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.icon} opacity-75`}
                          ></span>
                        </span>
                      )}
                      <span
                        className={`relative inline-flex h-2.5 w-2.5 mt-1 rounded-full ${config.icon}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-sm font-semibold ${config.text}`}>
                          {notification.title}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0"
                        >
                          {notification.type}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(
                            new Date(notification.timestamp),
                            { addSuffix: true }
                          )}
                        </div>
                        {notification.shipmentId && (
                          <div className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            <span className="font-mono">
                              {notification.shipmentId.substring(0, 8)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card> */}
      </div>

      {/* Shipment Details Dialog */}
      <Dialog
        open={!!selectedShipment}
        onOpenChange={(open) => !open && setSelectedShipment(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-primary" />
              Shipment Overview
              {selectedShipment && (
                <Badge
                  variant="outline"
                  className={`${
                    selectedShipment.status === "DELIVERED"
                      ? "border-green-500/50 bg-green-500/10 text-green-700"
                      : selectedShipment.status === "IN_TRANSIT"
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-700"
                      : selectedShipment.status === "PENDING"
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-700"
                      : "border-border/50 bg-muted/10"
                  }`}
                >
                  {selectedShipment.status.replace(/_/g, " ")}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedShipment && (
                <span className="font-mono text-xs">
                  ID: {selectedShipment.id}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedShipment && (
            <div className="space-y-6 py-4">
              {/* Progress */}
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold">Shipment Progress</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Delivery Progress
                    </span>
                    <span className="font-semibold text-primary">
                      {selectedShipment.status === "DELIVERED"
                        ? "100%"
                        : selectedShipment.status === "IN_TRANSIT"
                        ? "50%"
                        : "0%"}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width:
                          selectedShipment.status === "DELIVERED"
                            ? "100%"
                            : selectedShipment.status === "IN_TRANSIT"
                            ? "50%"
                            : "0%",
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedShipment.segments?.length || 0} segments •{" "}
                    {selectedShipment.packageCount}{" "}
                    {selectedShipment.packageCount === 1
                      ? "package"
                      : "packages"}
                  </p>
                </div>
              </div>

              {/* Destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border/60 bg-gradient-to-br from-background to-muted/20 p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Destination
                  </h3>
                  <div className="space-y-2">
                    <p className="font-medium">
                      {selectedShipment.destinationName}
                    </p>
                    {selectedShipment.segments?.[
                      selectedShipment.segments.length - 1
                    ]?.end_checkpoint && (
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          {
                            selectedShipment.segments[
                              selectedShipment.segments.length - 1
                            ].end_checkpoint.location
                          }
                        </p>
                        <p>
                          {
                            selectedShipment.segments[
                              selectedShipment.segments.length - 1
                            ].end_checkpoint.state
                          }
                          {selectedShipment.segments[
                            selectedShipment.segments.length - 1
                          ].end_checkpoint.country &&
                            `, ${
                              selectedShipment.segments[
                                selectedShipment.segments.length - 1
                              ].end_checkpoint.country
                            }`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="rounded-xl border border-border/60 bg-gradient-to-br from-background to-muted/20 p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-secondary" />
                    Timeline
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium">
                        {new Date(
                          selectedShipment.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    {selectedShipment.estimatedDelivery && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ETA:</span>
                        <span className="font-medium">
                          {new Date(
                            selectedShipment.estimatedDelivery
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Route Segments */}
              {selectedShipment.segments &&
                selectedShipment.segments.length > 0 && (
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <h3 className="font-semibold mb-3">Route Segments</h3>
                    <div className="space-y-3">
                      {selectedShipment.segments.map(
                        (segment: any, idx: number) => (
                          <div
                            key={segment.segment_id}
                            className="flex items-start gap-3 pb-3 border-b border-border/40 last:border-0 last:pb-0"
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium">
                                  {segment.start_checkpoint.name}
                                </p>
                                <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                                <p className="text-sm font-medium">
                                  {segment.end_checkpoint.name}
                                </p>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>
                                  {segment.start_checkpoint.state},{" "}
                                  {segment.start_checkpoint.country}
                                </span>
                                <span>→</span>
                                <span>
                                  {segment.end_checkpoint.state},{" "}
                                  {segment.end_checkpoint.country}
                                </span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {segment.status}
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedShipment(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setSelectedShipment(null);
                navigate("/shipment");
              }}
            >
              View Full Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

type SupplierDashboardProps = {
  alerts: Alert[];
  navigate: ReturnType<typeof useNavigate>;
};

const SupplierDashboard = ({ alerts, navigate }: SupplierDashboardProps) => {
  const supplier = useSupplierContext();
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [selectedState, setSelectedState] = useState("ALL");
  const [quickAcceptTarget, setQuickAcceptTarget] =
    useState<SupplierShipmentRecord | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dashboardService.getSupplierDashboard();
        setDashboardData(data);
      } catch (err: any) {
        console.error("Error fetching supplier dashboard data:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getSegmentReference = (shipment: SupplierShipmentRecord) =>
    shipment.segmentId ?? shipment.id;

  const summaryCards = useMemo(
    () => [
      {
        key: "totalSegments",
        title: "Total Shipment-Segments",
        value: dashboardData?.stats?.totalSegments ?? 0,
        icon: Truck,
        accent: "from-primary/30 via-primary/5 to-background",
        ring: "ring-primary/20",
        iconTone: "text-primary",
      },
      {
        key: "deliveredSegments",
        title: "Delivered Segments",
        value: dashboardData?.stats?.deliveredSegments ?? 0,
        icon: CheckCircle2,
        accent: "from-green-200/50 via-green-50 to-background",
        ring: "ring-green-200/40",
        iconTone: "text-green-600",
      },
      {
        key: "inTransitSegments",
        title: "In Transit Segments",
        value: dashboardData?.stats?.inTransitSegments ?? 0,
        icon: Bus,
        accent: "from-amber-200/50 via-amber-50 to-background",
        ring: "ring-amber-200/40",
        iconTone: "text-amber-500",
      },
    ],
    [dashboardData?.stats]
  );

  const pendingShipments = supplier.shipmentsByStatus.PENDING ?? [];

  useEffect(() => {
    setSelectedState("ALL");
  }, [selectedCountry]);

  const locationMetadata = useMemo(() => {
    const countries = new Map<string, Set<string>>();
    pendingShipments.forEach((shipment) => {
      const { country, state } = deriveShipmentLocation(shipment);
      if (!countries.has(country)) countries.set(country, new Set());
      countries.get(country)!.add(state);
    });
    return {
      countries: Array.from(countries.keys()).sort(),
      statesByCountry: new Map(
        Array.from(countries.entries()).map(([country, states]) => [
          country,
          Array.from(states).sort(),
        ])
      ),
    };
  }, [pendingShipments]);

  const stateOptions =
    selectedCountry === "ALL"
      ? Array.from(
          new Set(
            pendingShipments.map(
              (shipment) => deriveShipmentLocation(shipment).state ?? "Unknown"
            )
          )
        ).sort()
      : locationMetadata.statesByCountry.get(selectedCountry) ?? [];

  const quickAcceptMatches = useMemo(() => {
    return pendingShipments.filter((shipment) => {
      const { country, state } = deriveShipmentLocation(shipment);
      const countryOk =
        selectedCountry === "ALL" || country === selectedCountry;
      const stateOk = selectedState === "ALL" || state === selectedState;
      return countryOk && stateOk;
    });
  }, [pendingShipments, selectedCountry, selectedState]);

  const quickAcceptSegmentId = quickAcceptTarget
    ? String(getSegmentReference(quickAcceptTarget))
    : null;
  const quickAcceptBusy =
    quickAcceptSegmentId !== null &&
    supplier.acceptShipmentPending &&
    supplier.acceptingShipmentId === quickAcceptSegmentId;

  const handleQuickAccept = () => {
    try {
      if (!quickAcceptTarget) return;

      supplier.acceptShipment(String(getSegmentReference(quickAcceptTarget)));
    } catch (error) {
      console.error("Error in handleQuickAccept:", error);
    }
    setQuickAcceptTarget(null);
  };

  const activeAlerts = dashboardData?.recentNotifications || [];
  const liveShipments = dashboardData?.recentShipments?.slice(0, 3) || [];

  if (!supplier.enabled) {
    return (
      <div className="rounded-3xl border border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">
        Supplier workflows are not available for this account.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-secondary/10 via-background to-background p-6 sm:p-10 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge
              variant="outline"
              className="w-fit border-secondary/40 text-secondary"
            >
              Supplier dashboard
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Supplier Operations Center
              </h1>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                Monitor batches, packages, shipments and stay ahead of alerts.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="gap-2" onClick={() => navigate("/shipment")}>
              View All Shipments <ArrowUpRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/qr-scan")}>
              Scan QR
            </Button>
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.key}
              className={`border-none bg-gradient-to-br ${card.accent} shadow-card ring-1 ${card.ring}`}
            >
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-semibold text-foreground">
                    {card.value}
                  </p>
                </div>
                <span className="rounded-2xl bg-background/70 p-3 shadow-inner">
                  <Icon className={`h-5 w-5 ${card.iconTone}`} />
                </span>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="border border-border/70 bg-gradient-to-r from-background via-muted/30 to-background shadow-card">
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Quick acceptance
              </p>
              <p className="text-lg font-semibold text-foreground">
                Locate consignments and accept in one step
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select
                value={selectedCountry}
                onValueChange={setSelectedCountry}
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Choose country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All countries</SelectItem>
                  {locationMetadata.countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger
                  className="w-56"
                  disabled={stateOptions.length === 0}
                >
                  <SelectValue placeholder="All states" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All states</SelectItem>
                  {stateOptions.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {quickAcceptMatches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-background/80 p-6 text-center text-sm text-muted-foreground">
              No consignments match the selected filters.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {quickAcceptMatches.slice(0, 4).map((shipment) => {
                const location = deriveShipmentLocation(shipment);
                const etaText = shipment.expectedArrival
                  ? formatDistanceToNow(new Date(shipment.expectedArrival), {
                      addSuffix: true,
                    })
                  : "ETA unavailable";
                const segmentIdentifier = getSegmentReference(shipment);
                return (
                  <div
                    key={segmentIdentifier}
                    className="space-y-3 rounded-2xl border border-border/70 bg-gradient-to-br from-background via-muted/40 to-background p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-foreground">
                          {shipment.destinationPartyName ?? "Consignment"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Segment {segmentIdentifier}
                        </p>
                      </div>
                      <Badge variant="outline">{etaText}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-primary" />
                        <span>
                          {location.state}, {location.country}
                        </span>
                      </div>
                      {shipment.destinationCheckpoint ? (
                        <div className="flex items-center gap-2">
                          <Truck className="h-3 w-3 text-secondary" />
                          <span>{shipment.destinationCheckpoint}</span>
                        </div>
                      ) : null}
                    </div>
                    <Button
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => setQuickAcceptTarget(shipment)}
                    >
                      Review & Accept
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Shipments Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {liveShipments.length > 0 ? (
          liveShipments.map((shipment: any) => (
            <Card
              key={shipment.id}
              className="group relative overflow-hidden border-border/40 hover:border-primary/30 transition-all duration-300 cursor-pointer hover:shadow-xl bg-gradient-to-br from-card via-card to-primary/5"
              onClick={() => setSelectedShipment(shipment)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold">
                      {shipment.destinationName}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {shipment.destinationState}, {shipment.destinationCountry}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${
                      shipment.status === "IN_TRANSIT"
                        ? "border-blue-500/50 text-blue-600 bg-blue-50 dark:bg-blue-950"
                        : shipment.status === "DELIVERED"
                        ? "border-green-500/50 text-green-600 bg-green-50 dark:bg-green-950"
                        : shipment.status === "PENDING"
                        ? "border-amber-500/50 text-amber-600 bg-amber-50 dark:bg-amber-950"
                        : "border-gray-500/50 text-gray-600 bg-gray-50 dark:bg-gray-950"
                    }`}
                  >
                    {shipment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">
                    {shipment.packageCount} Package
                    {shipment.packageCount !== 1 ? "s" : ""}
                  </span>
                  <span className="mx-1">•</span>
                  <span>
                    {shipment.segments?.length || 0} Segment
                    {(shipment.segments?.length || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                {shipment.estimatedDelivery && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-secondary" />
                    <span className="text-muted-foreground">
                      ETA:{" "}
                      {formatDistanceToNow(
                        new Date(shipment.estimatedDelivery),
                        { addSuffix: true }
                      )}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-primary group-hover:text-primary/80 transition-colors">
                  <span className="font-medium">View Details</span>
                  <ArrowUpRight className="w-3 h-3 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Truck className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                No recent shipments
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notifications Section */}
      {activeAlerts.length > 0 && (
        <Card className="border-orange-500/20 bg-gradient-to-br from-orange-50/50 to-background dark:from-orange-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-500" />
                <CardTitle className="text-lg">Active Notifications</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/notifications")}
              >
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeAlerts.slice(0, 5).map((notification: any) => (
              <div
                key={notification.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50 hover:bg-accent/50 transition-colors"
              >
                <div
                  className={`w-2 h-2 mt-2 rounded-full ${
                    notification.severity === "CRITICAL" ||
                    notification.severity === "ERROR"
                      ? "bg-red-500 animate-pulse"
                      : notification.severity === "WARNING"
                      ? "bg-amber-500"
                      : "bg-blue-500"
                  }`}
                />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.timestamp), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Shipment Detail Modal */}
      <Dialog
        open={Boolean(selectedShipment)}
        onOpenChange={(open) => !open && setSelectedShipment(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-primary" />
              Shipment Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this shipment
            </DialogDescription>
          </DialogHeader>
          {selectedShipment && (
            <div className="space-y-6 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Shipment ID
                  </p>
                  <p className="font-mono text-sm">{selectedShipment.id}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Status
                  </p>
                  <Badge
                    variant="outline"
                    className={`${
                      selectedShipment.status === "IN_TRANSIT"
                        ? "border-blue-500/50 text-blue-600"
                        : selectedShipment.status === "DELIVERED"
                        ? "border-green-500/50 text-green-600"
                        : "border-amber-500/50 text-amber-600"
                    }`}
                  >
                    {selectedShipment.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Destination
                  </p>
                  <p className="text-sm font-medium">
                    {selectedShipment.destinationName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedShipment.destinationAddress}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Packages
                  </p>
                  <p className="text-sm font-medium">
                    {selectedShipment.packageCount} Package
                    {selectedShipment.packageCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {selectedShipment.segments &&
                selectedShipment.segments.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Route Segments
                    </p>
                    <div className="space-y-2">
                      {selectedShipment.segments.map(
                        (segment: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg border border-border/50 bg-muted/30 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold">
                                Segment {segment.segment_order}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {segment.status}
                              </Badge>
                            </div>
                            <div className="grid gap-2 text-sm">
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                                <div>
                                  <p className="font-medium">
                                    {segment.start_checkpoint?.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {segment.start_checkpoint?.location}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-red-600 mt-0.5" />
                                <div>
                                  <p className="font-medium">
                                    {segment.end_checkpoint?.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {segment.end_checkpoint?.location}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {segment.estimated_arrival && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>
                                  ETA:{" "}
                                  {formatDistanceToNow(
                                    new Date(segment.estimated_arrival),
                                    { addSuffix: true }
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedShipment(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(quickAcceptTarget)}
        onOpenChange={(open) => (!open ? setQuickAcceptTarget(null) : null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Accept consignment</DialogTitle>
            <DialogDescription>
              Verify the details and confirm acceptance.
            </DialogDescription>
          </DialogHeader>
          {quickAcceptTarget ? (
            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-lg border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-3">
                <p className="font-semibold text-foreground">
                  {quickAcceptTarget.destinationPartyName ?? "Consignment"}
                </p>
                <p className="text-muted-foreground">
                  Segment {String(getSegmentReference(quickAcceptTarget))}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    From
                  </p>
                  <p className="font-medium text-foreground">
                    {quickAcceptTarget.pickupArea ??
                      quickAcceptTarget.originArea ??
                      "Unknown location"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    To
                  </p>
                  <p className="font-medium text-foreground">
                    {quickAcceptTarget.dropoffArea ??
                      quickAcceptTarget.destinationArea ??
                      "Unknown location"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setQuickAcceptTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleQuickAccept}
              disabled={!quickAcceptTarget || quickAcceptBusy}
            >
              {quickAcceptBusy ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Accepting...
                </span>
              ) : (
                "Accept shipment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const parseAreaTokens = (value?: string) => {
  if (!value) return { state: undefined, country: undefined };
  const tokens = value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.length === 0) return { state: undefined, country: undefined };
  return {
    state: tokens[0],
    country: tokens[tokens.length - 1],
  };
};

const deriveShipmentLocation = (shipment: SupplierShipmentRecord) => {
  const start = shipment.startCheckpoint ?? {};
  const end = shipment.endCheckpoint ?? {};
  const pickup = parseAreaTokens(shipment.pickupArea ?? shipment.originArea);
  const dropoff = parseAreaTokens(
    shipment.dropoffArea ?? shipment.destinationArea
  );
  const country =
    start.country ??
    end.country ??
    dropoff.country ??
    pickup.country ??
    "Unknown";
  const state =
    start.state ?? end.state ?? dropoff.state ?? pickup.state ?? "Unknown";
  return { country, state };
};

export default Index;
