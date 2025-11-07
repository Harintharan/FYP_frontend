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
    estimatedArrivalDate?: string;
    estimated_arrival_date?: string;
    temperatureCheck?: string;
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
  const destinationLabel =
    data?.consumerName ??
    data?.destinationPartyName ??
    data?.destinationPartyUUID ??
    data?.shipment?.consumer?.legalName ??
    data?.shipment?.destinationPartyUUID ??
    data?.toUUID ??
    "Unknown";
  const expectedShip = data?.expectedShipDate ?? undefined;
  const expectedArrival =
    data?.expectedArrival ?? data?.estimatedArrivalDate ?? data?.estimated_arrival_date ?? undefined;
  const startCheckpointLabel =
    data?.startCheckpoint?.state ??
    data?.startCheckpoint?.country ??
    data?.pickupArea ??
    data?.originArea;
  const endCheckpointLabel =
    data?.endCheckpoint?.state ?? data?.endCheckpoint?.country ?? data?.dropoffArea ?? data?.destinationArea;

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
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
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
                <p className="font-medium">{data.status ?? "UNKNOWN"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Manufacturer</p>
                <p className="font-medium break-all">{manufacturerLabel}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Destination</p>
                <p className="font-medium break-all">{destinationLabel}</p>
              </div>
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
              {data.timeTolerance ? (
                <div>
                  <p className="text-muted-foreground">Time Tolerance</p>
                  <p className="font-medium break-all">{data.timeTolerance}</p>
                </div>
              ) : null}
              {startCheckpointLabel ? (
                <div>
                  <p className="text-muted-foreground">Start Checkpoint</p>
                  <p className="font-medium break-all">{startCheckpointLabel}</p>
                </div>
              ) : null}
              {endCheckpointLabel ? (
                <div>
                  <p className="text-muted-foreground">End Checkpoint</p>
                  <p className="font-medium break-all">{endCheckpointLabel}</p>
                </div>
              ) : null}
              {data.segmentOrder !== undefined ? (
                <div>
                  <p className="text-muted-foreground">Segment Order</p>
                  <p className="font-medium break-all">{data.segmentOrder}</p>
                </div>
              ) : null}
              {data.acceptedAt ? (
                <div>
                  <p className="text-muted-foreground">Accepted At</p>
                  <p className="font-medium break-all">{data.acceptedAt}</p>
                </div>
              ) : null}
              {data.handedOverAt ? (
                <div>
                  <p className="text-muted-foreground">Handed Over At</p>
                  <p className="font-medium break-all">{data.handedOverAt}</p>
                </div>
              ) : null}
              {data.destinationCheckpoint ? (
                <div>
                  <p className="text-muted-foreground">Next Checkpoint</p>
                  <p className="font-medium break-all">{data.destinationCheckpoint}</p>
                </div>
              ) : null}
            </div>

            <div>
              <p className="mb-1 text-muted-foreground">Items</p>
              {normalizedItems.length > 0 ? (
                <div className="divide-y rounded-md border">
                  {normalizedItems.map((item, index) => {
                    const label = item.productName ?? item.product_uuid ?? "Product";
                    const qty =
                      "quantity" in item && item.quantity !== undefined
                        ? item.quantity
                        : (item as { qty?: number }).qty;
                    return (
                      <div key={index} className="flex justify-between p-2">
                        <span className="truncate">{label}</span>
                        <span className="text-muted-foreground">
                          {qty !== undefined ? `x${qty}` : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No items listed</p>
              )}
            </div>

            <div>
              <p className="mb-1 text-muted-foreground">Route Checkpoints</p>
              {Array.isArray(data.checkpoints) && data.checkpoints.length > 0 ? (
                <div className="divide-y rounded-md border">
                  {data.checkpoints.map((checkpoint, index) => (
                    <div key={index} className="space-y-1 p-2">
                      <p className="text-xs font-medium">Leg {index + 1}</p>
                      <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
                        <div>
                          <span className="text-muted-foreground">Start</span>:{" "}
                          {checkpoint.start_checkpoint_id}
                        </div>
                        <div>
                          <span className="text-muted-foreground">End</span>:{" "}
                          {checkpoint.end_checkpoint_id}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Exp Ship</span>:{" "}
                          {checkpoint.expected_ship_date}
                        </div>
                        <div>
                          <span className="text-muted-foreground">ETA</span>:{" "}
                          {checkpoint.estimated_arrival_date}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tolerance</span>:{" "}
                          {checkpoint.time_tolerance}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Action</span>:{" "}
                          {checkpoint.required_action}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No checkpoints listed</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Shipment details unavailable.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
