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
    productionWindow: string; // e.g. 2025-09-01T00:00:00Z/2025-09-03T23:59:59Z
    quantityProduced: string;
    releaseStatus: string; // e.g. QA_PASSED
    expiryDate: string; // YYYY-MM-DD
    handlingInstructions: string;
    requiredStartTemp: string; // e.g. "2"
    requiredEndTemp: string;   // e.g. "8"
  }) {
    const res = await api.post("/api/batches", data);
    return res.data;
  },
};
