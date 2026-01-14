import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { shipmentService, type CreateShipmentRequest } from "@/services/shipmentService";
import type { ManufacturerShipmentRecord, ShipmentLegInput } from "../types";

type EditShipmentButtonProps = {
  shipment: ManufacturerShipmentRecord;
  onUpdated: () => void;
};

const DEFAULT_LEG: ShipmentLegInput = {
  startId: "",
  endId: "",
  estArrival: "",
  expectedShip: "",
  timeTolerance: "",
  requiredAction: "",
};

export function EditShipmentButton({ shipment, onUpdated }: EditShipmentButtonProps) {
  const [open, setOpen] = useState(false);
  const [dest, setDest] = useState<string>(
    shipment.destinationPartyUUID ?? shipment.toUUID ?? "",
  );
  const [legs, setLegs] = useState<ShipmentLegInput[]>(
    (shipment.checkpoints ?? []).map((checkpoint) => ({
      startId: String(checkpoint.start_checkpoint_id ?? ""),
      endId: String(checkpoint.end_checkpoint_id ?? ""),
      estArrival: checkpoint.estimated_arrival_date ?? "",
      expectedShip: checkpoint.expected_ship_date ?? "",
      timeTolerance: checkpoint.time_tolerance ?? "",
      requiredAction: checkpoint.required_action ?? "",
    })),
  );

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<CreateShipmentRequest>) =>
      shipmentService.update(String(shipment.id), payload),
    onSuccess: () => {
      onUpdated();
      setOpen(false);
    },
  });

  const toISO = (value: string) => {
    if (!value) return "";
    try {
      return new Date(value).toISOString();
    } catch {
      return value;
    }
  };

  const handleSave = () => {
    const checkpointsPayload = legs
      .filter((leg) => leg.startId && leg.endId)
      .map((leg, index) => ({
        start_checkpoint_id: Number.isFinite(Number(leg.startId))
          ? Number(leg.startId)
          : leg.startId,
        end_checkpoint_id: Number.isFinite(Number(leg.endId)) ? Number(leg.endId) : leg.endId,
        estimated_arrival_date: toISO(leg.estArrival),
        time_tolerance: leg.timeTolerance || undefined,
        expected_ship_date: toISO(leg.expectedShip),
        segment_order: index + 1,
        ...(leg.requiredAction ? { required_action: leg.requiredAction } : {}),
      }));

    updateMutation.mutate({
      destinationPartyUUID: dest,
      checkpoints: checkpointsPayload,
    });
  };

  const updateLeg = (index: number, patch: Partial<ShipmentLegInput>) => {
    setLegs((prev) =>
      prev.map((leg, idx) => (idx === index ? { ...leg, ...patch } : leg)),
    );
  };

  const addLeg = () => setLegs((prev) => [...prev, { ...DEFAULT_LEG }]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="mx-2 w-[calc(100%-1rem)] sm:w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Edit Shipment</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="text-xs sm:text-sm font-medium">Destination Party UUID</label>
            <Input value={dest} onChange={(event) => setDest(event.target.value)} className="h-9 sm:h-10 text-sm" />
          </div>

          <div className="space-y-2 sm:space-y-3">
            <p className="text-xs sm:text-sm font-medium">Route Legs</p>
            {legs.map((leg, index) => (
              <div
                key={`edit-leg-${index}`}
                className="grid grid-cols-1 gap-2 sm:gap-3 rounded-md border p-2 sm:p-3 md:grid-cols-2"
              >
                <div>
                  <label className="text-[10px] sm:text-xs text-muted-foreground">Start Checkpoint</label>
                  <Input
                    placeholder="Start checkpoint ID"
                    value={leg.startId}
                    onChange={(event) => updateLeg(index, { startId: event.target.value })}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs text-muted-foreground">End Checkpoint</label>
                  <Input
                    placeholder="End checkpoint ID"
                    value={leg.endId}
                    onChange={(event) => updateLeg(index, { endId: event.target.value })}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs text-muted-foreground">Expected Ship Date</label>
                  <Input
                    type="datetime-local"
                    value={leg.expectedShip}
                    onChange={(event) => updateLeg(index, { expectedShip: event.target.value })}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs text-muted-foreground">Estimated Arrival</label>
                  <Input
                    type="datetime-local"
                    value={leg.estArrival}
                    onChange={(event) => updateLeg(index, { estArrival: event.target.value })}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs text-muted-foreground">Time Tolerance</label>
                  <Input
                    placeholder="2h"
                    value={leg.timeTolerance}
                    onChange={(event) => updateLeg(index, { timeTolerance: event.target.value })}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
                {/* <div>
                  <label className="text-xs text-muted-foreground">Required Action</label>
                  <Textarea
                    rows={2}
                    placeholder="Temperature check"
                    value={leg.requiredAction ?? ""}
                    onChange={(event) => updateLeg(index, { requiredAction: event.target.value })}
                  />
                </div> */}
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addLeg} className="h-8 sm:h-9 text-xs sm:text-sm">
              Add leg
            </Button>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)} className="h-9 sm:h-10 text-sm w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending} className="h-9 sm:h-10 text-sm w-full sm:w-auto">
              {updateMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
