import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Lock,
  Trash2,
  ChevronDown,
  X,
  Check,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useHandoverSharedContext, useManufacturerContext } from "../context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useMemo, useState, useEffect, useCallback } from "react";

type CheckpointOption = {
  id: string;
  name: string;
  state?: string;
  country?: string;
  owner_uuid?: string;
  ownerUUID?: string;
};

export function CreateShipmentDialog() {
  const shared = useHandoverSharedContext();
  const manufacturer = useManufacturerContext();
  const [destSearch, setDestSearch] = useState("");

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
    legs,
    setLegs,
  } = manufacturer;

  const { uuid, role } = shared;

  // Fetch Manufacturer's checkpoints (for first leg start)
  const {
    data: manufacturerCheckpoints = [],
    isLoading: loadingManufacturerCheckpoints,
  } = useQuery<CheckpointOption[]>({
    queryKey: ["manufacturer-checkpoints", uuid],
    queryFn: async () => {
      const res = await api.get("/api/checkpoints", {
        params: { ownerType: "MANUFACTURER", userId: uuid },
      });
      const payload = res.data;
      if (Array.isArray(payload)) return payload;
      if (payload && Array.isArray(payload.data)) return payload.data;
      return [];
    },
    enabled: Boolean(uuid) && manufacturer.enabled && role === "MANUFACTURER",
    staleTime: 60_000,
  });

  // Fetch all Consumer checkpoints initially (for dropdown)
  const { data: allConsumerCheckpoints = [], isLoading: loadingAllConsumers } =
    useQuery<CheckpointOption[]>({
      queryKey: ["all-consumer-checkpoints"],
      queryFn: async () => {
        const res = await api.get("/api/checkpoints", {
          params: { ownerType: "CONSUMER" },
        });
        const payload = res.data;
        if (Array.isArray(payload)) return payload;
        if (payload && Array.isArray(payload.data)) return payload.data;
        return [];
      },
      enabled: manufacturer.enabled,
      staleTime: 60_000,
    });

  // Use all consumers (no search mode)
  const destinationResults = allConsumerCheckpoints;
  const loadingDestinations = loadingAllConsumers;

  // Fetch Consumer's checkpoints (for last leg end) based on selected destination
  const {
    data: consumerCheckpoints = [],
    isLoading: loadingConsumerCheckpoints,
  } = useQuery<CheckpointOption[]>({
    queryKey: ["consumer-checkpoints", destUUID],
    queryFn: async () => {
      const res = await api.get("/api/checkpoints", {
        params: { userId: destUUID },
      });
      const payload = res.data;
      if (Array.isArray(payload)) return payload;
      if (payload && Array.isArray(payload.data)) return payload.data;
      return [];
    },
    enabled: Boolean(destUUID) && manufacturer.enabled,
    staleTime: 30_000,
  });

  // Fetch Warehouse checkpoints (for middle legs)
  const {
    data: warehouseCheckpoints = [],
    isLoading: loadingWarehouseCheckpoints,
  } = useQuery<CheckpointOption[]>({
    queryKey: ["warehouse-checkpoints"],
    queryFn: async () => {
      const res = await api.get("/api/checkpoints", {
        params: { ownerType: "WAREHOUSE" },
      });
      const payload = res.data;
      if (Array.isArray(payload)) return payload;
      if (payload && Array.isArray(payload.data)) return payload.data;
      return [];
    },
    enabled: manufacturer.enabled,
    staleTime: 60_000,
  });

  // Determine if manufacturer checkpoint is locked (only 1 available)
  const isManufacturerLocked = manufacturerCheckpoints.length === 1;
  const isConsumerLocked = consumerCheckpoints.length === 1;

  // Auto-set first leg's startId when manufacturer checkpoints load
  useEffect(() => {
    if (manufacturerCheckpoints.length > 0 && legs.length > 0) {
      const firstCheckpointId = String(manufacturerCheckpoints[0].id);
      if (legs[0].startId !== firstCheckpointId) {
        setLegs((arr) =>
          arr.map((item, idx) =>
            idx === 0 ? { ...item, startId: firstCheckpointId } : item
          )
        );
      }
    }
  }, [manufacturerCheckpoints, setLegs, legs]);

  // Auto-set last leg's endId when consumer checkpoints load
  useEffect(() => {
    if (consumerCheckpoints.length > 0 && legs.length > 0) {
      const lastIndex = legs.length - 1;
      const firstConsumerCheckpointId = String(consumerCheckpoints[0].id);
      if (legs[lastIndex].endId !== firstConsumerCheckpointId) {
        setLegs((arr) =>
          arr.map((item, idx) =>
            idx === lastIndex
              ? { ...item, endId: firstConsumerCheckpointId }
              : item
          )
        );
      }
    }
  }, [consumerCheckpoints, setLegs, legs]);

  const destinationOptions = useMemo(() => {
    return destinationResults.map((item: CheckpointOption) => {
      const labelLeft = item?.name || "Checkpoint";
      const labelRight = item?.state || item?.country || item?.id || "";
      const value = item?.owner_uuid || item?.ownerUUID || item?.id || "";
      return {
        value: String(value),
        label: `${labelLeft} - ${labelRight}`,
      };
    });
  }, [destinationResults]);

  const [destPopoverOpen, setDestPopoverOpen] = useState(false);

  const handleSelectDestination = useCallback(
    (option: { value: string; label: string }) => {
      setDestUUID(option.value);
      setDestSearch(option.label);
      // Close popover after selecting
      setDestPopoverOpen(false);
    },
    [setDestUUID]
  );

  const selectedDestinationLabel = useMemo(() => {
    if (!destUUID && destSearch) return destSearch;
    const found = destinationOptions.find((o) => o.value === destUUID);
    return found ? found.label : destSearch || "";
  }, [destUUID, destinationOptions, destSearch]);

  // Add a middle leg (inserted before the last leg)
  const addMiddleLeg = useCallback(() => {
    if (legs.length === 0) return;

    setLegs((arr) => {
      const insertIndex = arr.length - 1; // Insert before the last leg
      const previousLeg = arr[insertIndex - 1]; // The leg before where we're inserting
      const lastLeg = arr[insertIndex]; // The current last leg

      const newLeg = {
        startId: previousLeg?.endId || "", // Start where previous leg ended
        endId: "", // User will select warehouse checkpoint
        estArrival: "",
        expectedShip: "",
        timeTolerance: "",
        requiredAction: "",
      };

      // Also clear the last leg's startId so user can select it
      const updatedLastLeg = { ...lastLeg, startId: "" };

      const newArr = [...arr.slice(0, insertIndex), newLeg, updatedLastLeg];
      return newArr;
    });
  }, [legs.length, setLegs]);

  // Remove a middle leg (only middle legs can be removed)
  const removeMiddleLeg = useCallback(
    (index: number) => {
      if (legs.length <= 1) return; // Can't remove if only 1 leg
      if (index === 0 || index === legs.length - 1) return; // Can't remove first or last

      setLegs((arr) => {
        const newArr = arr.filter((_, idx) => idx !== index);
        // After removal, sync: previous leg's endId should connect to next leg's startId
        // The leg that was after the removed one now needs to sync with the leg before
        if (index > 0 && index < newArr.length) {
          const prevLegEndId = newArr[index - 1].endId;
          newArr[index] = { ...newArr[index], startId: prevLegEndId };
        }
        return newArr;
      });
    },
    [legs.length, setLegs]
  );

  // Helper to format checkpoint label
  const formatCheckpointLabel = useCallback((cp: CheckpointOption) => {
    const location = [cp.state, cp.country].filter(Boolean).join(", ");
    return location ? `${cp.name} - ${location}` : cp.name;
  }, []);

  // Determine checkpoint options based on leg position
  const getStartCheckpointOptions = useCallback(
    (legIndex: number): CheckpointOption[] => {
      if (legIndex === 0) {
        // First leg: manufacturer checkpoints only
        return manufacturerCheckpoints;
      }
      // Middle legs: warehouse checkpoints
      return warehouseCheckpoints;
    },
    [manufacturerCheckpoints, warehouseCheckpoints]
  );

  const getEndCheckpointOptions = useCallback(
    (legIndex: number): CheckpointOption[] => {
      const isLastLeg = legIndex === legs.length - 1;
      if (isLastLeg) {
        // Last leg: consumer checkpoints only
        return consumerCheckpoints;
      }
      // First or middle legs: warehouse checkpoints
      return warehouseCheckpoints;
    },
    [consumerCheckpoints, warehouseCheckpoints, legs.length]
  );

  const isStartLocked = useCallback(
    (legIndex: number): boolean => {
      // First leg: locked if only one manufacturer checkpoint
      if (legIndex === 0) return isManufacturerLocked;
      // All other legs: start is synced from previous leg's end, so always locked
      return true;
    },
    [isManufacturerLocked]
  );

  const isEndLocked = useCallback(
    (legIndex: number): boolean => {
      const isLastLeg = legIndex === legs.length - 1;
      if (isLastLeg) return isConsumerLocked;
      return false;
    },
    [isConsumerLocked, legs.length]
  );

  const isLoadingStart = useCallback(
    (legIndex: number): boolean => {
      if (legIndex === 0) return loadingManufacturerCheckpoints;
      return loadingWarehouseCheckpoints;
    },
    [loadingManufacturerCheckpoints, loadingWarehouseCheckpoints]
  );

  const isLoadingEnd = useCallback(
    (legIndex: number): boolean => {
      const isLastLeg = legIndex === legs.length - 1;
      if (isLastLeg) return loadingConsumerCheckpoints;
      return loadingWarehouseCheckpoints;
    },
    [loadingConsumerCheckpoints, loadingWarehouseCheckpoints, legs.length]
  );

  const getLegTypeLabel = useCallback(
    (index: number): string => {
      if (index === 0) return "Origin (Manufacturer)";
      if (index === legs.length - 1) return "Destination (Consumer)";
      return `Warehouse Stop ${index}`;
    },
    [legs.length]
  );

  const canRemoveLeg = useCallback(
    (index: number): boolean => {
      // Can only remove middle legs (not first or last), and must have more than 1 leg
      return legs.length > 1 && index > 0 && index < legs.length - 1;
    },
    [legs.length]
  );

  // Early return after all hooks
  if (!manufacturer.enabled || role !== "MANUFACTURER") {
    return null;
  }

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
          {/* Destination Party Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Destination Party (Consumer)
            </label>
            <Popover open={destPopoverOpen} onOpenChange={setDestPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full flex items-center justify-between border rounded-lg px-4 py-3 bg-background text-left text-sm hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring transition-colors min-h-[44px]"
                  onClick={() => setDestPopoverOpen((v) => !v)}
                >
                  <span
                    className={
                      selectedDestinationLabel
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {selectedDestinationLabel ||
                      "Select consumer checkpoint..."}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 ml-2 text-muted-foreground transition-transform ${
                      destPopoverOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
                sideOffset={4}
              >
                <div className="max-h-64 overflow-y-auto">
                  {loadingDestinations ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading consumers...
                    </div>
                  ) : destinationOptions.length === 0 ? (
                    <div className="px-3 py-2.5 text-sm text-muted-foreground">
                      No consumer checkpoints available.
                    </div>
                  ) : (
                    destinationOptions.map((option) => {
                      const isSelected = option.value === String(destUUID);
                      return (
                        <button
                          key={option.value + option.label}
                          type="button"
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors min-h-[44px] ${
                            isSelected
                              ? "bg-accent text-accent-foreground font-medium"
                              : "hover:bg-accent/50"
                          }`}
                          onClick={() => handleSelectDestination(option)}
                        >
                          <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                            {isSelected && (
                              <Check className="w-4 h-4 text-primary" />
                            )}
                          </span>
                          <span className="flex-1 truncate">
                            {option.label}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {destUUID && selectedDestinationLabel && (
              <div className="mt-3 p-3 rounded-lg border bg-muted/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground mb-1">
                      {selectedDestinationLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      UUID: {destUUID}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDestUUID("");
                      setDestSearch("");
                    }}
                    className="flex-shrink-0 p-1 hover:bg-background rounded transition-colors"
                    aria-label="Clear selection"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Packages Section */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">Select Packages</p>
              <p className="text-xs text-muted-foreground">
                Choose the package UUIDs that should be included in this
                shipment.
              </p>
            </div>

            {loadingManufacturerPackages ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading packages...
              </div>
            ) : availablePackages.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No registered packages found for this manufacturer. Register
                packages before creating a shipment.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-2">
                {availablePackages.map((pkg) => {
                  const rawId = pkg.package_uuid ?? pkg.id;
                  if (!rawId) return null;
                  const packageId = String(rawId);
                  const availableQuantity =
                    pkg.quantityAvailable ?? pkg.quantity ?? "N/A";
                  const productName =
                    pkg.batch?.product?.productName ??
                    pkg.batch?.product?.name ??
                    undefined;
                  const label = pkg.packageCode || `Package ${packageId}`;
                  const isSelected = selectedPackageIds.includes(packageId);
                  return (
                    <div
                      key={packageId}
                      className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-3 text-sm transition-all cursor-pointer ${
                        isSelected
                          ? "bg-accent/50 border-primary shadow-sm"
                          : "bg-muted/20 border-border/60 hover:bg-muted/40 hover:border-border"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        togglePackageSelection(packageId, !isSelected);
                      }}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-foreground leading-tight">
                          {label}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {packageId.slice(0, 8)}...{packageId.slice(-4)}
                        </span>
                        {productName && (
                          <span className="text-xs text-muted-foreground">
                            {productName}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          <span className="font-medium">Available:</span>{" "}
                          {availableQuantity}
                        </span>
                      </div>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          togglePackageSelection(packageId, checked === true)
                        }
                        aria-label={`Select package ${label}`}
                        className="flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
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

          {/* Route Checkpoint Legs Section */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Route Checkpoint Legs</p>
            <p className="text-xs text-muted-foreground">
              Define the shipment route from your checkpoint to the consumer.
              Add warehouse stops if needed.
            </p>

            {/* Manufacturer checkpoint status */}
            {loadingManufacturerCheckpoints ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading your checkpoints...
              </div>
            ) : manufacturerCheckpoints.length === 0 ? (
              <p className="text-xs text-destructive">
                No checkpoints found for your account. Please register a
                checkpoint first.
              </p>
            ) : null}

            {legs.map((leg, index) => {
              const startOptions = getStartCheckpointOptions(index);
              const endOptions = getEndCheckpointOptions(index);
              const startLocked = isStartLocked(index);
              const endLocked = isEndLocked(index);
              const loadingStart = isLoadingStart(index);
              const loadingEnd = isLoadingEnd(index);
              const isFirstLeg = index === 0;
              const isLastLeg = index === legs.length - 1;
              const isMiddleLeg = !isFirstLeg && !isLastLeg;

              return (
                <div
                  key={`leg-${index}`}
                  className="rounded-md border border-border/60 p-3 space-y-3"
                >
                  {/* Leg Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Leg {index + 1}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({getLegTypeLabel(index)})
                      </span>
                    </div>
                    {canRemoveLeg(index) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMiddleLeg(index)}
                        className="h-7 px-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {/* Start Checkpoint */}
                    <div>
                      <label className="text-xs text-muted-foreground flex items-center gap-1">
                        Start Checkpoint
                        {startLocked && <Lock className="w-3 h-3" />}
                        {isFirstLeg && (
                          <span className="text-xs">(Manufacturer)</span>
                        )}
                        {isMiddleLeg && (
                          <span className="text-xs">(Warehouse)</span>
                        )}
                      </label>
                      {loadingStart ? (
                        <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/20">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">
                            Loading...
                          </span>
                        </div>
                      ) : startOptions.length === 0 ? (
                        <div className="flex items-center h-10 px-3 border rounded-md bg-muted/20">
                          <span className="text-sm text-muted-foreground">
                            No checkpoints available
                          </span>
                        </div>
                      ) : (
                        <Select
                          value={leg.startId}
                          onValueChange={(value) =>
                            setLegs((arr) =>
                              arr.map((item, idx) => {
                                // Update this leg's startId
                                if (idx === index) {
                                  return { ...item, startId: value };
                                }
                                // Sync: also update previous leg's endId to match
                                if (idx === index - 1) {
                                  return { ...item, endId: value };
                                }
                                return item;
                              })
                            )
                          }
                          disabled={startLocked}
                        >
                          <SelectTrigger
                            className={startLocked ? "bg-muted/50" : ""}
                          >
                            <SelectValue placeholder="Select start checkpoint" />
                          </SelectTrigger>
                          <SelectContent>
                            {startOptions.map((checkpoint) => {
                              const id = String(checkpoint.id);
                              return (
                                <SelectItem
                                  key={`${id}-start-${index}`}
                                  value={id}
                                >
                                  {formatCheckpointLabel(checkpoint)}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* End Checkpoint */}
                    <div>
                      <label className="text-xs text-muted-foreground flex items-center gap-1">
                        End Checkpoint
                        {endLocked && <Lock className="w-3 h-3" />}
                        {isLastLeg && (
                          <span className="text-xs">(Consumer)</span>
                        )}
                        {!isLastLeg && (
                          <span className="text-xs">(Warehouse)</span>
                        )}
                      </label>
                      {loadingEnd ? (
                        <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/20">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">
                            Loading...
                          </span>
                        </div>
                      ) : isLastLeg && !destUUID ? (
                        <div className="flex items-center h-10 px-3 border rounded-md bg-muted/20">
                          <span className="text-sm text-muted-foreground">
                            Select destination party first
                          </span>
                        </div>
                      ) : endOptions.length === 0 ? (
                        <div className="flex items-center h-10 px-3 border rounded-md bg-muted/20">
                          <span className="text-sm text-muted-foreground">
                            No checkpoints available
                          </span>
                        </div>
                      ) : (
                        <Select
                          value={leg.endId}
                          onValueChange={(value) =>
                            setLegs((arr) =>
                              arr.map((item, idx) => {
                                // Update this leg's endId
                                if (idx === index) {
                                  return { ...item, endId: value };
                                }
                                // Sync: also update next leg's startId to match
                                if (idx === index + 1) {
                                  return { ...item, startId: value };
                                }
                                return item;
                              })
                            )
                          }
                          disabled={endLocked}
                        >
                          <SelectTrigger
                            className={endLocked ? "bg-muted/50" : ""}
                          >
                            <SelectValue placeholder="Select end checkpoint" />
                          </SelectTrigger>
                          <SelectContent>
                            {endOptions.map((checkpoint) => {
                              const id = String(checkpoint.id);
                              return (
                                <SelectItem
                                  key={`${id}-end-${index}`}
                                  value={id}
                                >
                                  {formatCheckpointLabel(checkpoint)}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Expected Ship Date */}
                    <div>
                      <label className="text-xs text-muted-foreground">
                        Expected Ship Date
                      </label>
                      <Input
                        type="datetime-local"
                        value={leg.expectedShip}
                        onChange={(event) =>
                          setLegs((arr) =>
                            arr.map((item, idx) =>
                              idx === index
                                ? { ...item, expectedShip: event.target.value }
                                : item
                            )
                          )
                        }
                      />
                    </div>

                    {/* Estimated Arrival */}
                    <div>
                      <label className="text-xs text-muted-foreground">
                        Estimated Arrival
                      </label>
                      <Input
                        type="datetime-local"
                        value={leg.estArrival}
                        onChange={(event) =>
                          setLegs((arr) =>
                            arr.map((item, idx) =>
                              idx === index
                                ? { ...item, estArrival: event.target.value }
                                : item
                            )
                          )
                        }
                      />
                    </div>

                    {/* Time Tolerance */}
                    <div className="md:col-span-2">
                      <label className="text-xs text-muted-foreground">
                        Time Tolerance
                      </label>
                      <Input
                        placeholder="e.g., 2h, 30m, 1d"
                        value={leg.timeTolerance}
                        onChange={(event) =>
                          setLegs((arr) =>
                            arr.map((item, idx) =>
                              idx === index
                                ? { ...item, timeTolerance: event.target.value }
                                : item
                            )
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Warehouse Stop Button */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addMiddleLeg}
              disabled={warehouseCheckpoints.length === 0}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Warehouse Stop
            </Button>
            {warehouseCheckpoints.length === 0 &&
              !loadingWarehouseCheckpoints && (
                <p className="text-xs text-muted-foreground">
                  No warehouse checkpoints available to add intermediate stops.
                </p>
              )}
          </div>

          {/* Submit Button */}
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
