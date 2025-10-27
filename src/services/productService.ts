// src/services/productRegistryService.ts
import { api } from "./api";
import type { VaccineProduct, VaccineProductStatus } from '@/types';

/** Payload the backend expects for product creation */
export interface CreateProductRequest {
    manufacturerUUID: string;
    productName: string;
    productCategory: string; // e.g., "IoT"
    batchId: string; // UUID string
    quantity?: number;
    microprocessorMac: string; // AA:BB:CC:DD:EE:FF
    sensorTypes: string; // temperature,humidity
    wifiSSID: string;
    wifiPassword: string;
    status: VaccineProductStatus;
}

/** Payload for updating an existing product (matches backend expectations) */
export interface UpdateProductRequest {
    manufacturerUUID?: string;
    productName?: string;
    productCategory?: string; // e.g., "IoT"
    batchId?: string; // UUID string
    requiredStorageTemp?: string;
    transportRoutePlanId?: string;
    handlingInstructions?: string;
    expiryDate?: string; // YYYY-MM-DD
    sensorDeviceUUID?: string;
    microprocessorMac?: string; // AA:BB:CC:DD:EE:FF
    sensorTypes?: string; // temperature,humidity,gps
    qrId?: string;
    wifiSSID?: string;
    wifiPassword?: string;
    originFacilityAddr?: string;
    status?: VaccineProductStatus;
    quantity?: number;
}

/** Service methods for product registry */
export const productRegistryService = {
    /**
     * Create a new vaccine product in the backend registry
     */
    async registerProduct(
        data: CreateProductRequest
    ): Promise<VaccineProduct> {
        const res = await api.post("/api/product-registry", data);
        return res.data;
    },

    /**
     * Fetch all products registered under a manufacturer UUID
     */
    async getAllProducts(uuid: string): Promise<VaccineProduct[]> {
        const res = await api.get(`/api/product-registry/manufacturer/${uuid}`);
        return res.data;
    },

    /** Fetch a single product by its id */
    async getProductById(id: string): Promise<VaccineProduct> {
        const res = await api.get(`/api/product-registry/${id}`);
        return res.data;
    },

    /** Update an existing product */
    async updateProduct(id: string, data: UpdateProductRequest): Promise<VaccineProduct> {
        const res = await api.put(`/api/product-registry/${id}`, data);
        return res.data;
    },
};
