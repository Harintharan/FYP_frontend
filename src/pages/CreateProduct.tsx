import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { batchService, type BatchPayload } from "@/services/batchService";
import { productRegistryService } from "@/services/productService";
import type { UpdateProductRequest } from "@/services/productService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Pencil, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import type { VaccineProductStatus } from "@/types";

// ðŸ”¹ Utility â€” Simple ISO Date Validator
const isValidISODate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);

export default function CreateProduct() {
  const queryClient = useQueryClient();
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const { uuid } = useAppStore();
  const statusOptions: VaccineProductStatus[] = [
    "PRODUCT_CREATED",
    "PRODUCT_READY_FOR_SHIPMENT",
    "PRODUCT_ALLOCATED",
    "PRODUCT_IN_TRANSIT",
    "PRODUCT_DELIVERED",
    "PRODUCT_RETURNED",
    "PRODUCT_CANCELLED",
  ];

  const createEmptyBatchForm = (manufacturerId: string | undefined) => ({
    productCategory: "",
    manufacturerUUID: manufacturerId ?? "",
    facility: "",
    productionStart: "",
    productionEnd: "",
    quantityProduced: "",
    releaseStatus: "",
    expiryDate: "",
    handlingInstructions: "",
    requiredStartTemp: "",
    requiredEndTemp: "",
  });

  const createEmptyProductForm = (manufacturerId: string | undefined) => ({
    manufacturerUUID: manufacturerId ?? "",
    productCategory: "IoT",
    productName: "",
    quantity: "",
    microprocessorMac: "",
    sensorTypes: "",
    wifiSSID: "",
    wifiPassword: "",
    status: "PRODUCT_READY_FOR_SHIPMENT",
    requiredStorageTemp: "",
    handlingInstructions: "",
    expiryDate: "",
    originFacilityAddr: "",
    transportRoutePlanId: "",
    qrId: "",
    sensorDeviceUUID: "",
  });

  const [batchForm, setBatchForm] = useState(() => createEmptyBatchForm(uuid));
  const [productForm, setProductForm] = useState(() =>
    createEmptyProductForm(uuid)
  );

  useEffect(() => {
    if (!editingBatchId) {
      setBatchForm((prev) => ({
        ...prev,
        manufacturerUUID: uuid ?? "",
      }));
    }
  }, [uuid, editingBatchId]);

  const isEditingBatch = Boolean(editingBatchId);
  const isEditingProduct = Boolean(editingProductId);

  useEffect(() => {
    if (!editingProductId) {
      setProductForm((prev) => ({
        ...prev,
        manufacturerUUID: uuid ?? "",
      }));
    }
  }, [uuid, editingProductId]);


  // ============================
  // ðŸ”¹ Fetch Data
  // ============================
  const { data: batches, isLoading: loadingBatches } = useQuery({
    queryKey: ["batches"],
    queryFn: () => batchService.getAllBatches(uuid),
  });

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: () => {
      return productRegistryService.getAllProducts(uuid);
    },
  });

  // ============================
  // ðŸ”¹ Mutations
  // ============================
  const createBatchMutation = useMutation({
    mutationFn: (payload: BatchPayload) => batchService.createBatch(payload),
    onSuccess: () => {
      toast.success("Batch created successfully!");
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      setBatchForm(createEmptyBatchForm(uuid));
      setEditingBatchId(null);
      setIsBatchDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to create batch");
    },
  });

  const updateBatchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BatchPayload }) =>
      batchService.updateBatch(id, data),
    onSuccess: () => {
      toast.success("Batch updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      setBatchForm(createEmptyBatchForm(uuid));
      setEditingBatchId(null);
      setIsBatchDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update batch");
    },
  });

  const isSubmittingBatch =
    createBatchMutation.isPending || updateBatchMutation.isPending;

  const createProductMutation = useMutation({
    mutationFn: productRegistryService.registerProduct,
    onSuccess: () => {
      toast.success("Product created successfully!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setProductForm(createEmptyProductForm(uuid));
      setSelectedBatch("");
      setEditingProductId(null);
      setIsProductDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to create product");
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProductRequest;
    }) => productRegistryService.updateProduct(id, data),
    onSuccess: () => {
      toast.success("Product updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setProductForm(createEmptyProductForm(uuid));
      setSelectedBatch("");
      setEditingProductId(null);
      setIsProductDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update product");
    },
  });

  const isSubmittingProduct =
    createProductMutation.isPending || updateProductMutation.isPending;

  // ============================
  // ðŸ”¹ Input Handlers
  // ============================
  const handleBatchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setBatchForm({ ...batchForm, [e.target.name]: e.target.value });

  const formatDatePart = (value: string | null | undefined) => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    return trimmed.includes("T") ? trimmed.split("T")[0] : trimmed;
  };

  const safeString = (value: unknown) =>
    value === null || value === undefined ? "" : String(value);

  const handleOpenNewBatch = () => {
    setEditingBatchId(null);
    setBatchForm(createEmptyBatchForm(uuid));
    setIsBatchDialogOpen(true);
  };

  const handleOpenNewProduct = () => {
    setEditingProductId(null);
    setProductForm(createEmptyProductForm(uuid));
    setSelectedBatch("");
    setIsProductDialogOpen(true);
  };

  const handleEditBatch = (batch: any) => {
    if (!batch) return;

    const productionWindowValue =
      typeof batch.productionWindow === "string" ? batch.productionWindow : "";
    const [windowStartRaw, windowEndRaw] = productionWindowValue.split("/");
    const productionStart =
      formatDatePart(windowStartRaw) ||
      formatDatePart(batch.productionStart) ||
      "";
    const productionEnd =
      formatDatePart(windowEndRaw) ||
      formatDatePart(batch.productionEnd) ||
      "";

    const manufacturerId =
      batch.manufacturerUUID ??
      batchForm.manufacturerUUID ??
      uuid ??
      "";

    setEditingBatchId(String(batch.id));
    setBatchForm({
      productCategory: safeString(batch.productCategory),
      manufacturerUUID: safeString(manufacturerId),
      facility: safeString(batch.facility),
      productionStart,
      productionEnd,
      quantityProduced: safeString(batch.quantityProduced),
      releaseStatus: safeString(batch.releaseStatus),
      expiryDate:
        formatDatePart(batch.expiryDate) || safeString(batch.expiryDate),
      handlingInstructions: safeString(batch.handlingInstructions),
      requiredStartTemp: safeString(batch.requiredStartTemp),
      requiredEndTemp: safeString(batch.requiredEndTemp),
    });
    setIsBatchDialogOpen(true);
  };

  const handleEditProduct = (product: any) => {
    if (!product) return;

    const batchId =
      product.batchId ?? product.batchUUID ?? product.batch_id ?? "";

    const rawStatus = safeString(product.status) as VaccineProductStatus;
    const normalizedStatus = statusOptions.includes(rawStatus)
      ? rawStatus
      : "PRODUCT_CREATED";

    setEditingProductId(String(product.id ?? product.productUUID ?? batchId));
    setSelectedBatch(batchId ? String(batchId) : "");
    setProductForm({
      manufacturerUUID:
        safeString(product.manufacturerUUID) || (uuid ?? ""),
      productCategory: safeString(product.productCategory) || "IoT",
      productName: safeString(product.productName),
      quantity: safeString(product.quantity),
      microprocessorMac: safeString(product.microprocessorMac),
      sensorTypes: safeString(product.sensorTypes),
      wifiSSID: safeString(product.wifiSSID),
      wifiPassword: safeString(product.wifiPassword),
      status: normalizedStatus,
      requiredStorageTemp: safeString(product.requiredStorageTemp),
      handlingInstructions: safeString(product.handlingInstructions),
      expiryDate: formatDatePart(product.expiryDate),
      originFacilityAddr: safeString(product.originFacilityAddr),
      transportRoutePlanId: safeString(product.transportRoutePlanId),
      qrId: safeString(product.qrId),
      sensorDeviceUUID: safeString(product.sensorDeviceUUID),
    });
    setIsProductDialogOpen(true);
  };

  const handleProductChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setProductForm({ ...productForm, [e.target.name]: e.target.value });

  // ============================
  // ðŸ”¹ Validations
  // ============================
  const validateBatchForm = () => {
    const {
      productCategory,
      facility,
      productionStart,
      productionEnd,
      quantityProduced,
      releaseStatus,
      expiryDate,
      handlingInstructions,
      requiredStartTemp,
      requiredEndTemp,
    } = batchForm;

    if (!productCategory.trim()) return "Product category is required.";
    if (!facility.trim()) return "Facility name is required.";
    if (!productionStart || !isValidISODate(productionStart))
      return "Production start date is required (YYYY-MM-DD).";
    if (!productionEnd || !isValidISODate(productionEnd))
      return "Production end date is required (YYYY-MM-DD).";

    const start = new Date(productionStart);
    const end = new Date(productionEnd);
    if (start > end)
      return "Production start date must be before or equal to end date.";

    if (!quantityProduced.trim() || isNaN(Number(quantityProduced)))
      return "Quantity produced must be a valid number.";

    if (!releaseStatus.trim())
      return "Release status is required (e.g., QA_PASSED).";

    if (!expiryDate.trim() || !isValidISODate(expiryDate))
      return "Expiry date must be YYYY-MM-DD.";

    if (!handlingInstructions.trim())
      return "Handling instructions are required.";

    if (!requiredStartTemp.trim() || isNaN(Number(requiredStartTemp)))
      return "Required start temperature must be a number.";
    if (!requiredEndTemp.trim() || isNaN(Number(requiredEndTemp)))
      return "Required end temperature must be a number.";
    if (Number(requiredStartTemp) > Number(requiredEndTemp))
      return "Start temperature cannot exceed end temperature.";

    return null;
  };

  const validateProductForm = () => {
    const f = productForm;

    if (!selectedBatch) return "Select a batch first.";
    if (!f.productCategory.trim()) return "Product category is required.";
    if (!f.productName.trim()) return "Product name is required.";
    if (!f.quantity.trim() || Number.isNaN(Number(f.quantity)))
      return "Quantity is required (numeric).";
    if (Number(f.quantity) <= 0)
      return "Quantity must be greater than zero.";
    if (!/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(f.microprocessorMac.trim())) return "Microprocessor MAC must be in format 00:1A:2B:3C:4D:5E.";
    if (!f.sensorTypes.trim()) return "Sensor types (e.g., temperature,humidity) required.";
    if (!f.wifiSSID.trim()) return "Wi-Fi SSID is required.";
    if (!f.wifiPassword.trim()) return "Wi-Fi Password is required.";
    if (!f.status) return "Status is required.";
    if (!statusOptions.includes(f.status as VaccineProductStatus))
      return "Select a valid status.";

    return null;
  };


  // ============================
  // ðŸ”¹ Form Submit Handlers
  // ============================
  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateBatchForm();
    if (error) return toast.error(error);

    const productionWindow = `${batchForm.productionStart}T00:00:00Z/${batchForm.productionEnd}T23:59:59Z`;

    const payload: BatchPayload = {
      productCategory: batchForm.productCategory.trim(),
      manufacturerUUID:
        batchForm.manufacturerUUID.trim() || (uuid ? uuid.trim() : ""),
      facility: batchForm.facility.trim(),
      productionWindow, // ISO interval
      quantityProduced: batchForm.quantityProduced.trim(),
      releaseStatus: batchForm.releaseStatus.trim(),
      expiryDate: batchForm.expiryDate.trim(),
      handlingInstructions: batchForm.handlingInstructions.trim(),
      requiredStartTemp: batchForm.requiredStartTemp.trim(),
      requiredEndTemp: batchForm.requiredEndTemp.trim(),
    };

    if (editingBatchId) {
      updateBatchMutation.mutate({ id: editingBatchId, data: payload });
    } else {
      createBatchMutation.mutate(payload);
    }
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateProductForm();
    if (error) return toast.error(error);

    const manufacturerId =
      productForm.manufacturerUUID.trim() || (uuid ? uuid.trim() : "");

    const selectedStatus = statusOptions.includes(
      productForm.status as VaccineProductStatus
    )
      ? (productForm.status as VaccineProductStatus)
      : "PRODUCT_CREATED";

    const quantityValue = Number(productForm.quantity);

    const payload = {
      manufacturerUUID: manufacturerId,
      productName: productForm.productName.trim(),
      productCategory: productForm.productCategory.trim(),
      batchId: selectedBatch,
      quantity: Number.isFinite(quantityValue) ? quantityValue : undefined,
      microprocessorMac: productForm.microprocessorMac.trim().toUpperCase(),
      sensorTypes: productForm.sensorTypes.trim(),
      wifiSSID: productForm.wifiSSID.trim(),
      wifiPassword: productForm.wifiPassword.trim(),
      status: selectedStatus,
    };

    if (editingProductId) {
      updateProductMutation.mutate({ id: editingProductId, data: payload });
    } else {
      createProductMutation.mutate(payload);
    }
  };


  // ============================
  // ðŸ”¹ UI
  // ============================
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Manage Products & Batches</h1>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
        </TabsList>

        {/* ðŸ§¾ Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div className="flex flex-col justify-center mr-auto">
                <CardTitle>All Products</CardTitle>
                <CardDescription>
                  Manage vaccine product registry
                </CardDescription>
              </div>

              {/* âž• Create Product Button */}
              <Dialog
                open={isProductDialogOpen}
                onOpenChange={(open) => {
                  setIsProductDialogOpen(open);
                  if (!open) {
                    setEditingProductId(null);
                    setProductForm(createEmptyProductForm(uuid));
                    setSelectedBatch("");
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button className="ml-auto" onClick={handleOpenNewProduct}>
                    <Plus className="w-4 h-4 mr-1" /> Create Product
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col mx-auto p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                      {isEditingProduct ? "Edit Product" : "Create New Product"}
                    </DialogTitle>
                    <DialogDescription>
                      {isEditingProduct
                        ? "Update product registration details."
                        : "Link a new product to an existing batch."}
                    </DialogDescription>
                  </DialogHeader>

                  <form
                    onSubmit={handleProductSubmit}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 overflow-y-auto p-5"
                  >
                    {/* ðŸ§© Left Column */}
                    <div className="space-y-3 ">
                      <div>
                        <label
                          htmlFor="select-batch"
                          className="font-medium text-sm mb-1 block"
                        >
                          Select Batch
                        </label>
                        <Select
                          value={selectedBatch}
                          onValueChange={(v) => setSelectedBatch(v)}
                        >
                          <SelectTrigger
                            id="select-batch"
                            aria-label="Select Batch"
                          >
                            <SelectValue placeholder="Choose batch" />
                          </SelectTrigger>
                          <SelectContent>
                            {batches?.map((b: any) => (
                              <SelectItem key={b.id} value={b.id.toString()}>
                                {b.facility} - {b.productionWindow}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label
                          htmlFor="productName"
                          className="font-medium text-sm mb-1 block"
                        >
                          Product Name
                        </label>
                        <Input
                          id="productName"
                          name="productName"
                          placeholder="Pfizer Vaccine"
                          value={productForm.productName}
                          onChange={handleProductChange}
                        />
                      </div>

                      <div>
                        <label htmlFor="productCategory" className="font-medium text-sm mb-1 block">
                          Product Category
                        </label>
                        <Input
                          id="productCategory"
                          name="productCategory"
                          placeholder="IoT"
                          value={productForm.productCategory}
                          onChange={handleProductChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="quantity" className="font-medium text-sm mb-1 block">
                          Quantity
                        </label>
                        <Input
                          id="quantity"
                          name="quantity"
                          type="number"
                          min="1"
                          placeholder="25"
                          value={productForm.quantity}
                          onChange={handleProductChange}
                        />
                      </div>

                      <div className="hidden">
                        <label
                          htmlFor="requiredStorageTemp"
                          className="font-medium text-sm mb-1 block"
                        >
                          Required Storage Temperature
                        </label>
                        <Input
                          id="requiredStorageTemp"
                          name="requiredStorageTemp"
                          placeholder="2â€“8Â°C"
                          value={productForm.requiredStorageTemp}
                          onChange={handleProductChange}
                        />
                      </div>

                      <div className="hidden">
                        <label
                          htmlFor="expiryDate"
                          className="font-medium text-sm mb-1 block"
                        >
                          Expiry Date
                        </label>
                        <Input
                          id="expiryDate"
                          name="expiryDate"
                          type="date"
                          value={productForm.expiryDate}
                          onChange={handleProductChange}
                        />
                      </div>

                      {/* <div>
                        <label
                          htmlFor="sensorDeviceUUID"
                          className="font-medium text-sm mb-1 block"
                        >
                          Sensor Device UUID
                        </label>
                        <Input
                          id="sensorDeviceUUID"
                          name="sensorDeviceUUID"
                          placeholder="SENSOR-1001"
                          value={productForm.sensorDeviceUUID}
                          onChange={handleProductChange}
                        />
                      </div> */}

                      <div>
                        <label
                          htmlFor="microprocessorMac"
                          className="font-medium text-sm mb-1 block"
                        >
                          Microprocessor MAC Address
                        </label>
                        <Input
                          id="microprocessorMac"
                          name="microprocessorMac"
                          placeholder="00:1A:2B:3C:4D:5E"
                          value={productForm.microprocessorMac}
                          onChange={handleProductChange}
                        />
                      </div>
                      <div className="hidden">
                        <label htmlFor="transportRoutePlanId" className="font-medium text-sm mb-1 block">
                          Transport Route Plan ID
                        </label>
                        <Input
                          id="transportRoutePlanId"
                          name="transportRoutePlanId"
                          placeholder="route-plan-2025-05"
                          value={productForm.transportRoutePlanId}
                          onChange={handleProductChange}
                        />
                      </div>

                      <div>
                        <label htmlFor="status" className="font-medium text-sm mb-1 block">
                          Status
                        </label>
                        <Select
                          value={productForm.status}
                          onValueChange={(v) =>
                            setProductForm((f) => ({ ...f, status: v }))
                          }
                        >
                          <SelectTrigger id="status" aria-label="Status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                    </div>

                    {/* ðŸ§© Right Column */}
                    <div className="space-y-3">
                      <div className="hidden">
                        <label
                          htmlFor="handlingInstructions"
                          className="font-medium text-sm mb-1 block"
                        >
                          Handling Instructions
                        </label>
                        <Textarea
                          id="handlingInstructions"
                          name="handlingInstructions"
                          placeholder="Handle with care. Do not freeze."
                          value={productForm.handlingInstructions}
                          onChange={handleProductChange}
                          className="h-[100px]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="sensorTypes"
                          className="font-medium text-sm mb-1 block"
                        >
                          Sensor Types
                        </label>
                        <Input
                          id="sensorTypes"
                          name="sensorTypes"
                          placeholder="GPS, Temperature"
                          value={productForm.sensorTypes}
                          onChange={handleProductChange}
                        />
                      </div>

                      {/* <div>
                        <label
                          htmlFor="qrId"
                          className="font-medium text-sm mb-1 block"
                        >
                          QR ID
                        </label>
                        <Input
                          id="qrId"
                          name="qrId"
                          placeholder="QR-12345"
                          value={productForm.qrId}
                          onChange={handleProductChange}
                        />
                      </div> */}

                      <div>
                        <label
                          htmlFor="wifiSSID"
                          className="font-medium text-sm mb-1 block"
                        >
                          Wi-Fi SSID
                        </label>
                        <Input
                          id="wifiSSID"
                          name="wifiSSID"
                          placeholder="PfizerNet"
                          value={productForm.wifiSSID}
                          onChange={handleProductChange}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="wifiPassword"
                          className="font-medium text-sm mb-1 block"
                        >
                          Wi-Fi Password
                        </label>
                        <Input
                          id="wifiPassword"
                          name="wifiPassword"
                          placeholder="securepass123"
                          value={productForm.wifiPassword}
                          onChange={handleProductChange}
                        />
                      </div>

                      <div className="hidden">
                        <label
                          htmlFor="originFacilityAddr"
                          className="font-medium text-sm mb-1 block"
                        >
                          Origin Facility Address
                        </label>
                        <Input
                          id="originFacilityAddr"
                          name="originFacilityAddr"
                          placeholder="Pfizer Lab NY - Line 1"
                          value={productForm.originFacilityAddr}
                          onChange={handleProductChange}
                        />
                      </div>
                    </div>

                    {/* ðŸ§­ Full-width submit button */}
                    <div className="md:col-span-2 pt-2">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmittingProduct}
                      >
                        {isSubmittingProduct ? (
                          <>
                            <Loader2 className="animate-spin w-4 h-4 mr-2" />{" "}
                            {isEditingProduct ? "Updating..." : "Creating..."}
                          </>
                        ) : isEditingProduct ? (
                          "Update Product"
                        ) : (
                          "Create Product"
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              {loadingProducts ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="animate-spin w-6 h-6" />
                </div>
              ) : products?.length === 0 ? (
                <p className="text-muted-foreground">No products found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-2 border text-left">Product UUID</th>
                        <th className="p-2 border text-left">Name</th>
                        <th className="p-2 border text-left">Category</th>
                        <th className="p-2 border text-left">Batch ID</th>
                        <th className="p-2 border text-left">Status</th>
                        <th className="p-2 border text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products?.map((p: any) => (
                        <tr key={p.productUUID ?? p.id} className="hover:bg-muted/30">
                          <td className="p-2 border">{p.id ?? p.productUUID}</td>
                          <td className="p-2 border">{p.productName}</td>
                          <td className="p-2 border">{p.productCategory}</td>
                          <td className="p-2 border">{p.batchId ?? p.batchUUID}</td>
                          <td className="p-2 border">{p.status}</td>
                          <td className="p-2 border">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => handleEditProduct(p)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ðŸ§± Batches Tab */}
        <TabsContent value="batches">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div className="flex flex-col justify-center mr-auto">
                <CardTitle>All Batches</CardTitle>
                <CardDescription>Manage all production batches</CardDescription>
              </div>

              {/* âž• Create Batch Button */}
              <Dialog
                open={isBatchDialogOpen}
                onOpenChange={(open) => {
                  setIsBatchDialogOpen(open);
                  if (!open) {
                    setEditingBatchId(null);
                    setBatchForm(createEmptyBatchForm(uuid));
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button className="ml-auto" onClick={handleOpenNewBatch}>
                    <Plus className="w-4 h-4 mr-1" /> Create Batch
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col mx-auto p-6">
                  <DialogHeader>
                    <DialogTitle>
                      {isEditingBatch ? "Edit Batch" : "Create New Batch"}
                    </DialogTitle>
                    <DialogDescription>
                      {isEditingBatch
                        ? "Update the batch details and save your changes."
                        : "Fill in details to create a new batch."}
                    </DialogDescription>
                  </DialogHeader>

                  <form
                    onSubmit={handleBatchSubmit}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 overflow-y-auto p-5"
                  >
                    <div className="md:col-span-2">
                      <label htmlFor="productCategory" className="font-medium text-sm mb-1 block">
                        Product Category
                      </label>
                      <Input
                        id="productCategory"
                        name="productCategory"
                        placeholder="COVID Test Kits"
                        value={batchForm.productCategory}
                        onChange={handleBatchChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="facility"
                        className="font-medium text-sm mb-1 block"
                      >
                        Facility Name
                      </label>
                      <Input
                        id="facility"
                        name="facility"
                        placeholder="Pfizer Lab NY - Line 1"
                        value={batchForm.facility}
                        onChange={handleBatchChange}
                      />
                    </div>

                    {/* Production Window: start + end date pickers (will be sent as ISO interval) */}
                    <div className="md:col-span-2">
                      <label className="font-medium text-sm mb-1 block">
                        Production Window
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          id="productionStart"
                          name="productionStart"
                          type="date"
                          value={batchForm.productionStart}
                          onChange={handleBatchChange}
                          aria-label="Production start date"
                          placeholder="YYYY-MM-DD"
                        />
                        <Input
                          id="productionEnd"
                          name="productionEnd"
                          type="date"
                          value={batchForm.productionEnd}
                          onChange={handleBatchChange}
                          aria-label="Production end date"
                          placeholder="YYYY-MM-DD"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="quantityProduced" className="font-medium text-sm mb-1 block">
                        Quantity Produced
                      </label>
                      <Input
                        id="quantityProduced"
                        name="quantityProduced"
                        placeholder="5000"
                        value={batchForm.quantityProduced}
                        onChange={handleBatchChange}
                      />
                    </div>

                    <div>
                      <label htmlFor="releaseStatus" className="font-medium text-sm mb-1 block">
                        Release Status
                      </label>
                      <Input
                        id="releaseStatus"
                        name="releaseStatus"
                        placeholder="QA_PASSED"
                        value={batchForm.releaseStatus}
                        onChange={handleBatchChange}
                      />
                    </div>

                    <div>
                      <label htmlFor="expiryDate" className="font-medium text-sm mb-1 block">
                        Batch Expiry Date
                      </label>
                      <Input
                        id="expiryDate"
                        name="expiryDate"
                        type="date"
                        value={batchForm.expiryDate}
                        onChange={handleBatchChange}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="handlingInstructions" className="font-medium text-sm mb-1 block">
                        Handling Instructions
                      </label>
                      <Textarea
                        id="handlingInstructions"
                        name="handlingInstructions"
                        placeholder="Keep upright; avoid direct sunlight"
                        value={batchForm.handlingInstructions}
                        onChange={(e) => setBatchForm({ ...batchForm, handlingInstructions: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="font-medium text-sm mb-1 block">Required Temperature Range (Â°C)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          id="requiredStartTemp"
                          name="requiredStartTemp"
                          type="number"
                          placeholder="2"
                          value={batchForm.requiredStartTemp}
                          onChange={handleBatchChange}
                        />
                        <Input
                          id="requiredEndTemp"
                          name="requiredEndTemp"
                          type="number"
                          placeholder="8"
                          value={batchForm.requiredEndTemp}
                          onChange={handleBatchChange}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 pt-2">
                      <Button
                        type="submit"
                        disabled={isSubmittingBatch}
                        className="w-full"
                      >
                        {isSubmittingBatch ? (
                          <>
                            <Loader2 className="animate-spin w-4 h-4 mr-2" />
                            {isEditingBatch ? "Updating..." : "Creating..."}
                          </>
                        ) : isEditingBatch ? (
                          "Update Batch"
                        ) : (
                          "Create Batch"
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              {loadingBatches ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="animate-spin w-6 h-6" />
                </div>
              ) : batches?.length === 0 ? (
                <p className="text-muted-foreground">No batches found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-2 border text-left">ID</th>
                        <th className="p-2 border text-left">Facility</th>
                        <th className="p-2 border text-left">Quantity</th>
                        <th className="p-2 border text-left">
                          Production Window
                        </th>
                        <th className="p-2 border text-left">Release Status</th>
                        <th className="p-2 border text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches?.map((b: any) => (
                        <tr key={b.id} className="hover:bg-muted/30">
                          <td className="p-2 border">{b.id}</td>
                          <td className="p-2 border">{b.facility}</td>
                      <td className="p-2 border">{b.quantityProduced}</td>
                      <td className="p-2 border">{b.productionWindow}</td>
                      <td className="p-2 border">{b.releaseStatus}</td>
                      <td className="p-2 border">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => handleEditBatch(b)}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}






