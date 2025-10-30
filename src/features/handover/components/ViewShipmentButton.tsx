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
  shipmentId: string;
};

type ShipmentDetail = ManufacturerShipmentRecord &
  SupplierShipmentRecord & {
    checkpoints?: Array<{
      start_checkpoint_id?: number | string;
      end_checkpoint_id?: number | string;
      estimated_arrival_date?: string;
      expected_ship_date?: string;
      time_tolerance?: string;
      required_action?: string;
    }>;
    shipmentItems?: Array<{ product_uuid?: string; quantity?: number }>;
  };

export function ViewShipmentButton({ shipmentId }: ViewShipmentButtonProps) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery<ShipmentDetail>({
    queryKey: ["shipment", shipmentId],
    queryFn: () => shipmentService.getById(shipmentId),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Shipment Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : data ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Shipment ID</p>
                <p className="font-medium break-all">{data.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">{data.status ?? "PREPARING"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Manufacturer</p>
                <p className="font-medium break-all">
                  {data.manufacturerUUID ?? data.fromUUID ?? "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Destination</p>
                <p className="font-medium break-all">
                  {data.destinationPartyUUID ?? data.toUUID ?? "Unknown"}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-1 text-muted-foreground">Items</p>
              {Array.isArray(data.shipmentItems) && data.shipmentItems.length > 0 ? (
                <div className="divide-y rounded-md border">
                  {data.shipmentItems.map((item, index) => (
                    <div key={index} className="flex justify-between p-2">
                      <span className="truncate">{item.product_uuid}</span>
                      <span className="text-muted-foreground">x{item.quantity}</span>
                    </div>
                  ))}
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
                          <span className="text-muted-foreground">Start</span>: {checkpoint.start_checkpoint_id}
                        </div>
                        <div>
                          <span className="text-muted-foreground">End</span>: {checkpoint.end_checkpoint_id}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Exp Ship</span>: {checkpoint.expected_ship_date}
                        </div>
                        <div>
                          <span className="text-muted-foreground">ETA</span>: {checkpoint.estimated_arrival_date}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tolerance</span>: {checkpoint.time_tolerance}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Action</span>: {checkpoint.required_action}
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
