import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { checkpointService, type Checkpoint } from "@/services/checkpointService";
import { shipmentService } from "@/services/shipmentService";
import { packageService, type PackageResponse } from "@/services/packageService";
import {
  deriveRouteLabel,
  extractShipmentItems,
  formatArrivalText,
  normalizeStatus,
  resolveShipmentAreas,
  supplierStatusBadgeClass,
} from "./utils";
import type {
  HandoverFormState,
  ManufacturerShipmentRecord,
  ShipmentLegInput,
  SupplierShipmentRecord,
} from "./types";

type ManufacturerContextValue = {
  enabled: boolean;
  manufacturerPackages: PackageResponse[];
  availablePackages: PackageResponse[];
  loadingManufacturerPackages: boolean;
  selectedPackageIds: string[];
  togglePackageSelection: (packageId: string, selected: boolean) => void;
  destUUID: string;
  setDestUUID: (value: string) => void;
  legs: ShipmentLegInput[];
  setLegs: React.Dispatch<React.SetStateAction<ShipmentLegInput[]>>;
  addLeg: () => void;
  resetLegs: () => void;
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  handleCreateShipment: (event: React.FormEvent<HTMLFormElement>) => void;
  creatingShipment: boolean;
  myShipments: ManufacturerShipmentRecord[];
  loadingMyShipments: boolean;
  onShipmentsUpdated: () => void;
  checkpoints: Checkpoint[];
  loadingCheckpoints: boolean;
};

type SupplierContextValue = {
  enabled: boolean;
  incomingShipments: SupplierShipmentRecord[];
  loadingIncoming: boolean;
  supplierPool: SupplierShipmentRecord[];
  supplierActive: SupplierShipmentRecord[];
  supplierDelivered: SupplierShipmentRecord[];
  supplierHistory: SupplierShipmentRecord[];
  areaQuery: string;
  setAreaQuery: (value: string) => void;
  filterShipmentsByArea: (shipments: SupplierShipmentRecord[]) => SupplierShipmentRecord[];
  acceptingShipmentId: string | null;
  acceptShipment: (id: string) => void;
  acceptShipmentPending: boolean;
  handoverDialogOpen: boolean;
  setHandoverDialogOpen: (open: boolean) => void;
  handoverTarget: SupplierShipmentRecord | null;
  setHandoverTarget: (shipment: SupplierShipmentRecord | null) => void;
  handoverForm: HandoverFormState;
  setHandoverForm: (updater: (prev: HandoverFormState) => HandoverFormState) => void;
  handoverLoading: boolean;
  submitHandover: () => Promise<void>;
  resetHandoverForm: () => void;
};

type SharedContextValue = {
  role?: string;
  uuid?: string;
  recentHandovers: Array<{
    id: string;
    productId: string;
    productName: string;
    from: string;
    to: string;
    timestamp: number;
    status: string;
    checkpoint: string;
  }>;
};

type HandoverContextValue = {
  manufacturer: ManufacturerContextValue;
  supplier: SupplierContextValue;
  shared: SharedContextValue;
};

const DEFAULT_LEG: ShipmentLegInput = {
  startId: "",
  endId: "",
  estArrival: "",
  expectedShip: "",
  timeTolerance: "",
  requiredAction: "",
};

const HandoverContext = createContext<HandoverContextValue | null>(null);

type ShipmentSegmentResponse = {
  id?: string;
  segmentHash?: string;
  shipmentId?: string;
  manufacturerUuid?: string;
  manufacturerLegalName?: string;
  status?: string | null;
  segmentOrder?: number;
  expectedShipDate?: string | null;
  expected_ship_date?: string | null;
  expectedArrivalDate?: string | null;
  expected_arrival_date?: string | null;
  estimatedArrivalDate?: string | null;
  estimated_arrival_date?: string | null;
  timeTolerance?: string | null;
  time_tolerance?: string | null;
  acceptedAt?: string | null;
  accepted_at?: string | null;
  handedOverAt?: string | null;
  handed_over_at?: string | null;
  startName?: string | null;
  endName?: string | null;
  startLocation?: { state?: string | null; country?: string | null } | null;
  endLocation?: { state?: string | null; country?: string | null } | null;
  items?: SupplierShipmentRecord["items"];
  shipmentItems?: SupplierShipmentRecord["shipmentItems"];
  checkpoints?: SupplierShipmentRecord["checkpoints"];
  [key: string]: unknown;
};

const mapSegmentStatusToSupplierStatus = (status?: string | null) => {
  if (typeof status !== "string") return "PENDING_ACCEPTANCE";
  const normalized = status.trim().toUpperCase();
  if (!normalized) return "PENDING_ACCEPTANCE";
  switch (normalized) {
    case "PENDING":
    case "PENDING_SUPPLIER":
    case "AWAITING_SUPPLIER":
    case "AWAITING_SUPPLIER_CONFIRMATION":
      return "PENDING_ACCEPTANCE";
    default:
      return normalized;
  }
};

const segmentToSupplierShipment = (segment: ShipmentSegmentResponse): SupplierShipmentRecord => {
  const derivedId =
    segment.shipmentId && segment.segmentOrder !== undefined
      ? `${segment.shipmentId}-${segment.segmentOrder}`
      : segment.shipmentId ?? undefined;
  const idCandidate = segment.id ?? segment.segmentHash ?? derivedId ?? "unknown-segment";

  const expectedArrival =
    segment.estimatedArrivalDate ??
    segment.estimated_arrival_date ??
    segment.expectedArrivalDate ??
    segment.expected_arrival_date ??
    undefined;

  const acceptedAt = segment.acceptedAt ?? segment.accepted_at ?? undefined;
  const handedOverAt = segment.handedOverAt ?? segment.handed_over_at ?? undefined;

  const originArea =
    segment.startLocation?.state ??
    segment.startLocation?.country ??
    segment.startName ??
    undefined;
  const destinationArea =
    segment.endLocation?.state ??
    segment.endLocation?.country ??
    segment.endName ??
    undefined;

  const resolvedItems =
    Array.isArray(segment.items) && segment.items.length > 0
      ? segment.items
      : Array.isArray(segment.shipmentItems) && segment.shipmentItems.length > 0
        ? segment.shipmentItems
        : [];

  const areaTokens = new Set<string>();
  [
    originArea,
    destinationArea,
    segment.startLocation?.country ?? undefined,
    segment.endLocation?.country ?? undefined,
    segment.startName ?? undefined,
    segment.endName ?? undefined,
  ]
    .filter(Boolean)
    .map(String)
    .forEach((value) => areaTokens.add(value));

  return {
    id: String(idCandidate),
    status: mapSegmentStatusToSupplierStatus(segment.status),
    expectedArrival,
    acceptedAt,
    handedOverAt,
    manufacturerName: segment.manufacturerLegalName ?? undefined,
    fromUUID: segment.manufacturerUuid ?? undefined,
    originArea,
    destinationArea,
    pickupArea: segment.startName ?? undefined,
    dropoffArea: segment.endName ?? undefined,
    areaTags: Array.from(areaTokens),
    destinationCheckpoint: segment.endName ?? undefined,
    shipmentItems: resolvedItems,
    items: resolvedItems,
    checkpoints: Array.isArray(segment.checkpoints) ? segment.checkpoints : undefined,
    segmentOrder: segment.segmentOrder,
    shipmentId: segment.shipmentId,
    expectedShipDate: segment.expectedShipDate ?? segment.expected_ship_date ?? undefined,
    timeTolerance: segment.timeTolerance ?? segment.time_tolerance ?? undefined,
  };
};

const mockSupplierShipments = {
  pool: [
    {
      id: "POOL-1024",
      manufacturerName: "Acme Manufacturing",
      fromUUID: "0xA1F4…2dc1",
      status: "PENDING_ACCEPTANCE",
      expectedArrival: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
      shipmentItems: [
        { productName: "COVID Test Kits", quantity: 500 },
        { productName: "Protective Gloves", quantity: 1000 },
      ],
    },
  ],
  accepted: [
    {
      id: "ACC-2048",
      manufacturerName: "MedTech Labs",
      fromUUID: "0xB7C2…9a51",
      status: "ACCEPTED",
      expectedArrival: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      acceptedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      shipmentItems: [{ productName: "Immuno Booster Packs", quantity: 250 }],
    },
  ],
  pickedUp: [
    {
      id: "PICK-3056",
      manufacturerName: "PharmaX",
      fromUUID: "0x9931…7f1d",
      status: "IN_TRANSIT",
      expectedArrival: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
      acceptedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      destinationCheckpoint: "Central Cold Chain Hub",
      shipmentItems: [{ productName: "Proximity Sensor Kit", quantity: 25 }],
    },
  ],
  delivered: [
    {
      id: "DELIV-4096",
      manufacturerName: "BioSecure Inc.",
      fromUUID: "0x71A3…5c42",
      status: "HANDOVER_READY",
      expectedArrival: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      handedOverAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      destinationCheckpoint: "Receiver Warehouse",
      shipmentItems: [{ productName: "Thermal Packaging Units", quantity: 40 }],
    },
  ],
  history: [
    {
      id: "HIST-5120",
      manufacturerName: "Acme Manufacturing",
      fromUUID: "0xA1F4…2dc1",
      status: "COMPLETED",
      handedOverAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      shipmentItems: [{ productName: "COVID Test Kits", quantity: 600 }],
    },
  ],
};

export const HandoverProvider = ({ children }: { children: React.ReactNode }) => {
  const { role, uuid, user } = useAppStore();
  const queryClient = useQueryClient();

  const { data: checkpoints = [], isLoading: loadingCheckpoints } = useQuery({
    queryKey: ["checkpoints", role, uuid],
    queryFn: () =>
      role === "MANUFACTURER"
        ? checkpointService.getAll({ type: "MANUFACTURER" })
        : checkpointService.getByOwner(uuid ?? ""),
    enabled: Boolean(uuid),
  });

  const { data: incoming = [], isLoading: loadingIncoming } = useQuery<
    ShipmentSegmentResponse[],
    Error,
    SupplierShipmentRecord[]
  >({
    queryKey: ["incomingShipments", uuid],
    queryFn: () => shipmentService.getIncoming(uuid ?? ""),
    enabled: Boolean(uuid) && (role === "SUPPLIER" || role === "WAREHOUSE"),
    select: (segments) => segments.map(segmentToSupplierShipment),
  });

  const { data: myShipments = [], isLoading: loadingMyShipments } = useQuery<ManufacturerShipmentRecord[]>({
    queryKey: ["myShipments", uuid],
    queryFn: () => shipmentService.getByManufacturer(uuid ?? ""),
    enabled: Boolean(uuid) && role === "MANUFACTURER",
  });

  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [destUUID, setDestUUID] = useState("");
  const [legs, setLegs] = useState<ShipmentLegInput[]>([DEFAULT_LEG]);
  const [createOpen, setCreateOpen] = useState(false);
  const [acceptingShipmentId, setAcceptingShipmentId] = useState<string | null>(null);
  const [handoverDialogOpen, setHandoverDialogOpen] = useState(false);
  const [handoverTarget, setHandoverTarget] = useState<SupplierShipmentRecord | null>(null);
  const [handoverForm, setHandoverFormState] = useState<HandoverFormState>({
    handoverToUUID: "",
    checkpointNote: "",
    temperatureCheck: "",
  });
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [areaQuery, setAreaQuery] = useState("");

  const {
    data: manufacturerPackages = [],
    isLoading: loadingManufacturerPackages,
  } = useQuery<PackageResponse[]>({
    queryKey: ["manufacturerPackages", uuid],
    queryFn: () => packageService.listByManufacturer(uuid ?? ""),
    enabled: Boolean(uuid) && role === "MANUFACTURER",
  });

  const availablePackages = manufacturerPackages;

  const resetPackageSelections = useCallback(() => setSelectedPackageIds([]), []);

  const togglePackageSelection = useCallback((packageId: string, selected: boolean) => {
    setSelectedPackageIds((prev) => {
      const set = new Set(prev.map(String));
      const normalizedId = String(packageId);
      if (selected) {
        set.add(normalizedId);
      } else {
        set.delete(normalizedId);
      }
      return Array.from(set);
    });
  }, []);

  const addLeg = useCallback(() => {
    setLegs((prev) => [...prev, { ...DEFAULT_LEG }]);
  }, [setLegs]);

  const resetLegs = useCallback(() => {
    setLegs([{ ...DEFAULT_LEG }]);
  }, [setLegs]);

  const createShipment = useMutation({
    mutationFn: shipmentService.create,
    onSuccess: () => {
      toast.success("Shipment created");
      setDestUUID("");
      resetPackageSelections();
      resetLegs();
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["myShipments"] });
    },
    onError: (error: unknown) => {
      const message =
        typeof error === "object" &&
          error !== null &&
          "response" in error &&
          typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error === "string"
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(message || "Failed to create shipment");
    },
  });

  const handleCreateShipment = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const knownPackageIds = new Set(
        manufacturerPackages
          .map((pkg) => pkg.package_uuid ?? pkg.id)
          .filter((value): value is string | number => value !== undefined && value !== null)
          .map((value) => String(value)),
      );

      const shipmentItems = selectedPackageIds
        .map((packageId) => String(packageId))
        .filter((packageId) => knownPackageIds.has(packageId))
        .map((packageId) => ({
          package_uuid: packageId,
        }));

      if (shipmentItems.length === 0) {
        toast.error("Select at least one package");
        return;
      }

      if (!destUUID.trim()) {
        toast.error("Enter destination party UUID");
        return;
      }

      if (!uuid) {
        toast.error("Missing manufacturer identifier");
        return;
      }

      const toISO = (value: string) => {
        if (!value) return "";
        try {
          return new Date(value).toISOString();
        } catch {
          return value;
        }
      };

      const checkpointsPayload = legs
        .filter((leg) => leg.startId && leg.endId)
        .map((leg, index) => ({
          start_checkpoint_id: Number.isFinite(Number(leg.startId))
            ? Number(leg.startId)
            : leg.startId,
          end_checkpoint_id: Number.isFinite(Number(leg.endId))
            ? Number(leg.endId)
            : leg.endId,
          estimated_arrival_date: toISO(leg.estArrival),
          time_tolerance: leg.timeTolerance || undefined,
          expected_ship_date: toISO(leg.expectedShip),
          segment_order: index + 1,
          ...(leg.requiredAction ? { required_action: leg.requiredAction } : {}),
        }));

      if (checkpointsPayload.length === 0) {
        toast.error("Add at least one route checkpoint leg");
        return;
      }

      createShipment.mutate({
        manufacturerUUID: uuid!,
        destinationPartyUUID: destUUID.trim(),
        shipmentItems,
        checkpoints: checkpointsPayload,
      });
    },
    [createShipment, destUUID, legs, selectedPackageIds, uuid, manufacturerPackages],
  );

  const acceptShipment = useMutation({
    mutationFn: (shipmentId: string) => shipmentService.accept(shipmentId),
    onMutate: (shipmentId: string) => {
      setAcceptingShipmentId(shipmentId);
    },
    onSuccess: () => {
      toast.success("Shipment accepted");
      queryClient.invalidateQueries({ queryKey: ["incomingShipments"] });
    },
    onError: (error: unknown) => {
      const message = (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error === "string"
      )
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      toast.error(message || "Failed to accept shipment");
    },
    onSettled: () => {
      setAcceptingShipmentId(null);
    },
  });

  const resetHandoverForm = useCallback(() => {
    setHandoverFormState({
      handoverToUUID: "",
      checkpointNote: "",
      temperatureCheck: "",
    });
  }, []);

  const submitHandover = useCallback(async () => {
    if (!handoverTarget) {
      return;
    }
    setHandoverLoading(true);
    try {
      // TODO: replace with shipmentService.handover once API details are available.
      await new Promise((resolve) => setTimeout(resolve, 900));
      toast.success("Handover details submitted.");
      setHandoverDialogOpen(false);
      setHandoverTarget(null);
      resetHandoverForm();
      queryClient.invalidateQueries({ queryKey: ["incomingShipments"] });
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit handover details.");
    } finally {
      setHandoverLoading(false);
    }
  }, [handoverTarget, queryClient, resetHandoverForm]);

  const pendingStatuses = useMemo(
    () => ["PENDING_ACCEPTANCE", "PREPARING", "AWAITING_SUPPLIER_CONFIRMATION"],
    [],
  );
  const activeStatuses = useMemo(
    () => ["ACCEPTED", "IN_TRANSIT", "READY_FOR_HANDOVER", "HANDOVER_PENDING"],
    [],
  );
  const historyStatuses = useMemo(
    () => ["HANDOVER_READY", "HANDOVER_COMPLETED", "COMPLETED", "DELIVERED", "CLOSED", "REJECTED"],
    [],
  );

  const supplierPendingRaw = useMemo(
    () => incoming.filter((shipment) => pendingStatuses.includes(normalizeStatus(shipment.status))),
    [incoming, pendingStatuses],
  );
  const supplierActiveRaw = useMemo(
    () => incoming.filter((shipment) => activeStatuses.includes(normalizeStatus(shipment.status))),
    [activeStatuses, incoming],
  );
  const supplierHistoryRaw = useMemo(
    () => incoming.filter((shipment) => historyStatuses.includes(normalizeStatus(shipment.status))),
    [historyStatuses, incoming],
  );

  const supplierPool =
    supplierPendingRaw.length > 0 ? supplierPendingRaw : mockSupplierShipments.pool;
  const supplierActive =
    supplierActiveRaw.length > 0
      ? supplierActiveRaw
      : mockSupplierShipments.accepted.concat(mockSupplierShipments.pickedUp);
  const deliveredCandidates = useMemo(
    () =>
      incoming.filter((shipment) =>
        ["HANDOVER_READY", "HANDOVER_COMPLETED", "COMPLETED", "DELIVERED"].includes(
          normalizeStatus(shipment.status),
        ),
      ),
    [incoming],
  );
  const supplierDelivered =
    deliveredCandidates.length > 0 ? deliveredCandidates : mockSupplierShipments.delivered;
  const supplierHistory =
    supplierHistoryRaw.length > 0 ? supplierHistoryRaw : mockSupplierShipments.history;

  const filterShipmentsByArea = useCallback(
    (shipments: SupplierShipmentRecord[]) => {
      const term = areaQuery.trim().toLowerCase();
      if (!term) return shipments;
      return shipments.filter((shipment) => {
        const areas = resolveShipmentAreas(shipment);
        return areas.some((area) => area.toLowerCase().includes(term));
      });
    },
    [areaQuery],
  );

  const recentHandovers = useMemo(
    () => [
      {
        id: "h1",
        productId: "prod-001",
        productName: "Organic Coffee Beans",
        from: "0x742d35Cc6634C0532925a3b8D8b5C4e0c5E42F2B",
        to: "0x8ba1f109551bD432803012645Hac136c30c6213c",
        timestamp: Date.now() - 3_600_000,
        status: "completed",
        checkpoint: "Central Warehouse",
      },
      {
        id: "h2",
        productId: "prod-002",
        productName: "Premium Tea Selection",
        from: "0x8ba1f109551bD432803012645Hac136c30c6213c",
        to: "0x456d35Cc6634C0532925a3b8D8b5C4e0c5E42F2B",
        timestamp: Date.now() - 7_200_000,
        status: "pending",
        checkpoint: "Distribution Center",
      },
    ],
    [],
  );

  const manufacturer: ManufacturerContextValue = {
    enabled: role === "MANUFACTURER",
    manufacturerPackages,
    availablePackages,
    loadingManufacturerPackages,
    selectedPackageIds,
    togglePackageSelection,
    destUUID,
    setDestUUID,
    legs,
    setLegs,
    addLeg,
    resetLegs,
    createOpen,
    setCreateOpen,
    handleCreateShipment,
    creatingShipment: createShipment.isPending,
    myShipments,
    loadingMyShipments,
    onShipmentsUpdated: () => queryClient.invalidateQueries({ queryKey: ["myShipments"] }),
    checkpoints,
    loadingCheckpoints,
  };

  const supplier: SupplierContextValue = {
    enabled: role === "SUPPLIER" || role === "WAREHOUSE",
    incomingShipments: incoming,
    loadingIncoming,
    supplierPool,
    supplierActive,
    supplierDelivered,
    supplierHistory,
    areaQuery,
    setAreaQuery,
    filterShipmentsByArea,
    acceptingShipmentId,
    acceptShipment: (id: string) => acceptShipment.mutate(id),
    acceptShipmentPending: acceptShipment.isPending,
    handoverDialogOpen,
    setHandoverDialogOpen,
    handoverTarget,
    setHandoverTarget,
    handoverForm,
    setHandoverForm: (updater) => setHandoverFormState((prev) => updater({ ...prev })),
    handoverLoading,
    submitHandover,
    resetHandoverForm,
  };

  const shared: SharedContextValue = {
    role,
    uuid,
    recentHandovers,
  };

  const value: HandoverContextValue = {
    manufacturer,
    supplier,
    shared,
  };

  return <HandoverContext.Provider value={value}>{children}</HandoverContext.Provider>;
};

export const useHandoverContext = () => {
  const context = useContext(HandoverContext);
  if (!context) {
    throw new Error("useHandoverContext must be used within a HandoverProvider");
  }
  return context;
};

export const useManufacturerContext = () => useHandoverContext().manufacturer;
export const useSupplierContext = () => useHandoverContext().supplier;
export const useHandoverSharedContext = () => useHandoverContext().shared;

export const handoverUtils = {
  deriveRouteLabel,
  extractShipmentItems,
  resolveShipmentAreas,
  supplierStatusBadgeClass,
  normalizeStatus,
  formatArrivalText,
};
