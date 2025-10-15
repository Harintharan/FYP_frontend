import { api } from './api';

export interface Checkpoint {
  id: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  state?: string;
  country?: string;
  ownerUUID: string;
  ownerType: 'WAREHOUSE' | 'MANUFACTURER' | 'DISTRIBUTOR' | string;
  checkpointType: 'WAREHOUSE' | 'COLD_STORAGE' | 'PORT' | 'CUSTOMS' | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCheckpointRequest {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  state?: string;
  country?: string;
  ownerUUID: string;
  ownerType: string; // e.g., 'WAREHOUSE'
  checkpointType: string; // e.g., 'WAREHOUSE'
}

export const checkpointService = {
  async getAll(): Promise<Checkpoint[]> {
    const res = await api.get('/api/checkpoints');
    return res.data;
  },
  async getByOwner(ownerUUID: string): Promise<Checkpoint[]> {
    const res = await api.get(`/api/checkpoints/owner/${ownerUUID}`);
    return res.data;
  },

  async getById(id: string): Promise<Checkpoint> {
    const res = await api.get(`/api/checkpoints/${id}`);
    return res.data;
  },

  async create(data: CreateCheckpointRequest): Promise<Checkpoint> {
    const res = await api.post('/api/checkpoints', data);
    return res.data;
  },
};
