import { api } from "./api";

export const productRegistryService = {
    // Create product in registry
    async registerProduct(data: {
        productUUID: string;
        productName: string;
        productCategory: string;
        batchLotId: number;
        requiredStorageTemp: string;
        transportRoutePlanId: string;
        handlingInstructions: string;
        expiryDate: string;
        sensorDeviceUUID: string;
        microprocessorMac: string;
        sensorTypes: string;
        qrId: string;
        wifiSSID: string;
        wifiPassword: string;
        manufacturerUUID: string;
        originFacilityAddr: string;
        status: number;
    }) {
        const res = await api.post("/api/product-registry", data);
        return res.data;
    },

    // Fetch all products
    async getAllProducts(uuid: string) {
        const res = await api.get(`/api/product-registry/manufacturer/${uuid}`);
        return res.data;
    }
};
