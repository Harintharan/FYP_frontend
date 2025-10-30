import { api } from "./api";

export interface ShipmentItem {
  id: string;
  manufacturerUUID: string;
  destinationPartyUUID: string;
  status: "PREPARING" | "IN_TRANSIT" | "DELIVERED" | "ACCEPTED" | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShipmentPackagePayload {
  package_uuid: string;
}

export interface ShipmentCheckpointPayload {
  start_checkpoint_id: number | string;
  end_checkpoint_id: number | string;
  estimated_arrival_date: string;
  time_tolerance?: string;
  expected_ship_date?: string;
  segment_order: number;
  required_action?: string;
}

export interface CreateShipmentRequest {
  manufacturerUUID: string;
  destinationPartyUUID: string;
  shipmentItems: ShipmentPackagePayload[];
  checkpoints: ShipmentCheckpointPayload[];
}

export const shipmentService = {
  async create(data: CreateShipmentRequest): Promise<any> {
    const res = await api.post("/api/shipments", data);
    return res.data;
  },

  async update(id: string, data: Partial<CreateShipmentRequest>): Promise<any> {
    const res = await api.put(`/api/shipments/${id}`, data);
    return res.data;
  },

  async getIncoming(ownerUUID: string): Promise<ShipmentItem[]> {
    const res = await api.get(`/api/shipments/incoming/${ownerUUID}`);
    return res.data;
  },

  async getByManufacturer(uuid: string): Promise<any[]> {
    const config = uuid ? { params: { manufacturerUUID: uuid } } : undefined;
    const res = await api.get("/api/shipments", config);
    return res.data;
  },

  async getById(id: string | number): Promise<any> {
    const res = await api.get(`/api/shipments/${id}`);
    return res.data;
  },

  async accept(id: string): Promise<ShipmentItem> {
    const res = await api.put(`/api/shipments/${id}/accept`);
    return res.data;
  },
};
