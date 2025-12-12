import { api } from "./api";

export interface DashboardStats {
  totalProducts?: number;
  totalBatches?: number;
  totalPackages?: number;
  totalShipments?: number;
  totalSegments?: number;
  deliveredSegments?: number;
  inTransitSegments?: number;
  activeShipments?: number;
  preparingShipments?: number;
  deliveredShipments?: number;
  acceptedShipments?: number;
  unreadNotifications: number;
  criticalAlerts: number;
}

export interface RecentShipment {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  route: Array<{
    checkpoint_id: number;
    estimated_arrival_date: string;
  }>;
}

export interface RecentNotification {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  shipmentId?: string;
  segmentId?: string;
  packageId?: string;
  breachId?: string;
  metadata?: any;
}

export interface ManufacturerDashboardData {
  stats: DashboardStats;
  recentShipments: RecentShipment[];
  recentNotifications: RecentNotification[];
}

export interface SupplierDashboardData {
  stats: DashboardStats;
  recentShipments: RecentShipment[];
  recentNotifications: RecentNotification[];
}

export const dashboardService = {
  async getManufacturerDashboard(): Promise<ManufacturerDashboardData> {
    const res = await api.get("/api/dashboard/manufacturer");
    return res.data;
  },

  async getSupplierDashboard(): Promise<SupplierDashboardData> {
    const res = await api.get("/api/dashboard/supplier");
    return res.data;
  },
};
