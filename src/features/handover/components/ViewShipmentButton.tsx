import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { shipmentService } from "@/services/shipmentService";
import type { ManufacturerShipmentRecord, SupplierShipmentRecord } from "../types";

type ViewShipmentButtonProps = {
  shipmentId?: string;
  segmentId?: string;
};

type ShipmentCheckpoint = {
  start_checkpoint_id?: number | string;
  end_checkpoint_id?: number | string;
  estimated_arrival_date?: string;
  expected_ship_date?: string;
  time_tolerance?: string;
  required_action?: string;
};

type ViewDetail = ManufacturerShipmentRecord &
  SupplierShipmentRecord & {
    shipment?: ManufacturerShipmentRecord | null;
    checkpoints?: ShipmentCheckpoint[];
    shipmentItems?: Array<{ product_uuid?: string; quantity?: number; productName?: string }>;
    packages?: Array<{
      productCategory?: string;
      productName?: string;
      requiredStartTemp?: string;
      requiredEndTemp?: string;
      quantity?: number;
    }>;
    estimatedArrivalDate?: string;
    estimated_arrival_date?: string;
    temperatureCheck?: string;
  };

type PackageDetail = {
  productCategory?: string;
  productName?: string;
  requiredStartTemp?: string;
  requiredEndTemp?: string;
  quantity?: number;
};

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const formatDateTime = (value?: string | null) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value ?? undefined;
  return dateTimeFormatter.format(date);
};

const formatCheckpoint = (checkpoint?: { state?: string; country?: string; id?: string }) => {
  if (!checkpoint) return undefined;
  const tokens = [checkpoint.state, checkpoint.country].filter(Boolean);
  if (tokens.length > 0) return tokens.join(", ");
  return checkpoint.id;
};

export function ViewShipmentButton({ shipmentId, segmentId }: ViewShipmentButtonProps) {
  const [open, setOpen] = useState(false);
  const hasSegmentTarget = Boolean(segmentId);
  const fetchId = segmentId ?? shipmentId;

  if (!fetchId) {
    console.warn("ViewShipmentButton requires either a segmentId or shipmentId.");
    return null;
  }

  const queryKey = hasSegmentTarget ? ["shipmentSegment", segmentId] : ["shipment", shipmentId];
  const queryFn = hasSegmentTarget
    ? () => shipmentService.getSegmentById(segmentId!)
    : () => shipmentService.getById(shipmentId!);

  const { data, isLoading } = useQuery<ViewDetail>({
    queryKey,
    queryFn,
    enabled: open,
  });

  const normalizedItems =
    (Array.isArray(data?.shipmentItems) && data?.shipmentItems?.length
      ? data?.shipmentItems
      : Array.isArray(data?.items)
        ? data?.items
        : []) ?? [];
  const explicitPackages: PackageDetail[] =
    Array.isArray(data?.packages) && data.packages.length > 0 ? data.packages : [];
  const fallbackPackages: PackageDetail[] = normalizedItems.map((item) => ({
    productName:
      (item as { productName?: string }).productName ??
      (item as { product_uuid?: string }).product_uuid,
    quantity: (item as { quantity?: number }).quantity ?? (item as { qty?: number }).qty,
  }));
  const packageDetails = explicitPackages.length > 0 ? explicitPackages : fallbackPackages;

  const detailTitle = hasSegmentTarget ? "Segment Details" : "Shipment Details";
  const segmentDisplayId = data?.segmentId ?? segmentId ?? undefined;
  const shipmentDisplayId =
    data?.shipmentId ?? data?.id ?? data?.shipment?.id ?? shipmentId ?? undefined;
  const manufacturerLabel =
    data?.manufacturerName ??
    data?.manufacturerUUID ??
    data?.fromUUID ??
    data?.shipment?.manufacturerUUID ??
    "Unknown";
  const consumerLabel =
    data?.shipment?.consumer?.legalName ??
    data?.consumerName ??
    data?.destinationPartyName ??
    data?.destinationPartyUUID ??
    data?.shipment?.destinationPartyUUID ??
    data?.toUUID ??
    "Unknown";
  const consumerId = data?.shipment?.consumer?.id ?? undefined;
  const statusLabel = (data?.status ?? "UNKNOWN").replace(/_/g, " ");
  const expectedShip = formatDateTime(
    data?.expectedShipDate ?? (data as { expected_ship_date?: string }).expected_ship_date,
  );
  const expectedArrival = formatDateTime(
    data?.expectedArrival ??
      data?.estimatedArrivalDate ??
      data?.estimated_arrival_date ??
      (data as { expected_arrival_date?: string }).expected_arrival_date,
  );
  const acceptedAt = formatDateTime(data?.acceptedAt);
  const handedOverAt = formatDateTime(data?.handedOverAt);
  const startCheckpointLabel =
    formatCheckpoint(data?.startCheckpoint) ?? data?.pickupArea ?? data?.originArea;
  const endCheckpointLabel =
    formatCheckpoint(data?.endCheckpoint) ?? data?.dropoffArea ?? data?.destinationArea;
  const startCheckpointId = data?.startCheckpoint?.id;
  const endCheckpointId = data?.endCheckpoint?.id;
  const timeTolerance = data?.timeTolerance ?? (data as { time_tolerance?: string }).time_tolerance;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{detailTitle}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : data ? (
          <div className="space-y-6 text-sm">
            <section>
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Segment Overview
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {shipmentDisplayId ? (
                  <div>
                    <p className="text-muted-foreground">Shipment ID</p>
                    <p className="font-medium break-all">{shipmentDisplayId}</p>
                  </div>
                ) : null}
                {segmentDisplayId ? (
                  <div>
                    <p className="text-muted-foreground">Segment ID</p>
                    <p className="font-medium break-all">{segmentDisplayId}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{statusLabel}</p>
                </div>
                {timeTolerance ? (
                  <div>
                    <p className="text-muted-foreground">Time Tolerance</p>
                    <p className="font-medium break-all">{timeTolerance}</p>
                  </div>
                ) : null}
                {expectedShip ? (
                  <div>
                    <p className="text-muted-foreground">Expected Ship Date</p>
                    <p className="font-medium break-all">{expectedShip}</p>
                  </div>
                ) : null}
                {expectedArrival ? (
                  <div>
                    <p className="text-muted-foreground">Estimated Arrival</p>
                    <p className="font-medium break-all">{expectedArrival}</p>
                  </div>
                ) : null}
                {data.segmentOrder !== undefined ? (
                  <div>
                    <p className="text-muted-foreground">Segment Order</p>
                    <p className="font-medium break-all">{data.segmentOrder}</p>
                  </div>
                ) : null}
                {acceptedAt ? (
                  <div>
                    <p className="text-muted-foreground">Accepted At</p>
                    <p className="font-medium break-all">{acceptedAt}</p>
                  </div>
                ) : null}
                {handedOverAt ? (
                  <div>
                    <p className="text-muted-foreground">Handed Over At</p>
                    <p className="font-medium break-all">{handedOverAt}</p>
                  </div>
                ) : null}
              </div>
            </section>

            <section>
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Parties
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Manufacturer</p>
                  <p className="font-medium break-all">{manufacturerLabel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Consumer</p>
                  <p className="font-medium break-all">{consumerLabel}</p>
                  {consumerId ? (
                    <p className="text-xs text-muted-foreground break-all">{consumerId}</p>
                  ) : null}
                </div>
                {data.destinationCheckpoint ? (
                  <div>
                    <p className="text-muted-foreground">Next Checkpoint</p>
                    <p className="font-medium break-all">{data.destinationCheckpoint}</p>
                  </div>
                ) : null}
              </div>
            </section>

            <section>
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Checkpoints
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {startCheckpointLabel ? (
                  <div>
                    <p className="text-muted-foreground">Start</p>
                    <p className="font-medium break-all">{startCheckpointLabel}</p>
                    {startCheckpointId ? (
                      <p className="text-xs text-muted-foreground break-all">{startCheckpointId}</p>
                    ) : null}
                  </div>
                ) : null}
                {endCheckpointLabel ? (
                  <div>
                    <p className="text-muted-foreground">End</p>
                    <p className="font-medium break-all">{endCheckpointLabel}</p>
                    {endCheckpointId ? (
                      <p className="text-xs text-muted-foreground break-all">{endCheckpointId}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>

            <section>
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Packages
              </p>
              {packageDetails.length > 0 ? (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr className="text-left">
                        <th className="px-3 py-2 font-medium">Category</th>
                        <th className="px-3 py-2 font-medium">Product</th>
                        <th className="px-3 py-2 font-medium">Quantity</th>
                        <th className="px-3 py-2 font-medium">Temp Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packageDetails.map((pkg, index) => {
                        const tempRange =
                          pkg.requiredStartTemp && pkg.requiredEndTemp
                            ? `${pkg.requiredStartTemp} - ${pkg.requiredEndTemp}`
                            : pkg.requiredStartTemp ?? pkg.requiredEndTemp ?? "—";
                        return (
                          <tr key={index} className="border-t">
                            <td className="px-3 py-2">{pkg.productCategory ?? "—"}</td>
                            <td className="px-3 py-2 break-all">
                              {pkg.productName ?? "Unnamed product"}
                            </td>
                            <td className="px-3 py-2">{pkg.quantity ?? "—"}</td>
                            <td className="px-3 py-2">{tempRange}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">No package details available.</p>
              )}
            </section>

            {Array.isArray(data.checkpoints) && data.checkpoints.length > 0 ? (
              <section>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Planned Legs
                </p>
                <div className="divide-y rounded-md border">
                  {data.checkpoints.map((checkpoint, index) => (
                    <div key={index} className="space-y-1 p-3">
                      <p className="text-xs font-medium">Leg {index + 1}</p>
                      <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
                        <div>
                          <span className="text-muted-foreground">Start</span>:{" "}
                          {checkpoint.start_checkpoint_id ?? "—"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">End</span>:{" "}
                          {checkpoint.end_checkpoint_id ?? "—"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Exp Ship</span>:{" "}
                          {formatDateTime(checkpoint.expected_ship_date)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">ETA</span>:{" "}
                          {formatDateTime(checkpoint.estimated_arrival_date)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tolerance</span>:{" "}
                          {checkpoint.time_tolerance ?? "—"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Action</span>:{" "}
                          {checkpoint.required_action ?? "—"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Shipment details unavailable.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
