import { formatDistanceToNow } from "date-fns";
import type { ProductBatchSummary } from "@/types";
import type { SupplierShipmentRecord } from "./types";

const batchDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export const formatBatchRange = (start?: string | null, end?: string | null) => {
  const startDate = start ? new Date(start) : undefined;
  const endDate = end ? new Date(end) : undefined;
  const startValid = startDate instanceof Date && !Number.isNaN(startDate.getTime());
  const endValid = endDate instanceof Date && !Number.isNaN(endDate.getTime());

  if (startValid && endValid) {
    if (startDate!.toDateString() === endDate!.toDateString()) {
      return batchDateFormatter.format(startDate!);
    }
    return `${batchDateFormatter.format(startDate!)} - ${batchDateFormatter.format(endDate!)}`;
  }

  if (startValid) return batchDateFormatter.format(startDate!);
  if (endValid) return batchDateFormatter.format(endDate!);
  return undefined;
};

export const deriveBatchLabel = (batch: ProductBatchSummary) => {
  if (batch.batchCode) return batch.batchCode;

  const rawWindow =
    typeof batch.productionWindow === "string" ? batch.productionWindow : undefined;
  const [windowStart, windowEnd] = rawWindow ? rawWindow.split("/") : [undefined, undefined];

  const startCandidate = batch.productionStartTime ?? batch.productionStart ?? windowStart;
  const endCandidate = batch.productionEndTime ?? batch.productionEnd ?? windowEnd;

  const range = formatBatchRange(startCandidate, endCandidate);
  if (range) return range;

  if (rawWindow) return rawWindow;
  return "Batch";
};

export const buildBatchDetails = (batch: ProductBatchSummary) => {
  const releaseStatus = batch.releaseStatus;
  const quantityProduced = batch.quantityProduced;
  const expiry = batch.expiryDate;

  const parts: string[] = [];
  if (releaseStatus) parts.push(`Release: ${releaseStatus}`);
  if (quantityProduced !== undefined && quantityProduced !== null && quantityProduced !== "") {
    parts.push(`Qty ${quantityProduced}`);
  }

  if (expiry) {
    const expiryDate = new Date(expiry);
    if (!Number.isNaN(expiryDate.getTime())) {
      parts.push(`Expires ${batchDateFormatter.format(expiryDate)}`);
    }
  }

  return parts.join(" | ");
};

export const normalizeStatus = (status?: string) => (status ?? "PENDING_ACCEPTANCE").toUpperCase();

export const supplierStatusBadgeClass = (status: string) => {
  switch (status) {
    case "PENDING_ACCEPTANCE":
    case "PREPARING":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "ACCEPTED":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "IN_TRANSIT":
    case "READY_FOR_HANDOVER":
    case "HANDOVER_PENDING":
      return "bg-purple-100 text-purple-700 border-purple-300";
    case "HANDOVER_READY":
    case "HANDOVER_COMPLETED":
    case "COMPLETED":
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    case "CLOSED":
      return "bg-muted text-muted-foreground border";
    case "REJECTED":
      return "bg-red-100 text-red-700 border-red-300";
    default:
      return "bg-muted text-muted-foreground border";
  }
};

export const humanizeSupplierStatus = (status: string) =>
  status.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export const deriveEntityLabel = (value?: string) => {
  if (!value) return undefined;
  const normalized = value.toString().trim().toUpperCase();
  switch (normalized) {
    case "MANUFACTURER":
      return "Manufacturer";
    case "WAREHOUSE":
      return "Warehouse";
    case "SUPPLIER":
      return "Supplier";
    case "CONSUMER":
      return "Consumer";
    case "DISTRIBUTOR":
      return "Distributor";
    default:
      return value;
  }
};

export const deriveRouteLabel = (shipment: SupplierShipmentRecord) => {
  const legacy = shipment as Record<string, unknown>;
  const routeType = typeof legacy.routeType === "string" ? legacy.routeType : undefined;
  if (routeType) return routeType;

  const originType = typeof legacy.fromType === "string" ? legacy.fromType : undefined;
  const destinationType = typeof legacy.toType === "string" ? legacy.toType : undefined;

  const origin =
    deriveEntityLabel(shipment.originType) ??
    deriveEntityLabel(originType) ??
    "Origin";
  const destination =
    deriveEntityLabel(shipment.destinationType) ??
    deriveEntityLabel(destinationType) ??
    "Destination";

  return `${origin} -> ${destination}`;
};

export const extractShipmentItems = (shipment: SupplierShipmentRecord) => {
  if (Array.isArray(shipment.shipmentItems) && shipment.shipmentItems.length > 0) {
    return shipment.shipmentItems;
  }
  if (Array.isArray(shipment.items) && shipment.items.length > 0) {
    return shipment.items;
  }
  return [];
};

export const resolveShipmentAreas = (shipment: SupplierShipmentRecord) => {
  const tokens = new Set<string>();
  [
    shipment.originArea,
    shipment.dropoffArea,
    shipment.destinationArea,
    shipment.pickupArea,
    shipment.area,
    ...(shipment.areaTags ?? []),
  ]
    .filter(Boolean)
    .forEach((area) => tokens.add(String(area)));
  return Array.from(tokens);
};

export const formatArrivalText = (value?: string | null) => {
  if (!value) return "Unknown ETA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown ETA";
  return formatDistanceToNow(date, { addSuffix: true });
};
