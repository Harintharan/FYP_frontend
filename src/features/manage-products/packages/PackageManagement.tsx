import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
  PlusCircle,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  packageService,
  type PackageRegistryPayload,
  type PackageResponse,
  type UpdatePackagePayload,
} from "@/services/packageService";
import { batchService } from "@/services/batchService";
import {
  sensorTypeService,
  type SensorType,
} from "@/services/sensorTypeService";
import type { ProductBatchSummary } from "@/types";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { QRCodeGenerator } from "@/components/qr/QRCodeGenerator";
import { useAppToast } from "@/hooks/useAppToast";

type PackageFormState = {
  batchId: string;
  microprocessorMac: string;
  sensorTypes: string[];
};

const emptyPackageForm = (): PackageFormState => ({
  batchId: "",
  microprocessorMac: "",
  sensorTypes: [],
});

const formatDateTime = (value?: string) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const normalizeSensorArray = (value?: string[] | string | null) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((sensor) => (typeof sensor === "string" ? sensor.trim() : ""))
      .filter((sensor) => sensor.length > 0);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((sensor) => sensor.trim())
      .filter((sensor) => sensor.length > 0);
  }
  return [];
};

const sensorsToLabel = (sensors?: string[] | string) => {
  if (!sensors) return "Not specified";
  if (Array.isArray(sensors)) {
    return sensors.length ? sensors.join(", ") : "Not specified";
  }
  return (
    sensors
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .join(", ") || "Not specified"
  );
};

const formatHash = (value?: string | null) => {
  if (!value) return "Not available";
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

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

const getMockQrPayload = (pkg: PackageResponse) => {
  return String(pkg.packageCode ?? pkg.package_uuid ?? pkg.id ?? "");
};

const productionTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const toProductionLabel = (value?: string | null) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return productionTimeFormatter.format(date);
};

const deriveBatchProductionWindow = (batch: ProductBatchSummary) => {
  const start = toProductionLabel(
    batch.productionStartTime ?? batch.productionStart
  );
  const end = toProductionLabel(batch.productionEndTime ?? batch.productionEnd);

  let detail: string | undefined;
  if (start && end) {
    detail = `${start} - ${end}`;
  } else if (start) {
    detail = start;
  } else if (end) {
    detail = end;
  } else if (
    typeof batch.productionWindow === "string" &&
    batch.productionWindow.trim().length > 0
  ) {
    detail = batch.productionWindow.trim();
  }

  const productName =
    batch.product?.name ??
    batch.product?.productName ??
    batch.productName ??
    "Unnamed product";
  const batchLabel =
    batch.batchCode ??
    batch.batchNumber ??
    (batch.id ? `Batch ${batch.id}` : "Unnamed batch");

  return detail
    ? `${productName} - ${detail}`
    : `${productName} - ${batchLabel}`;
};

type SensorTypeSelectorProps = {
  selected: string[];
  onChange: (next: string[]) => void;
  options: SensorType[];
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  placeholder?: string;
  onCreateSensorType?: () => void;
};

function SensorTypeSelector({
  selected,
  onChange,
  options,
  disabled,
  loading,
  error,
  placeholder = "Select sensor types",
  onCreateSensorType,
}: SensorTypeSelectorProps) {
  const [open, setOpen] = useState(false);

  const toggleSensor = (name: string) => {
    onChange(
      selected.includes(name)
        ? selected.filter((sensor) => sensor !== name)
        : [...selected, name]
    );
  };

  const selectionLabel = selected.length
    ? `${selected.length} sensor${selected.length > 1 ? "s" : ""} selected`
    : placeholder;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn("w-full justify-between", disabled && "opacity-50")}
            disabled={disabled}
          >
            <span className="truncate">{selectionLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] sm:w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search sensor types..." />
            <CommandList>
              <CommandEmpty>
                {loading
                  ? "Loading sensor types..."
                  : error
                  ? "Failed to load sensor types"
                  : "No sensor types found"}
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selected.includes(option.name);
                  return (
                    <CommandItem
                      key={option.id}
                      value={option.name}
                      onSelect={() => toggleSensor(option.name)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
            {onCreateSensorType ? (
              <>
                <CommandSeparator />
                <div className="p-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      setOpen(false);
                      onCreateSensorType();
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add sensor type
                  </Button>
                </div>
              </>
            ) : null}
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-2">
          {selected.map((sensor) => (
            <Badge
              key={sensor}
              variant="secondary"
              className="flex items-center gap-1 text-xs sm:text-sm py-0.5 sm:py-1"
            >
              {sensor}
              <button
                type="button"
                onClick={() => toggleSensor(sensor)}
                className="rounded-full p-0.5 hover:text-destructive touch-manipulation"
                aria-label={`Remove ${sensor}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </>
  );
}

export function PackageManagement() {
  const queryClient = useQueryClient();
  const { uuid } = useAppStore();
  const { showSuccess, showError } = useAppToast();
  const manufacturerUUID = uuid ?? "";

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<PackageFormState>(
    emptyPackageForm()
  );

  const [editingPackage, setEditingPackage] = useState<PackageResponse | null>(
    null
  );
  const [editForm, setEditForm] = useState<UpdatePackagePayload>({});

  const [viewingPackage, setViewingPackage] = useState<PackageResponse | null>(
    null
  );
  const [qrPreviewPackage, setQrPreviewPackage] =
    useState<PackageResponse | null>(null);
  const [isSensorTypeDialogOpen, setIsSensorTypeDialogOpen] = useState(false);
  const [sensorTypeDialogContext, setSensorTypeDialogContext] = useState<
    "create" | "edit"
  >("create");
  const [newSensorTypeName, setNewSensorTypeName] = useState("");
  const [packageFilter, setPackageFilter] = useState("");

  const {
    data: packages = [],
    isLoading: loadingPackages,
    isError: packagesError,
    error: packagesErrorDetails,
  } = useQuery<PackageResponse[]>({
    queryKey: ["packages", manufacturerUUID],
    queryFn: () => packageService.listByManufacturer(manufacturerUUID),
    enabled: Boolean(manufacturerUUID),
  });

  const {
    data: batches = [],
    isLoading: loadingBatches,
    isError: batchesError,
    error: batchesErrorDetails,
  } = useQuery<ProductBatchSummary[]>({
    queryKey: ["batches", "for-packages", manufacturerUUID],
    queryFn: () => batchService.getAllBatches(manufacturerUUID),
    enabled: Boolean(manufacturerUUID),
  });

  const {
    data: sensorTypes = [],
    isLoading: loadingSensorTypes,
    isError: sensorTypesError,
    error: sensorTypesErrorDetails,
  } = useQuery<SensorType[]>({
    queryKey: ["sensor-types", manufacturerUUID],
    queryFn: () => sensorTypeService.list(),
    enabled: Boolean(manufacturerUUID),
  });

  const createSensorTypeMutation = useMutation({
    mutationFn: (payload: { name: string }) =>
      sensorTypeService.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["sensor-types", manufacturerUUID],
      });
      setIsSensorTypeDialogOpen(false);
      setNewSensorTypeName("");
      showSuccess("Sensor type created");

      if (sensorTypeDialogContext === "create") {
        setCreateForm((current) => ({
          ...current,
          sensorTypes: Array.from(new Set([...current.sensorTypes, data.name])),
        }));
      } else {
        setEditForm((current) => ({
          ...current,
          sensorTypes: Array.from(
            new Set([...normalizeSensorArray(current.sensorTypes), data.name])
          ),
        }));
      }
    },
    onError: (err: unknown) => {
      showError(
        err instanceof Error ? err.message : "Failed to create sensor type"
      );
    },
  });

  const batchLookup = useMemo(
    () => new Map(batches.map((batch) => [String(batch.id), batch])),
    [batches]
  );

  const batchOptions = useMemo(
    () =>
      batches.map((batch) => ({
        value: String(batch.id),
        label: deriveBatchProductionWindow(batch),
      })),
    [batches]
  );

  const filteredPackages = useMemo(() => {
    const term = packageFilter.trim().toLowerCase();
    if (!term) return packages;

    return packages.filter((pkg) => {
      const batchReference =
        pkg.batch ??
        (pkg.batchId ? batchLookup.get(String(pkg.batchId)) ?? null : null);
      const productLabel =
        batchReference?.product?.name ??
        batchReference?.product?.productName ??
        "Product not linked";

      const haystack = [
        pkg.packageCode,
        pkg.id,
        pkg.status,
        pkg.integrity,
        pkg.microprocessorMac,
        productLabel,
        batchReference?.batchCode,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return haystack.some((value) => value.includes(term));
    });
  }, [packages, packageFilter, batchLookup]);
  const editSensorSelections = normalizeSensorArray(editForm.sensorTypes);
  const sensorTypeErrorMessage =
    sensorTypesErrorDetails instanceof Error
      ? sensorTypesErrorDetails.message
      : "Unable to load sensor types.";

  const openSensorTypeDialog = (context: "create" | "edit") => {
    setSensorTypeDialogContext(context);
    setIsSensorTypeDialogOpen(true);
  };

  const handleSensorTypeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = newSensorTypeName.trim();
    if (!trimmed) {
      showError("Name required");
      return;
    }
    createSensorTypeMutation.mutate({ name: trimmed });
  };

  const createMutation = useMutation({
    mutationFn: (payload: PackageRegistryPayload) =>
      packageService.register(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["packages", manufacturerUUID],
      });
      setIsCreateDialogOpen(false);
      setCreateForm(emptyPackageForm());
      showSuccess("Package registered");
    },
    onError: (err: unknown) => {
      showError(
        err instanceof Error ? err.message : "Failed to register package"
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: UpdatePackagePayload }) =>
      packageService.update(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["packages", manufacturerUUID],
      });
      setEditingPackage(null);
      setEditForm({});
      showSuccess("Package updated");
    },
    onError: (err: unknown) => {
      showError(
        err instanceof Error ? err.message : "Failed to update package"
      );
    },
  });

  const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!manufacturerUUID) {
      showError("Manufacturer profile required");
      return;
    }
    if (!createForm.batchId) {
      showError("Select batch");
      return;
    }
    createMutation.mutate({
      manufacturerUUID,
      batchId: createForm.batchId,
      microprocessorMac: createForm.microprocessorMac.trim(),
      sensorTypes: createForm.sensorTypes,
    });
  };

  const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingPackage) return;
    updateMutation.mutate({
      id: editingPackage.id,
      data: editForm,
    });
  };

  const renderPackages = () => {
    const hasFilter = Boolean(packageFilter.trim());

    if (loadingPackages) {
      return (
        <div className="rounded-lg border border-border/60">
          <div className="max-h-[60vh] overflow-y-auto overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Integrity</TableHead>
                  <TableHead>Sensors</TableHead>
                  <TableHead>QR</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={`package-skeleton-${index}`}>
                    <TableCell>
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="mt-2 h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-36" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-16" />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }

    if (packagesError) {
      return (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {(packagesErrorDetails as Error)?.message ??
            "Unable to load packages right now."}
        </div>
      );
    }

    if (!packages.length && !hasFilter) {
      return (
        <div className="rounded-lg border border-border/60 p-6 text-center text-sm text-muted-foreground">
          No packages registered yet. Use the Create Package button to add one.
        </div>
      );
    }

    if (!filteredPackages.length) {
      return (
        <div className="rounded-lg border border-border/60 p-6 text-center text-sm text-muted-foreground">
          No packages match your current filter.
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-border/60">
        <div className="max-h-[60vh] overflow-y-auto overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
          <Table className="min-w-[640px] sm:min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm">Package</TableHead>
                <TableHead className="text-xs sm:text-sm">Quantity</TableHead>
                <TableHead className="text-xs sm:text-sm">Status</TableHead>
                <TableHead className="text-xs sm:text-sm">Integrity</TableHead>
                <TableHead className="text-xs sm:text-sm hidden sm:table-cell">
                  Sensors
                </TableHead>
                <TableHead className="text-xs sm:text-sm">QR</TableHead>
                <TableHead className="text-xs sm:text-sm text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPackages.map((pkg) => {
                const batchReference =
                  pkg.batch ??
                  (pkg.batchId
                    ? batchLookup.get(String(pkg.batchId)) ?? null
                    : null);
                const batchLabel =
                  batchReference?.batchCode ??
                  (pkg.batchId ? `Batch ${pkg.batchId}` : "No batch linked");
                  const productLabel =
                    batchReference?.product?.name ??
                    batchReference?.product?.productName ??
                    "Product not linked";
                  const qrPayload = getMockQrPayload(pkg);
                  const integrityMeta = getIntegrityMeta(pkg.integrity);
                  return (
                    <TableRow key={pkg.id}>
                      <TableCell className="py-2 sm:py-4">
                      <div className="font-medium text-foreground text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                        {pkg.packageCode || `Package ${pkg.id}`}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                        {productLabel}
                      </p>
                    </TableCell>
                    <TableCell className="py-2 sm:py-4">
                      <div className="text-foreground text-xs sm:text-sm">
                        {pkg.quantity ?? "N/A"}
                      </div>
                    </TableCell>
                      <TableCell className="py-2 sm:py-4 text-xs sm:text-sm">
                        {pkg.status ?? "Not specified"}
                      </TableCell>
                      <TableCell className="py-2 sm:py-4 text-xs sm:text-sm">
                        <Badge
                          variant="outline"
                          className={`text-[10px] sm:text-xs ${integrityMeta.className}`}
                        >
                          {integrityMeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 sm:py-4 text-xs sm:text-sm hidden sm:table-cell">
                        {sensorsToLabel(pkg.sensorTypes)}
                      </TableCell>
                    <TableCell className="py-2 sm:py-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setQrPreviewPackage(pkg)}
                        className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                      >
                        QR
                      </Button>
                    </TableCell>
                    <TableCell className="py-2 sm:py-4">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingPackage(pkg)}
                          className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                        >
                          View
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingPackage(pkg);
                            setEditForm({
                              packageCode: pkg.packageCode ?? "",
                              status: pkg.status,
                              notes: pkg.notes,
                              sensorTypes: normalizeSensorArray(
                                pkg.sensorTypes
                              ),
                            });
                          }}
                          className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-4 sm:space-y-6">
      <header className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Packages
          </h2>
          {/* <p className="text-sm text-muted-foreground">
            Register packages as they leave production and keep package metadata
            up to date.
          </p> */}
        </div>
        <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center lg:justify-end">
          <div className="w-full sm:w-64">
            <label htmlFor="package-filter" className="sr-only">
              Search packages
            </label>
            <Input
              id="package-filter"
              value={packageFilter}
              onChange={(event) => setPackageFilter(event.target.value)}
              placeholder="Search packages..."
              className="h-9 sm:h-10 text-sm"
            />
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="gap-2 h-9 sm:h-10 text-sm w-full sm:w-auto"
            disabled={
              !manufacturerUUID || loadingBatches || Boolean(batchesError)
            }
          >
            <PlusCircle className="h-4 w-4" />
            Create Package
          </Button>
        </div>
      </header>

      {renderPackages()}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="mx-2 w-[calc(100%-1rem)] sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Create Package
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Link a new package to its production batch.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3 sm:space-y-4"
            onSubmit={handleCreateSubmit}
          >
            <div className="space-y-1.5 sm:space-y-2">
              <label
                htmlFor="package-batch"
                className="text-xs sm:text-sm font-medium"
              >
                Batch
              </label>
              <Select
                value={createForm.batchId}
                onValueChange={(value) =>
                  setCreateForm((current) => ({ ...current, batchId: value }))
                }
                disabled={loadingBatches || batchesError}
                required
              >
                <SelectTrigger id="package-batch">
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batchOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label
                htmlFor="package-mac"
                className="text-xs sm:text-sm font-medium"
              >
                Microprocessor MAC
              </label>
              <Input
                id="package-mac"
                placeholder="00:1A:2B:3C:4D:5E"
                value={createForm.microprocessorMac}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    microprocessorMac: event.target.value,
                  }))
                }
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium">Sensors</label>
              <SensorTypeSelector
                selected={createForm.sensorTypes}
                onChange={(next) =>
                  setCreateForm((current) => ({
                    ...current,
                    sensorTypes: next,
                  }))
                }
                options={sensorTypes}
                disabled={loadingSensorTypes || sensorTypesError}
                loading={loadingSensorTypes}
                error={sensorTypesError}
                onCreateSensorType={() => openSensorTypeDialog("create")}
              />
              {sensorTypesError ? (
                <p className="text-sm text-destructive">
                  {sensorTypeErrorMessage}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="h-9 sm:h-10 text-sm w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="gap-2 h-9 sm:h-10 text-sm w-full sm:w-auto"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Register package
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingPackage)}
        onOpenChange={(open) => (!open ? setEditingPackage(null) : null)}
      >
        <DialogContent className="mx-2 w-[calc(100%-1rem)] sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Edit Package
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Update package metadata.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-3 sm:space-y-4" onSubmit={handleEditSubmit}>
            <div className="space-y-1.5 sm:space-y-2">
              <label
                htmlFor="edit-package-code"
                className="text-xs sm:text-sm font-medium"
              >
                Package code
              </label>
              <Input
                id="edit-package-code"
                value={editForm.packageCode ?? ""}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    packageCode: event.target.value,
                  }))
                }
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label
                htmlFor="edit-package-status"
                className="text-xs sm:text-sm font-medium"
              >
                Status
              </label>
              <Input
                id="edit-package-status"
                value={editForm.status ?? ""}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium">Sensors</label>
              <SensorTypeSelector
                selected={editSensorSelections}
                onChange={(next) =>
                  setEditForm((current) => ({ ...current, sensorTypes: next }))
                }
                options={sensorTypes}
                disabled={loadingSensorTypes || sensorTypesError}
                loading={loadingSensorTypes}
                error={sensorTypesError}
                onCreateSensorType={() => openSensorTypeDialog("edit")}
              />
              {sensorTypesError ? (
                <p className="text-sm text-destructive">
                  {sensorTypeErrorMessage}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label
                htmlFor="edit-package-notes"
                className="text-xs sm:text-sm font-medium"
              >
                Notes
              </label>
              <Textarea
                id="edit-package-notes"
                value={editForm.notes ?? ""}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                className="text-sm min-h-[80px] sm:min-h-[100px]"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingPackage(null)}
                className="h-9 sm:h-10 text-sm w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="gap-2 h-9 sm:h-10 text-sm w-full sm:w-auto"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Save changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isSensorTypeDialogOpen}
        onOpenChange={setIsSensorTypeDialogOpen}
      >
        <DialogContent className="mx-2 w-[calc(100%-1rem)] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Add sensor type
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Create a reusable sensor type for your organisation.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3 sm:space-y-4"
            onSubmit={handleSensorTypeSubmit}
          >
            <div className="space-y-1.5 sm:space-y-2">
              <label
                htmlFor="new-sensor-type"
                className="text-xs sm:text-sm font-medium"
              >
                Sensor type name
              </label>
              <Input
                id="new-sensor-type"
                autoFocus
                placeholder="e.g., Humidity"
                value={newSensorTypeName}
                onChange={(event) => setNewSensorTypeName(event.target.value)}
                disabled={createSensorTypeMutation.isPending}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsSensorTypeDialogOpen(false);
                  setNewSensorTypeName("");
                }}
                disabled={createSensorTypeMutation.isPending}
                className="h-9 sm:h-10 text-sm w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="gap-2 h-9 sm:h-10 text-sm w-full sm:w-auto"
                disabled={createSensorTypeMutation.isPending}
              >
                {createSensorTypeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Save sensor type
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(viewingPackage)}
        onOpenChange={(open) => (!open ? setViewingPackage(null) : null)}
      >
        <DialogContent className="mx-2 w-[calc(100%-1rem)] sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl truncate">
              {viewingPackage?.packageCode || `Package ${viewingPackage?.id}`}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Package details
            </DialogDescription>
          </DialogHeader>
          {viewingPackage ? (
            <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
              <div>
                <p className="text-muted-foreground">Batch</p>
                <p className="text-foreground">
                  {viewingPackage.batch?.batchCode ??
                    (viewingPackage.batchId
                      ? batchLookup.get(String(viewingPackage.batchId))
                          ?.batchCode || `Batch ${viewingPackage.batchId}`
                      : "Not linked")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Product</p>
                <p className="text-foreground">
                  {viewingPackage.batch?.product?.name ??
                    viewingPackage.batch?.product?.productName ??
                    (viewingPackage.batchId
                      ? batchLookup.get(String(viewingPackage.batchId))?.product
                          ?.productName ??
                        batchLookup.get(String(viewingPackage.batchId))?.product
                          ?.name ??
                        "Not linked"
                      : "Not linked")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Quantity</p>
                <p className="text-foreground">
                  {viewingPackage.quantity ?? "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="text-foreground">
                  {viewingPackage.status ?? "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Sensor types</p>
                <p className="text-foreground">
                  {sensorsToLabel(viewingPackage.sensorTypes)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Microprocessor MAC</p>
                <p className="text-foreground">
                  {viewingPackage.microprocessorMac ?? "Not provided"}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 sm:p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Created at
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatDateTime(viewingPackage.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Updated at
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatDateTime(viewingPackage.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(qrPreviewPackage)}
        onOpenChange={(open) => (!open ? setQrPreviewPackage(null) : null)}
      >
        <DialogContent className="mx-2 w-[calc(100%-1rem)] sm:w-full sm:max-w-sm max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl truncate">
              {qrPreviewPackage?.packageCode ||
                `Package ${qrPreviewPackage?.id}`}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Package QR code
            </DialogDescription>
          </DialogHeader>
          {qrPreviewPackage ? (
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex justify-center">
                <QRCodeGenerator
                  data={getMockQrPayload(qrPreviewPackage)}
                  title="Package QR"
                  size={180}
                />
              </div>
              <div className="rounded-md border bg-muted/40 p-2 text-[10px] sm:text-[11px] font-mono break-all">
                {getMockQrPayload(qrPreviewPackage)}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
