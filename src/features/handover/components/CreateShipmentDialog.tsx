import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useHandoverSharedContext, useManufacturerContext } from "../context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useMemo } from "react";

export function CreateShipmentDialog() {
  const shared = useHandoverSharedContext();
  const manufacturer = useManufacturerContext();

  if (!manufacturer.enabled || shared.role !== "MANUFACTURER") {
    return null;
  }

  const {
    createOpen,
    setCreateOpen,
    handleCreateShipment,
    creatingShipment,
    destUUID,
    setDestUUID,
    loadingManufacturerPackages,
    availablePackages,
    selectedPackageIds,
    togglePackageSelection,
    checkpoints,
    loadingCheckpoints,
    legs,
    setLegs,
    addLeg,
  } = manufacturer;

  const {
    data: destinationResults = [],
    isFetching: loadingDestinations,
  } = useQuery({
    queryKey: ["consumer-destinations"],
    queryFn: async () => {
      const res = await api.get("/api/checkpoints", {
        params: { ownerType: "CONSUMER" },
      });
      const payload = res.data;
      if (Array.isArray(payload)) return payload;
      if (payload && Array.isArray(payload.data)) return payload.data;
      return [];
    },
    staleTime: 30_000,
  });

  const destinationOptions = useMemo(() => {
    return destinationResults.map((item: any) => {
      const labelLeft = item?.name || "Checkpoint";
      const labelRight = item?.state || item?.country || item?.checkpointType || item?.id || "";
      const value = item?.ownerUUID || item?.owner_uuid || item?.id || "";
      return {
        value: String(value),
        label: `${labelLeft} - ${labelRight}`,
      };
    });
  }, [destinationResults]);

  const selectedDestination = useMemo(
    () => destinationOptions.find((option) => option.value === destUUID) ?? null,
    [destinationOptions, destUUID],
  );

  const handleSelectDestination = (value: string) => {
    setDestUUID(value);
  };

  return (
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Shipment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Shipment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreateShipment} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Destination Party</label>
            <Select
              value={destUUID || undefined}
              onValueChange={handleSelectDestination}
              disabled={loadingDestinations || destinationOptions.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingDestinations
                      ? "Loading destinations..."
                      : "Choose destination party"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {destinationOptions.length > 0 ? (
                  destinationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__no_results" disabled>
                    No destinations found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <div className="rounded-md border border-border/60 bg-muted/20 p-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Selected UUID</span>
                <span className="font-semibold text-foreground">{destUUID || "None"}</span>
              </div>
              {selectedDestination ? (
                <p className="mt-1 text-foreground text-sm">Destination: {selectedDestination.label}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Select Packages</p>
            <p className="text-xs text-muted-foreground">
              Choose the package UUIDs that should be included in this shipment.
            </p>

            {loadingManufacturerPackages ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading packages...
              </div>
            ) : availablePackages.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No registered packages found for this manufacturer. Register packages before creating a shipment.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-2">
                {availablePackages.map((pkg) => {
                  const rawId = pkg.package_uuid ?? pkg.id;
                  if (!rawId) return null;
                  const packageId = String(rawId);
                  const availableQuantity = pkg.quantityAvailable ?? pkg.quantity ?? "N/A";
                  const productName =
                    pkg.batch?.product?.productName ?? pkg.batch?.product?.name ?? undefined;
                  const label = pkg.packageCode || `Package ${packageId}`;
                  const isSelected = selectedPackageIds.includes(packageId);
                  return (
                    <div
                      key={packageId}
                      className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-foreground">{label}</span>
                        <span className="text-xs text-muted-foreground break-all">
                          UUID: {packageId}
                        </span>
                        {productName ? (
                          <span className="text-xs text-muted-foreground">{productName}</span>
                        ) : null}
                        <span className="text-xs text-muted-foreground">Available: {availableQuantity}</span>
                      </div>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => togglePackageSelection(packageId, checked === true)}
                        aria-label={`Select package ${label}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-muted-foreground text-right">
              Selected packages: {selectedPackageIds.length}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Route Checkpoint Legs</p>
            <p className="text-xs text-muted-foreground">
              {loadingCheckpoints
                ? "Loading checkpoint options..."
                : checkpoints.length > 0
                  ? "Choose the start and end checkpoints for each route segment."
                  : "No checkpoints available. Register checkpoints before creating a shipment."}
            </p>
            {legs.map((leg, index) => {
              return (
                <div
                  key={`leg-${index}`}
                  className="grid grid-cols-1 gap-2 rounded-md border border-border/60 p-3 md:grid-cols-2"
                >
                  <div>
                    <label className="text-xs text-muted-foreground">Start Checkpoint</label>
                    <Select
                      value={leg.startId}
                      onValueChange={(value) =>
                        setLegs((arr) =>
                          arr.map((item, idx) =>
                            idx === index ? { ...item, startId: value } : item,
                          ),
                        )
                      }
                      disabled={loadingCheckpoints || checkpoints.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select start checkpoint" />
                      </SelectTrigger>
                      <SelectContent>
                        {checkpoints.map((checkpoint) => {
                          const id = String(checkpoint.id);
                          return (
                            <SelectItem key={`${id}-start`} value={id}>
                              {checkpoint.name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">End Checkpoint</label>
                    <Select
                      value={leg.endId}
                      onValueChange={(value) =>
                        setLegs((arr) =>
                          arr.map((item, idx) =>
                            idx === index ? { ...item, endId: value } : item,
                          ),
                        )
                      }
                      disabled={loadingCheckpoints || checkpoints.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select end checkpoint" />
                      </SelectTrigger>
                      <SelectContent>
                        {checkpoints.map((checkpoint) => {
                          const id = String(checkpoint.id);
                          return (
                            <SelectItem key={`${id}-end`} value={id}>
                              {checkpoint.name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Expected Ship Date</label>
                    <Input
                      type="datetime-local"
                      value={leg.expectedShip}
                      onChange={(event) =>
                        setLegs((arr) =>
                          arr.map((item, idx) =>
                            idx === index ? { ...item, expectedShip: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Estimated Arrival</label>
                    <Input
                      type="datetime-local"
                      value={leg.estArrival}
                      onChange={(event) =>
                        setLegs((arr) =>
                          arr.map((item, idx) =>
                            idx === index ? { ...item, estArrival: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Time Tolerance</label>
                    <Input
                      placeholder="2h"
                      value={leg.timeTolerance}
                      onChange={(event) =>
                        setLegs((arr) =>
                          arr.map((item, idx) =>
                            idx === index ? { ...item, timeTolerance: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Required Action</label>
                    <Textarea
                      rows={2}
                      placeholder="Temperature check"
                      value={leg.requiredAction ?? ""}
                      onChange={(event) =>
                        setLegs((arr) =>
                          arr.map((item, idx) =>
                            idx === index ? { ...item, requiredAction: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  </div>
                </div>
              );
            })}
            <Button type="button" variant="secondary" size="sm" onClick={addLeg}>
              <Plus className="w-4 h-4 mr-1" />
              Add Leg
            </Button>
          </div>

          <Button type="submit" disabled={creatingShipment} className="w-full">
            {creatingShipment ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </span>
            ) : (
              "Create Shipment"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

