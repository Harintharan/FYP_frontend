import { api } from "./api";

export interface SensorType {
  id: string;
  name: string;
  manufacturerId: string;
  createdAt?: string;
  updatedAt?: string | null;
}

export const sensorTypeService = {
  async list(): Promise<SensorType[]> {
    const res = await api.get<SensorType[]>("/api/sensor-types");
    return res.data;
  },

  async create(payload: { name: string }): Promise<SensorType> {
    const res = await api.post<SensorType>("/api/sensor-types", payload);
    return res.data;
  },
};
