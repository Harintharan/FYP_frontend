import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Bus,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { handoverUtils, useHandoverSharedContext, useSupplierContext } from "../context";
import type { SupplierShipmentRecord } from "../types";
import { formatDistanceToNow } from "date-fns";

const { deriveRouteLabel, extractShipmentItems, resolveShipmentAreas, supplierStatusBadgeClass, normalizeStatus, formatArrivalText } = handoverUtils;

const shipmentDateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function SupplierSection() {
  const shared = useHandoverSharedContext();
  const supplier = useSupplierContext();

  if (!supplier.enabled || shared.role !== "SUPPLIER") {
    return null;
  }

  const hasAreaFilter = supplier.areaQuery.trim().length > 0;

  const filteredSupplierPool = supplier.filterShipmentsByArea(supplier.supplierPool);
  const filteredSupplierActive = supplier.filterShipmentsByArea(supplier.supplierActive);
  const filteredSupplierDelivered = supplier.filterShipmentsByArea(supplier.supplierDelivered);
  const filteredSupplierHistory = supplier.filterShipmentsByArea(supplier.supplierHistory);

  const openHandoverDialog = (shipment: SupplierShipmentRecord) => {
    supplier.setHandoverTarget(shipment);
    supplier.setHandoverDialogOpen(true);
  };

  const handleMarkPickedUp = (shipment: SupplierShipmentRecord) => {
    toast.success(`Shipment ${shipment.id} marked as picked up (demo)`);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="incoming" className="space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="incoming" className="sm:min-w-[160px]">
            Incoming
          </TabsTrigger>
          <TabsTrigger value="active" className="sm:min-w-[160px]">
            Active
          </TabsTrigger>
          <TabsTrigger value="delivered" className="sm:min-w-[160px]">
            Delivered
          </TabsTrigger>
          <TabsTrigger value="history" className="sm:min-w-[160px]">
            History
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={supplier.areaQuery}
              onChange={(event) => supplier.setAreaQuery(event.target.value)}
              placeholder="Search by area, checkpoint, or delivery zone"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground sm:justify-end">
            <span className="max-w-xs">
              Filters supplier consignments across all tabs by logistics area.
            </span>
            {hasAreaFilter && (
              <Button variant="ghost" size="sm" onClick={() => supplier.setAreaQuery("")}>
                Clear
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="incoming">
          <SupplierSectionHeader
            title="Awaiting your acceptance"
            description="Inspect consignment details and accept once the shipment is received."
          />

          {supplier.loadingIncoming ? (
            <SupplierEmptyState
              icon={Truck}
              title="Loading consignments"
              description="Fetching the latest shipments assigned to your organisation."
              isLoading
            />
          ) : filteredSupplierPool.length === 0 ? (
            <SupplierEmptyState
              icon={hasAreaFilter ? MapPin : Truck}
              title={hasAreaFilter ? "No consignments in this area" : "No shipments to accept"}
              description={
                hasAreaFilter
                  ? "Adjust the area filter or clear it to view all assigned consignments."
                  : "Once a manufacturer assigns a shipment to you it will appear here."
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
              {filteredSupplierPool.map((shipment) => (
                <SupplierShipmentCard
                  key={`${shipment.id}-incoming`}
                  shipment={shipment}
                  actions={
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          className="gap-2"
                          disabled={
                            supplier.acceptShipmentPending &&
                            supplier.acceptingShipmentId === shipment.id
                          }
                        >
                          {supplier.acceptShipmentPending &&
                            supplier.acceptingShipmentId === shipment.id ? (
                            <>
                              <LoaderIndicator />
                              Accepting...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              Accept Shipment
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Accept shipment {shipment.id}?
                          </AlertDialogTitle>
                        </AlertDialogHeader>
                        <p className="text-sm text-muted-foreground">
                          Confirm contents and quantities before accepting. This will notify the manufacturer.
                        </p>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => supplier.acceptShipment(String(shipment.id))}
                            disabled={
                              supplier.acceptShipmentPending &&
                              supplier.acceptingShipmentId === shipment.id
                            }
                          >
                            Confirm acceptance
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active">
          <SupplierSectionHeader
            title="Active consignments"
            description="Prepare handovers for downstream checkpoints or partners."
          />

          {supplier.loadingIncoming ? (
            <SupplierEmptyState
              icon={ShieldCheck}
              title="Loading active shipments"
              description="Fetching accepted consignments."
              isLoading
            />
          ) : filteredSupplierActive.length === 0 ? (
            <SupplierEmptyState
              icon={hasAreaFilter ? MapPin : ShieldCheck}
              title={hasAreaFilter ? "Area filter returned no active consignments" : "No active consignments"}
              description={
                hasAreaFilter
                  ? "Try a different area or clear the filter to see all active consignments."
                  : "Accepted consignments awaiting handover will appear here."
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredSupplierActive.map((shipment) => {
                const normalized = normalizeStatus(shipment.status);
                const isPickedUp = ["ACCEPTED", "IN_TRANSIT", "READY_FOR_HANDOVER", "HANDOVER_PENDING"].includes(
                  normalized,
                );
                return (
                  <SupplierShipmentCard
                    key={`${shipment.id}-active`}
                    shipment={shipment}
                    actions={
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => openHandoverDialog(shipment)}>
                          {isPickedUp ? "Prepare Handover" : "Mark as Picked Up"}
                        </Button>
                        {!isPickedUp ? (
                          <Button variant="ghost" onClick={() => handleMarkPickedUp(shipment)}>
                            Mark Picked Up
                          </Button>
                        ) : null}
                      </div>
                    }
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="delivered">
          <SupplierSectionHeader
            title="Delivered consignments"
            description="Recently handed over shipments awaiting confirmation."
          />

          {supplier.loadingIncoming ? (
            <SupplierEmptyState
              icon={Truck}
              title="Loading delivered shipments"
              description="Retrieving consignments handed over recently."
              isLoading
            />
          ) : filteredSupplierDelivered.length === 0 ? (
            <SupplierEmptyState
              icon={hasAreaFilter ? MapPin : Truck}
              title={hasAreaFilter ? "No delivered consignments in this area" : "No delivered consignments"}
              description={
                hasAreaFilter
                  ? "Broaden the search area to review recently delivered consignments."
                  : "Shipments you handover will appear here before entering history."
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredSupplierDelivered.map((shipment) => (
                <SupplierShipmentCard key={`${shipment.id}-delivered`} shipment={shipment} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <SupplierSectionHeader
            title="Handover history"
            description="Traceability records for completed consignments."
          />

          {supplier.loadingIncoming ? (
            <SupplierEmptyState
              icon={CheckCircle2}
              title="Loading history"
              description="Retrieving recorded handovers."
              isLoading
            />
          ) : filteredSupplierHistory.length === 0 ? (
            <SupplierEmptyState
              icon={hasAreaFilter ? MapPin : CheckCircle2}
              title={hasAreaFilter ? "No historical consignments in this area" : "No historical consignments"}
              description={
                hasAreaFilter
                  ? "Reset the filter to review the complete handover history."
                  : "Completed handovers will be archived here for traceability."
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredSupplierHistory.map((shipment) => (
                <SupplierShipmentCard key={`${shipment.id}-history`} shipment={shipment} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <SupplierHandoverDialog />
    </div>
  );
}

type SupplierSectionHeaderProps = {
  title: string;
  description: string;
};

function SupplierSectionHeader({ title, description }: SupplierSectionHeaderProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

type SupplierEmptyStateProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  isLoading?: boolean;
};

function SupplierEmptyState({ icon: Icon, title, description, isLoading }: SupplierEmptyStateProps) {
  return (
    <Card className="border-dashed border-border/60 bg-muted/20 text-center">
      <CardContent className="space-y-3 py-12">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {isLoading ? <LoaderIndicator /> : <Icon className="h-6 w-6" />}
        </span>
        <div className="space-y-1">
          <h4 className="font-semibold text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

type SupplierShipmentCardProps = {
  shipment: SupplierShipmentRecord;
  actions?: React.ReactNode;
};

function SupplierShipmentCard({ shipment, actions }: SupplierShipmentCardProps) {
  const normalized = normalizeStatus(shipment.status);
  const arrivalText = formatArrivalText(shipment.expectedArrival);
  const parseDateValue = (value?: string) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const expectedShipDate = parseDateValue(shipment.expectedShipDate);
  const expectedShipAbsolute = expectedShipDate ? shipmentDateFormatter.format(expectedShipDate) : null;
  const expectedShipRelative = expectedShipDate
    ? formatDistanceToNow(expectedShipDate, { addSuffix: true })
    : null;
  const arrivalDate = parseDateValue(shipment.expectedArrival);
  const arrivalAbsolute = arrivalDate ? shipmentDateFormatter.format(arrivalDate) : null;
  const arrivalRelative =
    arrivalDate && arrivalText && arrivalText !== "Unknown ETA" ? arrivalText : null;
  const items = extractShipmentItems(shipment);
  const itemPreview = items.slice(0, 2);
  const remainingItems = Math.max(items.length - itemPreview.length, 0);
  const routeLabel = deriveRouteLabel(shipment);
  const areaTokens = resolveShipmentAreas(shipment);
  const displayedAreas = areaTokens.slice(0, 2);
  const remainingAreas = Math.max(areaTokens.length - displayedAreas.length, 0);
  const manufacturerLabel = shipment.manufacturerName ?? "Shipment";
  const pickupLabel = shipment.pickupArea ?? shipment.originArea ?? "Origin";
  const dropoffLabel = shipment.dropoffArea ?? shipment.destinationArea ?? "Destination";

  return (
    <Card className="border border-border/50 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Manufacturer</p>
            <p className="text-base font-semibold leading-tight text-foreground">{manufacturerLabel}</p>
            <p className="text-xs text-muted-foreground">
              Shipment ID:&nbsp;
              <span className="font-medium text-foreground/80">{shipment.id}</span>
            </p>
          </div>
          <Badge className={cn("text-xs whitespace-nowrap", supplierStatusBadgeClass(normalized))}>
            {normalized.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3 text-primary/80" />
            {pickupLabel}
          </span>
          <ArrowRight className="h-3 w-3 text-muted-foreground/80" />
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3 text-primary/80" />
            {dropoffLabel}
          </span>

        </div>

        <div className="space-y-1">
          {itemPreview.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items listed</p>
          ) : (
            itemPreview.map((item, idx) => (
              <div key={`${shipment.id}-item-${idx}`} className="flex justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary/70" />
                  {item.productName}
                </span>
                <span className="text-muted-foreground">x{item.quantity}</span>
              </div>
            ))
          )}
          {remainingItems > 0 && (
            <p className="text-xs text-muted-foreground">
              +{remainingItems} more item{remainingItems > 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          {expectedShipAbsolute && (
            <span className="inline-flex items-center gap-2">
              <CalendarClock className="h-3 w-3" />
              Shipment available on {expectedShipAbsolute}

            </span>
          )}
          <span className="inline-flex items-center gap-2">
            <Clock className="h-3 w-3" />
            {normalized === "PENDING_ACCEPTANCE" ? "Should be handover on " : "Arrived"}{" "}
            {arrivalAbsolute ?? arrivalText}

          </span>
          {shipment.acceptedAt && (
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Accepted {formatDistanceToNow(new Date(shipment.acceptedAt), { addSuffix: true })}
            </span>
          )}
          {shipment.destinationCheckpoint && (
            <span className="inline-flex items-center gap-2">
              <Bus className="h-3 w-3 text-primary/70" />
              Next checkpoint: {shipment.destinationCheckpoint}
            </span>
          )}
          {shipment.handedOverAt && (
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              Handover {formatDistanceToNow(new Date(shipment.handedOverAt), { addSuffix: true })}
            </span>
          )}
        </div>

        {actions ? <div className="flex justify-end gap-2">{actions}</div> : null}
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

  if (!supplier.enabled) return null;

  return (
    <Dialog open={supplier.handoverDialogOpen} onOpenChange={supplier.setHandoverDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Prepare handover</DialogTitle>
          <DialogDescription>
            Provide the receiving party and any checkpoint notes. Once confirmed the shipment will move to the next leg.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="handoverToUUID" className="text-sm font-medium">
              Receiving party UUID
            </label>
            <Input
              id="handoverToUUID"
              placeholder="0x1234…abcd"
              value={supplier.handoverForm.handoverToUUID}
              onChange={(event) =>
                supplier.setHandoverForm((prev) => ({
                  ...prev,
                  handoverToUUID: event.target.value,
                }))
              }
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="checkpointNote" className="text-sm font-medium">
              Checkpoint / logistics note
            </label>
            <Textarea
              id="checkpointNote"
              rows={3}
              placeholder="e.g., Handover scheduled at Central Logistics Hub, dock #4."
              value={supplier.handoverForm.checkpointNote}
              onChange={(event) =>
                supplier.setHandoverForm((prev) => ({
                  ...prev,
                  checkpointNote: event.target.value,
                }))
              }
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="temperatureCheck" className="text-sm font-medium">
              Temperature compliance check
            </label>
            <Input
              id="temperatureCheck"
              placeholder="e.g., 4°C on departure"
              value={supplier.handoverForm.temperatureCheck}
              onChange={(event) =>
                supplier.setHandoverForm((prev) => ({
                  ...prev,
                  temperatureCheck: event.target.value,
                }))
              }
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => supplier.setHandoverDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={supplier.submitHandover} disabled={supplier.handoverLoading}>
            {supplier.handoverLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </span>
            ) : (
              "Confirm handover"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
