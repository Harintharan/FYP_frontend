import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CalendarClock,
  Calendar,
  Hourglass,
  Bus,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
  Package,
  AlertCircle,
} from "lucide-react";
import { useAppToast } from "@/hooks/useAppToast";
import { cn } from "@/lib/utils";
import {
  handoverUtils,
  useHandoverSharedContext,
  useSupplierContext,
} from "../context";
import { shipmentService } from "@/services/shipmentService";
import type { SupplierShipmentRecord, SupplierShipmentStatus } from "../types";
import { ViewShipmentButton } from "./ViewShipmentButton";
import { SegmentAcceptanceToast } from "@/components/toasts/SegmentAcceptanceToast";
import { formatDistanceToNow } from "date-fns";

const {
  extractShipmentItems,
  supplierStatusBadgeClass,
  normalizeStatus,
  formatArrivalText,
  humanizeSupplierStatus,
} = handoverUtils;

const shipmentDateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const getIntegrityMeta = (value?: string | null) => {
  const normalized = value?.toLowerCase();
  if (normalized === "valid") {
    return {
      label: "Verified",
      className: "border-emerald-200 bg-emerald-100 text-emerald-800",
    };
  }
  if (normalized === "tampered" || normalized === "mismatch") {
    return {
      label: "Tampered",
      className: "border-rose-200 bg-rose-100 text-rose-800",
    };
  }
  if (normalized === "not_on_chain") {
    return {
      label: "Not on chain",
      className: "border-amber-200 bg-amber-100 text-amber-800",
    };
  }
  return {
    label: "Unknown",
    className: "border-border bg-muted text-muted-foreground",
  };
};

type IconType = typeof Clock;

type StatusConfig = {
  label: string;
  title: string;
  description: string;
  loadingTitle: string;
  loadingDescription: string;
  emptyTitle: string;
  emptyFilteredTitle: string;
  emptyDescription: string;
  icon: IconType;
};

const STATUS_CONFIG: Record<SupplierShipmentStatus, StatusConfig> = {
  PENDING: {
    label: "Pending",
    title: "Pending consignments",
    description: "",
    loadingTitle: "Loading pending consignments",
    loadingDescription: "Fetching consignments awaiting your acceptance.",
    emptyTitle: "No pending consignments",
    emptyFilteredTitle: "No pending consignments in this area",
    emptyDescription: "Shipments waiting for acceptance will appear here.",
    icon: Clock,
  },
  ACCEPTED: {
    label: "Accepted",
    title: "Accepted consignments",
    description: "",
    loadingTitle: "Loading accepted consignments",
    loadingDescription: "Fetching accepted consignments.",
    emptyTitle: "No accepted consignments",
    emptyFilteredTitle: "No accepted consignments in this area",
    emptyDescription:
      "Accepted consignments will show up once the manufacturer confirms your handover.",
    icon: ShieldCheck,
  },
  IN_TRANSIT: {
    label: "In transit",
    title: "In-transit consignments",
    description: "",
    loadingTitle: "Loading in-transit consignments",
    loadingDescription: "Fetching consignments currently on the move.",
    emptyTitle: "No consignments in transit",
    emptyFilteredTitle: "No in-transit consignments in this area",
    emptyDescription:
      "Once consignments leave your custody they will be tracked here.",
    icon: Truck,
  },
  DELIVERED: {
    label: "Delivered",
    title: "Delivered consignments",
    description: "",
    loadingTitle: "Loading delivered consignments",
    loadingDescription: "Fetching consignments marked as delivered.",
    emptyTitle: "No delivered consignments",
    emptyFilteredTitle: "No delivered consignments in this area",
    emptyDescription:
      "Completed consignments will appear here for final confirmation.",
    icon: CheckCircle2,
  },
  CLOSED: {
    label: "Closed",
    title: "Closed consignments",
    description: "",
    loadingTitle: "Loading closed consignments",
    loadingDescription: "Fetching consignments that have been closed.",
    emptyTitle: "No closed consignments",
    emptyFilteredTitle: "No closed consignments in this area",
    emptyDescription: "Recently closed consignments will show up here.",
    icon: CalendarClock,
  },
  CANCELLED: {
    label: "Cancelled",
    title: "Cancelled consignments",
    description: "",
    loadingTitle: "Loading cancelled consignments",
    loadingDescription: "Fetching consignments that were cancelled.",
    emptyTitle: "No cancelled consignments",
    emptyFilteredTitle: "No cancelled consignments in this area",
    emptyDescription:
      "Cancelled consignments will be listed here for audit trails.",
    icon: XCircle,
  },
};

const extractApiErrorMessage = (error: unknown): string | undefined => {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  if ("response" in error) {
    const response = (
      error as { response?: { data?: { error?: unknown; message?: unknown } } }
    ).response;
    const apiError = response?.data?.error;
    if (typeof apiError === "string") {
      return apiError;
    }
    if (apiError && typeof apiError === "object") {
      const message = (apiError as { message?: unknown }).message;
      if (typeof message === "string") {
        return message;
      }
    }
    const fallbackMessage = response?.data?.message;
    if (typeof fallbackMessage === "string") {
      return fallbackMessage;
    }
  }

  if ("message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return undefined;
};

const buildRangePopupMessage = (
  message: string,
  actionLabel: "takeover" | "handover"
): string | null => {
  const lower = message.toLowerCase();

  if (
    lower.includes("origin checkpoint") ||
    lower.includes("pickup checkpoint")
  ) {
    return `Your current location is outside the permitted range for this checkpoint. Please move closer to the pickup checkpoint and try ${actionLabel} again.`;
  }

  if (
    lower.includes("destination checkpoint") ||
    lower.includes("delivery checkpoint")
  ) {
    return `Your current location is outside the permitted range for this checkpoint. Please move closer to the delivery checkpoint and try ${actionLabel} again.`;
  }

  if (
    lower.includes("latest device gps reading") ||
    lower.includes("latest shipment gps reading") ||
    lower.includes("device gps") ||
    lower.includes("shipment gps")
  ) {
    return "Your current location is outside the permitted range. Please move closer to the package location and try handover again.";
  }

  if (lower.includes("no gps sensor readings")) {
    return "Device GPS data missing. Make sure the device is online and sending GPS data.";
  }

  if (lower.includes("gps reading has invalid coordinates")) {
    return "Device GPS data invalid. The latest GPS reading is missing coordinates.";
  }

  if (
    lower.includes("location is not within") ||
    lower.includes("shipment_segment_access_denied")
  ) {
    return "Your location is too far from the checkpoint. Please move closer.";
  }

  return null;
};

export function SupplierSection() {
  const { showSuccess, showError, showInfo, showWarning } = useAppToast();
  const shared = useHandoverSharedContext();
  const supplier = useSupplierContext();
  const canRender = supplier.enabled && shared.role === "SUPPLIER";
  const hasAreaFilter = supplier.areaQuery.trim().length > 0;
  const [takeoverDialogOpen, setTakeoverDialogOpen] = useState(false);
  const [takeoverTarget, setTakeoverTarget] =
    useState<SupplierShipmentRecord | null>(null);
  const [takeoverForm, setTakeoverForm] = useState({
    latitude: "",
    longitude: "",
  });
  const [takeoverLocating, setTakeoverLocating] = useState(false);
  const [takeoverLocationError, setTakeoverLocationError] = useState<
    string | null
  >(null);
  const [takeoverError, setTakeoverError] = useState<string | null>(null);
  const [takeoverErrorDialogOpen, setTakeoverErrorDialogOpen] = useState(false);
  const [acceptDialogSegmentId, setAcceptDialogSegmentId] = useState<
    string | null
  >(null);
  const [acceptingSegmentId, setAcceptingSegmentId] = useState<string | null>(
    null
  );
  const getSegmentReference = (shipment: SupplierShipmentRecord) =>
    shipment.segmentId ?? shipment.id;
  const statusOrder = supplier.statusOrder;
  const defaultTab = supplier.activeStatus ?? statusOrder[0] ?? "PENDING";
  const takeoverSegmentIdentifier = takeoverTarget
    ? getSegmentReference(takeoverTarget)
    : null;
  const takeoverBusy =
    takeoverSegmentIdentifier !== null &&
    supplier.takeoverPending &&
    supplier.takeoverSegmentId === takeoverSegmentIdentifier;
  const takeoverDisabled =
    takeoverLocating ||
    takeoverLocationError !== null ||
    takeoverForm.latitude.trim().length === 0 ||
    takeoverForm.longitude.trim().length === 0 ||
    takeoverBusy;

  const openHandoverDialog = (shipment: SupplierShipmentRecord) => {
    supplier.setHandoverTarget(shipment);
    supplier.setHandoverDialogOpen(true);
  };

  const openTakeoverDialog = (shipment: SupplierShipmentRecord) => {
    setTakeoverTarget(shipment);
    setTakeoverForm({ latitude: "", longitude: "" });
    setTakeoverLocationError(null);
    setTakeoverLocating(true);
    const isSecure = typeof window !== "undefined" && window.isSecureContext;
    if (!isSecure) {
      const msg = "Location access requires HTTPS or localhost.";
      showError(msg);
      setTakeoverLocating(false);
      setTakeoverLocationError(msg);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      showError("Geolocation is unavailable in this browser");
      setTakeoverLocating(false);
      setTakeoverLocationError("Geolocation unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setTakeoverForm({
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        });
        setTakeoverLocating(false);
        setTakeoverLocationError(null);
      },
      (error) => {
        console.error(error);
        const denied = error?.code === 1;
        const message = denied
          ? "Location permission denied. Allow access or enter coordinates manually."
          : "Unable to fetch your location. Allow location access and try again.";
        showError(message);
        setTakeoverLocating(false);
        setTakeoverLocationError(message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
    setTakeoverDialogOpen(true);
  };

  const closeTakeoverDialog = () => {
    setTakeoverDialogOpen(false);
    setTakeoverTarget(null);
    setTakeoverForm({ latitude: "", longitude: "" });
    setTakeoverLocating(false);
    setTakeoverLocationError(null);
    setTakeoverError(null);
  };

  const handleTakeoverDialogChange = (open: boolean) => {
    if (!open) {
      closeTakeoverDialog();
    } else {
      setTakeoverDialogOpen(true);
    }
  };

  const handleDownloadProof = (shipment: SupplierShipmentRecord) => {
    showInfo(
      `Downloading records for segment ${getSegmentReference(shipment)}`
    );
  };

  const handleReportIssue = (shipment: SupplierShipmentRecord) => {
    showInfo(
      `Support has been notified about segment ${getSegmentReference(shipment)}`
    );
  };

  const handleConfirmTakeover = async () => {
    if (!takeoverTarget) return;
    const latitude = Number(takeoverForm.latitude);
    const longitude = Number(takeoverForm.longitude);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      showError("Provide valid latitude and longitude values");
      return;
    }

    try {
      await supplier.takeoverSegment(
        String(getSegmentReference(takeoverTarget)),
        {
          latitude,
          longitude,
        }
      );
      closeTakeoverDialog();
    } catch (err: unknown) {
      closeTakeoverDialog();
      // Check if it's a location-based access denied error
      const errorMessage =
        extractApiErrorMessage(err) ||
        (typeof err === "object" && err !== null && "message" in err
          ? (err as { message?: unknown }).message
          : JSON.stringify(err || ""));
      const popupMessage = buildRangePopupMessage(
        typeof errorMessage === "string" ? errorMessage : String(errorMessage),
        "takeover"
      );
      if (popupMessage) {
        // Then show the error popup
        setTakeoverError(popupMessage);
        setTakeoverErrorDialogOpen(true);
        // Don't rethrow - we've handled it with the popup
        return;
      }
      // For other errors, rethrow so context's onError can show toast
      throw err;
    }
  };

  const actionContext: SupplierActionContext = {
    supplier,
    sharedUuid: shared.uuid,
    openHandoverDialog,
    openTakeoverDialog,
    handleDownloadProof,
    handleReportIssue,
    acceptDialogSegmentId,
    setAcceptDialogSegmentId,
    acceptingSegmentId,
    setAcceptingSegmentId,
  };

  const visibleStatusOrder = supplier.statusOrder.filter(
    (status) => status !== "CLOSED" && status !== "CANCELLED"
  );
  const activeTab = (visibleStatusOrder as SupplierShipmentStatus[]).includes(
    supplier.activeStatus
  )
    ? supplier.activeStatus
    : visibleStatusOrder[0];

  // Always call hooks at the top level, not conditionally
  useEffect(() => {
    if (
      visibleStatusOrder.length > 0 &&
      !(visibleStatusOrder as SupplierShipmentStatus[]).includes(
        supplier.activeStatus
      )
    ) {
      supplier.setActiveStatus(visibleStatusOrder[0]);
    }
  }, [supplier, visibleStatusOrder]);

  if (!canRender) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(val) =>
          supplier.setActiveStatus(val as SupplierShipmentStatus)
        }
        className="space-y-4 sm:space-y-6"
      >
        <TabsList className="flex w-full flex-wrap gap-1.5 sm:gap-2 h-auto p-1">
          {visibleStatusOrder.map((status) => {
            const config = STATUS_CONFIG[status];
            return (
              <TabsTrigger
                key={status}
                value={status}
                className="flex-1 min-w-[70px] sm:min-w-[100px] md:min-w-[120px] text-xs sm:text-sm py-1.5 sm:py-2"
              >
                {config.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <SupplierSectionFilters
          areaQuery={supplier.areaQuery}
          setAreaQuery={supplier.setAreaQuery}
          hasAreaFilter={hasAreaFilter}
        />

        <SupplierStatusPanels
          statusOrder={visibleStatusOrder}
          shipmentsByStatus={supplier.shipmentsByStatus}
          loadingByStatus={supplier.loadingByStatus}
          filterShipmentsByArea={supplier.filterShipmentsByArea}
          hasAreaFilter={hasAreaFilter}
          actionContext={actionContext}
        />
      </Tabs>

      <SupplierHandoverDialog />
      <Dialog
        open={takeoverDialogOpen}
        onOpenChange={handleTakeoverDialogChange}
      >
        <DialogContent className="mx-2 w-[calc(100%-1rem)] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Confirm segment takeover</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              We will use your current location for this takeover request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-2">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Segment ID:{" "}
                <span className="font-medium text-foreground break-all">
                  {takeoverSegmentIdentifier ?? "N/A"}
                </span>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs sm:text-sm font-medium">Location status</label>
              <div className="rounded-md border border-border/60 bg-muted/30 px-2.5 sm:px-3 py-2 text-xs sm:text-sm">
                {takeoverLocating ? (
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    Fetching your GPS location...
                  </span>
                ) : takeoverLocationError ? (
                  <span className="text-destructive">
                    {takeoverLocationError}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Location captured and ready to send.
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Your browser location is captured automatically and will be sent
                with this takeover.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={closeTakeoverDialog}
              disabled={takeoverBusy}
              className="w-full sm:w-auto order-2 sm:order-1 h-9 sm:h-10 text-sm"
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmTakeover} disabled={takeoverDisabled} className="w-full sm:w-auto order-1 sm:order-2 h-9 sm:h-10 text-sm">
              {takeoverBusy ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  Taking over...
                </span>
              ) : (
                "Confirm Takeover"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Access Denied Error Dialog */}
      <AlertDialog
        open={takeoverErrorDialogOpen}
        onOpenChange={setTakeoverErrorDialogOpen}
      >
        <AlertDialogContent className="mx-2 w-[calc(100%-1rem)] sm:w-full max-w-sm rounded-xl sm:rounded-lg p-4 sm:p-6">
          <AlertDialogHeader className="gap-3 sm:gap-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <AlertDialogTitle className="text-base sm:text-lg">
                  Location Verification Failed
                </AlertDialogTitle>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-destructive">
            {takeoverError}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction
              className="bg-blue-600 hover:bg-blue-700 text-white h-9 sm:h-10 text-sm"
              onClick={() => setTakeoverErrorDialogOpen(false)}
            >
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type SupplierSectionFiltersProps = {
  areaQuery: string;
  setAreaQuery: (value: string) => void;
  hasAreaFilter: boolean;
};

function SupplierSectionFilters({
  areaQuery,
  setAreaQuery,
  hasAreaFilter,
}: SupplierSectionFiltersProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-2.5 sm:left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={areaQuery}
          onChange={(event) => setAreaQuery(event.target.value)}
          placeholder="Search area, checkpoint..."
          className="pl-8 sm:pl-9 h-9 sm:h-10 text-sm"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground sm:justify-end">
        <span className="max-w-xs"></span>
        {hasAreaFilter && (
          <Button variant="ghost" size="sm" onClick={() => setAreaQuery("")} className="h-8 text-xs">
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

type SupplierStatusPanelsProps = {
  statusOrder: SupplierShipmentStatus[];
  shipmentsByStatus: Record<SupplierShipmentStatus, SupplierShipmentRecord[]>;
  loadingByStatus: Record<SupplierShipmentStatus, boolean>;
  filterShipmentsByArea: (
    shipments: SupplierShipmentRecord[]
  ) => SupplierShipmentRecord[];
  hasAreaFilter: boolean;
  actionContext: SupplierActionContext;
};

const SupplierStatusPanels = ({
  statusOrder,
  shipmentsByStatus,
  loadingByStatus,
  filterShipmentsByArea,
  hasAreaFilter,
  actionContext,
}: SupplierStatusPanelsProps) => (
  <>
    {statusOrder.map((status) => {
      const config = STATUS_CONFIG[status];
      const shipments = shipmentsByStatus[status] ?? [];
      const filteredShipments = filterShipmentsByArea(shipments);
      const isLoading = loadingByStatus?.[status] ?? false;
      const EmptyIcon = hasAreaFilter ? MapPin : config.icon;
      const emptyTitle = hasAreaFilter
        ? config.emptyFilteredTitle
        : config.emptyTitle;
      const emptyDescription = hasAreaFilter
        ? "Try a different area or clear the filter to see all consignments."
        : config.emptyDescription;

      return (
        <TabsContent key={status} value={status}>
          <SupplierSectionHeader
            title={config.title}
            description={config.description}
          />
          {isLoading ? (
            <SupplierEmptyState
              icon={config.icon}
              title={config.loadingTitle}
              description={config.loadingDescription}
              isLoading
            />
          ) : filteredShipments.length === 0 ? (
            <SupplierEmptyState
              icon={EmptyIcon}
              title={emptyTitle}
              description={emptyDescription}
            />
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {filteredShipments.map((shipment) => {
                const segmentIdentifier = shipment.segmentId ?? shipment.id;
                return (
                  <SupplierShipmentCard
                    key={`${shipment.id}-${status}`}
                    shipment={shipment}
                    actions={
                      <div className="flex flex-wrap gap-2">
                        <SupplierShipmentActions
                          status={status}
                          shipment={shipment}
                          context={actionContext}
                        />
                        <ViewShipmentButton
                          segmentId={segmentIdentifier}
                          shipmentId={shipment.shipmentId}
                        />
                      </div>
                    }
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      );
    })}
  </>
);

type SupplierActionContext = {
  supplier: ReturnType<typeof useSupplierContext>;
  sharedUuid?: string | null;
  openHandoverDialog: (shipment: SupplierShipmentRecord) => void;
  openTakeoverDialog: (shipment: SupplierShipmentRecord) => void;
  handleDownloadProof: (shipment: SupplierShipmentRecord) => void;
  handleReportIssue: (shipment: SupplierShipmentRecord) => void;
  acceptDialogSegmentId: string | null;
  setAcceptDialogSegmentId: (id: string | null) => void;
  acceptingSegmentId: string | null;
  setAcceptingSegmentId: (id: string | null) => void;
};

type SupplierShipmentActionsProps = {
  status: SupplierShipmentStatus;
  shipment: SupplierShipmentRecord;
  context: SupplierActionContext;
};

const SupplierShipmentActions = ({
  status,
  shipment,
  context,
}: SupplierShipmentActionsProps) => {
  const { showSuccess, showError, showInfo, showWarning } = useAppToast();
  const {
    supplier,
    sharedUuid,
    openHandoverDialog,
    openTakeoverDialog,
    handleDownloadProof,
    handleReportIssue,
    acceptDialogSegmentId,
    setAcceptDialogSegmentId,
    acceptingSegmentId,
    setAcceptingSegmentId,
  } = context;
  const queryClient = useQueryClient();
  const segmentIdentifier = shipment.segmentId ?? shipment.id;

  // Always call useQuery, but control fetching with 'enabled'
  const dialogOpen = acceptDialogSegmentId === segmentIdentifier;
  const { data: segmentDetail, isLoading: loadingSegmentDetail } = useQuery({
    queryKey: ["shipmentSegmentDetail", segmentIdentifier],
    queryFn: () => shipmentService.getSegmentById(segmentIdentifier),
    enabled: dialogOpen && Boolean(segmentIdentifier),
  });

  if (!supplier.enabled) return null;

  const allowAction = (
    flag: keyof NonNullable<SupplierShipmentRecord["actions"]>
  ): boolean => {
    const permissions = shipment.actions;
    if (!permissions || typeof permissions[flag] === "undefined") return true;
    return Boolean(permissions[flag]);
  };

  switch (status) {
    case "PENDING": {
      const canAccept = allowAction("canAccept");
      const isAccepting = acceptingSegmentId === segmentIdentifier;
      const handleDialogChange = (open: boolean) => {
        if (isAccepting) return;
        setAcceptDialogSegmentId(open ? segmentIdentifier : null);
      };
      const arrivalText = formatArrivalText(
        segmentDetail?.estimatedArrivalDate ?? shipment.expectedArrival
      );
      const segmentPackages = Array.isArray(segmentDetail?.packages)
        ? segmentDetail.packages
        : extractShipmentItems(shipment);
      const itemPreview = segmentPackages.slice(0, 3);
      const remainingItems = Math.max(
        segmentPackages.length - itemPreview.length,
        0
      );
      const startLocation =
        segmentDetail?.startCheckpoint?.name ||
        [
          segmentDetail?.startCheckpoint?.state,
          segmentDetail?.startCheckpoint?.country,
        ]
          .filter(Boolean)
          .join(", ") ||
        shipment.startCheckpoint?.name ||
        [shipment.startCheckpoint?.state, shipment.startCheckpoint?.country]
          .filter(Boolean)
          .join(", ") ||
        shipment.originArea ||
        shipment.pickupArea ||
        "Unknown";
      const endLocation =
        segmentDetail?.endCheckpoint?.name ||
        segmentDetail?.consumer?.name ||
        shipment.endCheckpoint?.name ||
        shipment.consumerName ||
        shipment.destinationPartyName ||
        [
          segmentDetail?.endCheckpoint?.state,
          segmentDetail?.endCheckpoint?.country,
        ]
          .filter(Boolean)
          .join(", ") ||
        [shipment.endCheckpoint?.state, shipment.endCheckpoint?.country]
          .filter(Boolean)
          .join(", ") ||
        shipment.destinationArea ||
        shipment.dropoffArea ||
        "Unknown";
      const expectedArrivalAbsolute =
        segmentDetail?.estimatedArrivalDate || shipment.expectedArrival
          ? new Date(
              segmentDetail?.estimatedArrivalDate || shipment.expectedArrival
            ).toLocaleString()
          : null;
      const handleAccept = async () => {
        if (isAccepting || !canAccept) return;
        setAcceptingSegmentId(segmentIdentifier);
        try {
          await shipmentService.accept(String(segmentIdentifier));

          // Show success toast
          showSuccess("Segment accepted successfully");

          // Invalidate and refetch all relevant queries immediately
          if (sharedUuid) {
            // Invalidate incoming shipments
            await queryClient.invalidateQueries({
              queryKey: ["incomingShipments", sharedUuid],
            });

            // Invalidate all supplier segment statuses
            await Promise.all(
              supplier.statusOrder.map((status) =>
                queryClient.invalidateQueries({
                  queryKey: ["supplierSegments", sharedUuid, status],
                })
              )
            );

            // Force immediate refetch of active tab
            await queryClient.refetchQueries({
              queryKey: ["supplierSegments", sharedUuid, supplier.activeStatus],
            });
          } else {
            // Fallback if no UUID
            await queryClient.invalidateQueries({
              queryKey: ["incomingShipments"],
            });
            await queryClient.invalidateQueries({
              queryKey: ["supplierSegments"],
            });
            await queryClient.refetchQueries({
              queryKey: ["supplierSegments"],
            });
          }

          setAcceptDialogSegmentId(null);
        } catch (error) {
          console.error("Segment acceptance error:", error);
          const message =
            typeof error === "object" &&
            error !== null &&
            "response" in error &&
            typeof (error as { response?: { data?: { error?: string } } })
              .response?.data?.error === "string"
              ? (error as { response?: { data?: { error?: string } } }).response
                  ?.data?.error
              : "Please try again";
          showError(message);
        } finally {
          setAcceptingSegmentId(null);
          setAcceptDialogSegmentId(null);
        }
      };
      return (
        <AlertDialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              className="gap-1.5 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm"
              disabled={isAccepting || !canAccept}
              onClick={() => setAcceptDialogSegmentId(segmentIdentifier)}
            >
              {isAccepting ? (
                <>
                  <LoaderIndicator />
                  <span className="hidden sm:inline">Accepting...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Accept
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="mx-2 w-[calc(100%-1rem)] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg p-4 sm:p-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg break-all">
                Accept segment {segmentIdentifier}?
              </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
              <p>
                Review the segment details before accepting. The manufacturer
                will be notified.
              </p>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 sm:p-4 text-foreground shadow-inner">
                <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
                  <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[120px_1fr] items-start gap-2 text-[10px] sm:text-xs text-muted-foreground">
                    <span>Shipment ID</span>
                    <span className="font-semibold text-foreground truncate">
                      {segmentDetail?.shipmentId ??
                        shipment.shipmentId ??
                        segmentIdentifier}
                    </span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[120px_1fr] items-start gap-2 text-[10px] sm:text-xs text-muted-foreground">
                    <span>Segment ID</span>
                    <span className="font-semibold text-foreground truncate">
                      {segmentIdentifier}
                    </span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[120px_1fr] items-start gap-2 text-[10px] sm:text-xs text-muted-foreground">
                    <span>From</span>
                    <span className="font-semibold text-foreground break-words">
                      {startLocation}
                    </span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[120px_1fr] items-start gap-2 text-[10px] sm:text-xs text-muted-foreground">
                    <span>To</span>
                    <span className="font-semibold text-foreground break-words">
                      {endLocation}
                    </span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[120px_1fr] items-start gap-2 text-[10px] sm:text-xs text-muted-foreground">
                    <span>Expected</span>
                    <span className="font-semibold text-foreground">
                      {expectedArrivalAbsolute ?? arrivalText}
                    </span>
                  </div>
                  <div className="border-t pt-2.5 sm:pt-3">
                    <p className="text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      Items
                    </p>
                    {loadingSegmentDetail ? (
                      <p className="text-[10px] sm:text-xs text-muted-foreground inline-flex items-center gap-2">
                        <LoaderIndicator />
                        Loading items...
                      </p>
                    ) : itemPreview.length === 0 ? (
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        No items listed
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {itemPreview.map((item, idx) => (
                          <div
                            key={`${segmentIdentifier}-preview-${idx}`}
                            className="flex justify-between text-xs sm:text-sm"
                          >
                            <span className="font-medium text-foreground truncate max-w-[150px] sm:max-w-none">
                              {item.productName}
                            </span>
                            <span className="text-muted-foreground flex-shrink-0 ml-2">
                              x{item.quantity}
                            </span>
                          </div>
                        ))}
                        {remainingItems > 0 && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            +{remainingItems} more item
                            {remainingItems > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 pt-2">
              <AlertDialogCancel disabled={isAccepting} className="w-full sm:w-auto order-2 sm:order-1 h-9 sm:h-10 text-sm">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  handleAccept();
                }}
                disabled={!canAccept || isAccepting}
                className="w-full sm:w-auto order-1 sm:order-2 h-9 sm:h-10 text-sm"
              >
                {isAccepting ? (
                  <span className="inline-flex items-center gap-2">
                    <LoaderIndicator />
                    Accepting...
                  </span>
                ) : (
                  "Confirm"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }
    case "ACCEPTED": {
      const canTakeover = allowAction("canTakeover");
      const isTakingOver =
        supplier.takeoverPending &&
        supplier.takeoverSegmentId === segmentIdentifier;
      return (
        <Button
          size="sm"
          className="gap-1.5 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm"
          disabled={isTakingOver || !canTakeover}
          onClick={() => openTakeoverDialog(shipment)}
        >
          {isTakingOver ? (
            <>
              <LoaderIndicator />
              <span className="hidden sm:inline">Taking over...</span>
              <span className="sm:hidden">...</span>
            </>
          ) : (
            "Take Over"
          )}
        </Button>
      );
    }
    case "IN_TRANSIT": {
      const canHandover = allowAction("canHandover");
      return (
        <Button
          size="sm"
          onClick={() => openHandoverDialog(shipment)}
          disabled={!canHandover}
          className="h-8 sm:h-9 text-xs sm:text-sm"
        >
          Handover
        </Button>
      );
    }
    case "CLOSED":
      return (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleDownloadProof(shipment)}
          className="h-8 sm:h-9 text-xs sm:text-sm"
        >
          <span className="hidden sm:inline">Download Proof</span>
          <span className="sm:hidden">Proof</span>
        </Button>
      );
    case "CANCELLED":
      return (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleReportIssue(shipment)}
          className="h-8 sm:h-9 text-xs sm:text-sm"
        >
          <span className="hidden sm:inline">Report Issue</span>
          <span className="sm:hidden">Report</span>
        </Button>
      );
    default:
      return null;
  }
};

type SupplierSectionHeaderProps = {
  title: string;
  description: string;
};

function SupplierSectionHeader({
  title,
  description,
}: SupplierSectionHeaderProps) {
  return (
    <div className="mb-2 sm:mb-3 space-y-0.5 sm:space-y-1">
      <h3 className="text-base sm:text-lg font-semibold">{title}</h3>
      {description ? (
        <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

type SupplierEmptyStateProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  isLoading?: boolean;
};

function SupplierEmptyState({
  icon: Icon,
  title,
  description,
  isLoading,
}: SupplierEmptyStateProps) {
  return (
    <Card className="border-dashed border-border/60 bg-muted/20 text-center">
      <CardContent className="space-y-2 sm:space-y-3 py-8 sm:py-12 px-4">
        <span className="mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {isLoading ? <LoaderIndicator /> : <Icon className="h-5 w-5 sm:h-6 sm:w-6" />}
        </span>
        <div className="space-y-0.5 sm:space-y-1">
          <h4 className="font-semibold text-foreground text-sm sm:text-base">{title}</h4>
          <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

type SupplierShipmentCardProps = {
  shipment: SupplierShipmentRecord;
  actions?: React.ReactNode;
};

function SupplierShipmentCard({
  shipment,
  actions,
}: SupplierShipmentCardProps) {
  const normalized = normalizeStatus(shipment.status);
  const integrityMeta = getIntegrityMeta(shipment.integrity);
  const arrivalText = formatArrivalText(shipment.expectedArrival);
  const parseDateValue = (value?: string) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const expectedShipDate = parseDateValue(shipment.expectedShipDate);
  const expectedShipAbsolute = expectedShipDate
    ? shipmentDateFormatter.format(expectedShipDate)
    : null;
  const arrivalDate = parseDateValue(shipment.expectedArrival);
  const arrivalAbsolute = arrivalDate
    ? shipmentDateFormatter.format(arrivalDate)
    : null;
  const items = extractShipmentItems(shipment);
  const primaryEntityName =
    shipment.consumerName ??
    shipment.destinationPartyName ??
    shipment.manufacturerName ??
    "Shipment";
  const primaryEntityLabel =
    shipment.consumerName || shipment.destinationPartyName
      ? "Destination"
      : "Manufacturer";
  const shipmentIdentifier =
    shipment.shipmentId ?? shipment.segmentId ?? shipment.id;
  const segmentIdentifier = shipment.segmentId ?? shipment.id;
  const pickupLabel = shipment.pickupArea ?? shipment.originArea ?? "Origin";
  const dropoffLabel =
    shipment.dropoffArea ?? shipment.destinationArea ?? "Destination";
  const startLabel =
    shipment.startCheckpoint?.name ||
    [shipment.startCheckpoint?.state, shipment.startCheckpoint?.country]
      .filter(Boolean)
      .join(", ") ||
    pickupLabel;
  const startSubLabel = [
    shipment.startCheckpoint?.state,
    shipment.startCheckpoint?.country,
  ]
    .filter(Boolean)
    .join(", ");
  const endLabel =
    shipment.endCheckpoint?.name ||
    shipment.consumerName ||
    shipment.destinationPartyName ||
    [shipment.endCheckpoint?.state, shipment.endCheckpoint?.country]
      .filter(Boolean)
      .join(", ") ||
    dropoffLabel;
  const endSubLabel = [
    shipment.endCheckpoint?.state,
    shipment.endCheckpoint?.country,
  ]
    .filter(Boolean)
    .join(", ");
  const packagesCount = items.length;
  const shortShipmentId = (shipmentIdentifier || "").slice(0, 8) || "-";

  return (
    <Card className="border-0 bg-white shadow-md transition-all hover:shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-100 px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-cyan-700 mb-1 sm:mb-1.5">
              📍 {endSubLabel || dropoffLabel}
            </p>
            <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
              Segment #{shortShipmentId}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            <Badge
              variant="outline"
              className={`text-[10px] sm:text-xs ${integrityMeta.className}`}
            >
              {integrityMeta.label}
            </Badge>
            <Badge
              className={cn(
                "text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1",
                supplierStatusBadgeClass(normalized)
              )}
            >
              {humanizeSupplierStatus(normalized)}
            </Badge>
          </div>
        </div>
      </div>

      <CardContent className="space-y-2.5 sm:space-y-3 p-3 sm:p-4">
        {/* Route Section */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="flex gap-2 sm:gap-3 items-start flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase text-muted-foreground mb-0.5">
                  From
                </p>
                <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{startLabel}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                  {startSubLabel || pickupLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center self-center">
              <div className="bg-cyan-100 rounded-full p-1.5 sm:p-2">
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-600" />
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 items-start flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase text-muted-foreground mb-0.5">
                  To
                </p>
                <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{endLabel}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                  {endSubLabel || dropoffLabel}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-100">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {expectedShipAbsolute && (
              <div className="flex items-center gap-1 sm:gap-1.5 bg-blue-50 rounded-full px-2 sm:px-3 py-1 sm:py-2 border border-blue-200">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600" />
                <span className="text-[10px] sm:text-xs font-semibold text-blue-900">
                  {expectedShipAbsolute.split(",")[0]}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-orange-50 rounded-full px-2 sm:px-3 py-1 sm:py-2 border border-orange-200">
              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-600" />
              <span className="text-[10px] sm:text-xs font-semibold text-orange-900">
                {arrivalAbsolute?.split(",")[0] ?? arrivalText}
              </span>
            </div>
            {shipment.timeTolerance && (
              <div className="flex items-center gap-1 sm:gap-1.5 bg-purple-50 rounded-full px-2 sm:px-3 py-1 sm:py-2 border border-purple-200">
                <Hourglass className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-600" />
                <span className="text-[10px] sm:text-xs font-semibold text-purple-900">
                  {shipment.timeTolerance}
                </span>
              </div>
            )}
            {packagesCount > 0 && (
              <div className="flex items-center gap-1 sm:gap-1.5 bg-green-50 rounded-full px-2 sm:px-3 py-1 sm:py-2 border border-green-200 ml-auto">
                <Package className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600" />
                <span className="text-[10px] sm:text-xs font-semibold text-green-900">
                  {packagesCount} pkg
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions ? <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1 sm:pt-2">{actions}</div> : null}
      </CardContent>
    </Card>
  );
}

function LoaderIndicator() {
  return (
    <span className="inline-flex items-center justify-center">
      <Loader2 className="h-4 w-4 animate-spin" />
    </span>
  );
}

function SupplierHandoverDialog() {
  const supplier = useSupplierContext();
  const { showError } = useAppToast();
  const [handoverLocating, setHandoverLocating] = useState(false);
  const [handoverLocationError, setHandoverLocationError] = useState<
    string | null
  >(null);
  const [handoverError, setHandoverError] = useState<string | null>(null);
  const [handoverErrorDialogOpen, setHandoverErrorDialogOpen] = useState(false);

  const coordsMissing =
    supplier.handoverForm.latitude.trim().length === 0 ||
    supplier.handoverForm.longitude.trim().length === 0;

  const requestHandoverLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      showError("Geolocation is unavailable in this browser");
      setHandoverLocationError("Geolocation unavailable");
      return;
    }
    setHandoverLocating(true);
    setHandoverLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        supplier.setHandoverForm((prev) => ({
          ...prev,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        }));
        setHandoverLocating(false);
        setHandoverLocationError(null);
      },
      (error) => {
        console.error(error);
        showError(
          "Unable to fetch your location. Allow location access and try again"
        );
        setHandoverLocating(false);
        setHandoverLocationError("Location access denied or unavailable");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!supplier.enabled) return;
    if (supplier.handoverDialogOpen) {
      requestHandoverLocation();
    } else {
      setHandoverLocationError(null);
      setHandoverLocating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplier.handoverDialogOpen, supplier.enabled]);

  const handleConfirmHandover = async () => {
    try {
      await supplier.submitHandover();
    } catch (err) {
      const errorMessage =
        extractApiErrorMessage(err) ||
        (err as { message?: unknown })?.message ||
        JSON.stringify(err || "");
      const popupMessage = buildRangePopupMessage(
        typeof errorMessage === "string" ? errorMessage : String(errorMessage),
        "handover"
      );
      if (popupMessage) {
        supplier.setHandoverDialogOpen(false);
        setHandoverError(popupMessage);
        setHandoverErrorDialogOpen(true);
      }
    }
  };

  if (!supplier.enabled) return null;

  return (
    <>
      <Dialog
        open={supplier.handoverDialogOpen}
        onOpenChange={supplier.setHandoverDialogOpen}
      >
        <DialogContent className="mx-2 w-[calc(100%-1rem)] sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Handover shipment</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Your current location will be attached to finalize this handover.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Browser location is requested automatically; the coordinates are
              sent with this handover.
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-xs sm:text-sm font-medium">Location status</label>
              <div className="rounded-md border border-border/60 bg-muted/30 px-2.5 sm:px-3 py-2 text-xs sm:text-sm">
                {handoverLocating ? (
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    Fetching your GPS location...
                  </span>
                ) : handoverLocationError ? (
                  <span className="text-destructive">
                    {handoverLocationError}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Location captured and ready to send.
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                If permission is blocked, enable location in your browser and
                reopen this dialog.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => supplier.setHandoverDialogOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1 h-9 sm:h-10 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmHandover}
              disabled={
                supplier.handoverLoading ||
                handoverLocating ||
                handoverLocationError !== null ||
                coordsMissing
              }
              className="w-full sm:w-auto order-1 sm:order-2 h-9 sm:h-10 text-sm"
            >
              {supplier.handoverLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Confirm handover"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={handoverErrorDialogOpen}
        onOpenChange={setHandoverErrorDialogOpen}
      >
        <AlertDialogContent className="mx-2 w-[calc(100%-1rem)] sm:w-full max-w-sm rounded-xl sm:rounded-lg p-4 sm:p-6">
          <AlertDialogHeader className="gap-3 sm:gap-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <AlertDialogTitle className="text-base sm:text-lg">
                  Location Verification Failed
                </AlertDialogTitle>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-destructive">
            {handoverError}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction
              className="bg-blue-600 hover:bg-blue-700 text-white h-9 sm:h-10 text-sm"
              onClick={() => setHandoverErrorDialogOpen(false)}
            >
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
