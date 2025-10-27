export type Role = 'MANUFACTURER' | 'DISTRIBUTOR' | 'HEALTHCARE_PROVIDER' | 'VACCINATION_CENTER' | 'COLD_STORAGE' | 'TRANSPORTER' | 'REGULATORY';

export interface UserProfile {
  id: string;
  address: `0x${string}`;
  role: Role;
  displayName?: string;
  email?: string;
  organization?: string;
  licenseNumber?: string;
  certifications?: string[];
}

// src/types/product.ts (or wherever this lives)

export type VaccineProductStatus =
  | 'PRODUCT_CREATED'
  | 'PRODUCT_READY_FOR_SHIPMENT'
  | 'PRODUCT_ALLOCATED'
  | 'PRODUCT_IN_TRANSIT'
  | 'PRODUCT_DELIVERED'
  | 'PRODUCT_RETURNED'
  | 'PRODUCT_CANCELLED';

export interface VaccineProduct {
  id: string;

  productName: string;
  productCategory: 'vaccine';           // backend returns "vaccine"
  manufacturerUUID: string;
  batchId: string;

  requiredStorageTemp: string;
  transportRoutePlanId: string;
  handlingInstructions: string;
  expiryDate: string;

  microprocessorMac: string;
  sensorTypes: string;

  wifiSSID: string;
  originFacilityAddr: string;

  status: VaccineProductStatus;
  quantity?: number;

  // blockchain / audit
  productHash: string;
  txHash: string;
  createdBy: `0x${string}`;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string | null;

  // IPFS / Pinata
  pinataCid: string;
  pinataPinnedAt: string;

  // (Optional fields your UI may use during creation; keep optional so
  // reading existing products doesn't require them.)
  sensorDeviceUUID?: string;
  qrId?: string;
  wifiPassword?: string;
}



export interface ColdChainPoint {
  ts: number;
  lat: number;
  lng: number;
  tempC: number;
  humidity?: number;
  doorOpen?: boolean;
  speed?: number;
  altitude?: number;
  facilityId?: string;
  equipmentId?: string;
  compliant: boolean;
  alertTriggered?: boolean;
}

export interface CustodyEvent {
  ts: number;
  from?: `0x${string}`;
  to: `0x${string}`;
  note?: string;
  txHash?: `0x${string}`;
  checkpoint?: string;
  location?: string;
  facilityType?: 'MANUFACTURING' | 'COLD_STORAGE' | 'DISTRIBUTION_CENTER' | 'HEALTHCARE_FACILITY' | 'VACCINATION_SITE';
  handoverDocuments?: string[];
  temperatureAtHandover?: number;
}

export interface VaccineAlert {
  id: string;
  productId: string;
  level: 'INFO' | 'WARN' | 'CRITICAL' | 'EMERGENCY';
  type: 'TEMPERATURE_BREACH' | 'EXPIRATION_WARNING' | 'COLD_CHAIN_BREAK' | 'RECALL' | 'LOW_STOCK' | 'EQUIPMENT_FAILURE';
  message: string;
  ts: number;
  acknowledged?: boolean;
  location?: string;
  actionRequired?: string;
  escalationLevel?: number;
}

export interface VaccineShipment {
  id: string;
  productIds: string[];
  from: `0x${string}`;
  to: `0x${string}`;
  status: 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'DELAYED' | 'TEMPERATURE_COMPROMISED';
  createdAt: number;
  estimatedDelivery?: number;
  actualDelivery?: number;
  route?: { lat: number; lng: number; name: string; facilityType?: string }[];
  transportMode: 'REFRIGERATED_TRUCK' | 'AIR_CARGO' | 'COURIER' | 'DRONE';
  temperatureLog: ColdChainPoint[];
  driver?: string;
  vehicleId?: string;
  emergencyContact?: string;
}

export interface TemperatureThreshold {
  min: number;
  max: number;
  unit: 'C' | 'F';
  vaccineType?: string;
  criticalMin?: number;
  criticalMax?: number;
}

export interface VaccineDashboardStats {
  totalVaccines: number;
  activeColdChains: number;
  criticalAlerts: number;
  dosesAdministeredToday: number;
  dosesExpiringSoon: number;
  temperatureCompliance: number;
  facilitiesMonitored: number;
  recallsActive: number;
}

export interface VaccinationRecord {
  id: string;
  patientId?: string;
  vaccineProductId: string;
  batchNumber: string;
  administeredBy: `0x${string}`;
  administrationDate: number;
  facilityId: string;
  doseNumber: number;
  nextDueDate?: number;
  adverseEvents?: string[];
  verified: boolean;
}

// Legacy type aliases for backward compatibility
export type ProductMeta = VaccineProduct;
export type TelemetryPoint = ColdChainPoint;
export type Alert = VaccineAlert;
export type Shipment = VaccineShipment;
export type DashboardStats = VaccineDashboardStats;
