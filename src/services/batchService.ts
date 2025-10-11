import { api } from "./api";

export const batchService = {
  async getAllBatches(uuid: string) {
    const res = await api.get(`/api/batches/manufacturer/${uuid}`);
    return res.data;
  },

  async getBatchById(id: number) {
    const res = await api.get(`/api/batches/${id}`);
    return res.data;
  },

  async createBatch(data: {
    productCategory: string;
    manufacturerUUID: string;
    facility: string;
    productionWindow: string;
    quantityProduced: string;
    releaseStatus: string;
  }) {
    const res = await api.post("/api/batches", data);
    return res.data;
  },
};
