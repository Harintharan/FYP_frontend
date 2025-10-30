import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { productRegistryService, type CreateProductRequest, type UpdateProductRequest } from "@/services/productService";
import { productCategoryService } from "@/services/productCategoryService";
import type { Product, ProductCategory } from "@/types";
import { Loader2, PlusCircle } from "lucide-react";

const emptyProductForm: CreateProductRequest = {
  productName: "",
  productCategoryId: "",
  requiredStartTemp: "",
  requiredEndTemp: "",
  handlingInstructions: "",
};

const formatDateTime = (value?: string) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export function ProductManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateProductRequest>(emptyProductForm);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<UpdateProductRequest>(emptyProductForm);

  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const { data: categories = [], isLoading: loadingCategories } = useQuery<ProductCategory[]>({
    queryKey: ["productCategories"],
    queryFn: () => productCategoryService.list(),
  });

  const {
    data: products = [],
    isLoading: loadingProducts,
    isError,
    error,
  } = useQuery<Product[]>({
    queryKey: ["products", categoryFilter],
    queryFn: () =>
      categoryFilter === "all"
        ? productRegistryService.getAllProducts()
        : productRegistryService.getAllProducts({ categoryId: categoryFilter }),
  });

  const createMutation = useMutation({
    mutationFn: () => productRegistryService.registerProduct(createForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsCreateDialogOpen(false);
      setCreateForm(emptyProductForm);
      toast({
        title: "Product created",
        description: "The product has been added to your catalogue.",
      });
    },
    onError: (err: unknown) => {
      toast({
        variant: "destructive",
        title: "Failed to create product",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: UpdateProductRequest }) =>
      productRegistryService.updateProduct(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditingProduct(null);
      toast({
        title: "Product updated",
        description: "Product details saved successfully.",
      });
    },
    onError: (err: unknown) => {
      toast({
        variant: "destructive",
        title: "Failed to update product",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    },
  });

  const filteredCategories = useMemo(() => {
    const options = categories.map((category) => ({
      value: category.id,
      label: category.name,
    }));
    return options;
  }, [categories]);

  const categoryLookup = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.name]));
  }, [categories]);

  const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createForm.productName.trim() || !createForm.productCategoryId) {
      toast({
        variant: "destructive",
        title: "Fill in required fields",
        description: "Product name and category are required.",
      });
      return;
    }
    createMutation.mutate();
  };

  const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProduct) return;
    if (!editForm.productName?.trim() || !editForm.productCategoryId) {
      toast({
        variant: "destructive",
        title: "Fill in required fields",
        description: "Product name and category are required.",
      });
      return;
    }
    updateMutation.mutate({ id: editingProduct.id, data: editForm });
  };

  const renderProducts = () => {
    if (loadingProducts) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={`product-skeleton-${index}`} className="border-border/50">
              <CardHeader>
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {(error as Error)?.message ?? "Unable to load products right now."}
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="rounded-lg border border-border/60 p-6 text-center text-sm text-muted-foreground">
          No products found for this view.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const categoryName =
            product.productCategory?.name ||
            categoryLookup.get(product.productCategoryId) ||
            "Uncategorised";
          return (
            <Card key={product.id} className="border-border/60 shadow-none">
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-2">
                  <span>{product.productName}</span>
                  <Badge variant="outline">{categoryName}</Badge>
                </CardTitle>
                {product.handlingInstructions ? (
                  <CardDescription className="line-clamp-2">{product.handlingInstructions}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <span className="text-foreground">Temperature:</span>{" "}
                  {product.requiredStartTemp && product.requiredEndTemp
                    ? `${product.requiredStartTemp} - ${product.requiredEndTemp}`
                    : "Not specified"}
                </p>
                <p>
                  <span className="text-foreground">Created:</span> {formatDateTime(product.createdAt)}
                </p>
                <p>
                  <span className="text-foreground">Updated:</span> {formatDateTime(product.updatedAt)}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewingProduct(product)}>
                  View
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingProduct(product);
                    setEditForm({
                      productName: product.productName ?? "",
                      productCategoryId: product.productCategoryId,
                      requiredStartTemp: product.requiredStartTemp ?? "",
                      requiredEndTemp: product.requiredEndTemp ?? "",
                      handlingInstructions: product.handlingInstructions ?? "",
                    });
                  }}
                >
                  Edit
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Products</h2>
          <p className="text-sm text-muted-foreground">
            Register products and keep temperature and handling requirements up to date.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Product
        </Button>
      </header>

      <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-medium">Filter</div>
        <div className="sm:w-64">
          <label htmlFor="product-category-filter" className="sr-only">
            Category filter
          </label>
          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
            disabled={loadingCategories && categories.length === 0}
          >
            <SelectTrigger id="product-category-filter">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {filteredCategories.map((category) => (
                <SelectItem value={category.value} key={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {renderProducts()}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Product</DialogTitle>
            <DialogDescription>Capture the critical handling details for your new product.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateSubmit}>
            <div className="space-y-2">
              <label htmlFor="product-name" className="text-sm font-medium">
                Product name
              </label>
              <Input
                id="product-name"
                placeholder="e.g. Comirnaty mRNA Vaccine"
                value={createForm.productName}
                onChange={(event) => setCreateForm((current) => ({ ...current, productName: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="product-category" className="text-sm font-medium">
                Category
              </label>
              <Select
                value={createForm.productCategoryId}
                onValueChange={(value) => setCreateForm((current) => ({ ...current, productCategoryId: value }))}
                required
              >
                <SelectTrigger id="product-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((category) => (
                    <SelectItem value={category.value} key={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="product-temp-start" className="text-sm font-medium">
                  Required start temperature
                </label>
                <Input
                  id="product-temp-start"
                  placeholder="-70°C"
                  value={createForm.requiredStartTemp}
                  onChange={(event) => setCreateForm((current) => ({ ...current, requiredStartTemp: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="product-temp-end" className="text-sm font-medium">
                  Required end temperature
                </label>
                <Input
                  id="product-temp-end"
                  placeholder="-60°C"
                  value={createForm.requiredEndTemp}
                  onChange={(event) => setCreateForm((current) => ({ ...current, requiredEndTemp: event.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="product-instructions" className="text-sm font-medium">
                Handling instructions
              </label>
              <Textarea
                id="product-instructions"
                placeholder="Keep frozen. Thaw at room temperature before administration."
                value={createForm.handlingInstructions}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, handlingInstructions: event.target.value }))
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create product
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingProduct)} onOpenChange={(open) => (!open ? setEditingProduct(null) : null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Adjust product details to keep information accurate.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="space-y-2">
              <label htmlFor="edit-product-name" className="text-sm font-medium">
                Product name
              </label>
              <Input
                id="edit-product-name"
                value={editForm.productName}
                onChange={(event) => setEditForm((current) => ({ ...current, productName: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-product-category" className="text-sm font-medium">
                Category
              </label>
              <Select
                value={editForm.productCategoryId ?? ""}
                onValueChange={(value) => setEditForm((current) => ({ ...current, productCategoryId: value }))}
                required
              >
                <SelectTrigger id="edit-product-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((category) => (
                    <SelectItem value={category.value} key={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="edit-product-temp-start" className="text-sm font-medium">
                  Required start temperature
                </label>
                <Input
                  id="edit-product-temp-start"
                  value={editForm.requiredStartTemp ?? ""}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, requiredStartTemp: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-product-temp-end" className="text-sm font-medium">
                  Required end temperature
                </label>
                <Input
                  id="edit-product-temp-end"
                  value={editForm.requiredEndTemp ?? ""}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, requiredEndTemp: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-product-instructions" className="text-sm font-medium">
                Handling instructions
              </label>
              <Textarea
                id="edit-product-instructions"
                value={editForm.handlingInstructions ?? ""}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, handlingInstructions: event.target.value }))
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewingProduct)} onOpenChange={(open) => (!open ? setViewingProduct(null) : null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewingProduct?.productName}</DialogTitle>
            <DialogDescription>Product details</DialogDescription>
          </DialogHeader>
          {viewingProduct ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Category</p>
                <p className="text-foreground">
                  {viewingProduct.productCategory?.name ??
                    categoryLookup.get(viewingProduct.productCategoryId) ??
                    "Uncategorised"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Temperature range</p>
                <p className="text-foreground">
                  {viewingProduct.requiredStartTemp && viewingProduct.requiredEndTemp
                    ? `${viewingProduct.requiredStartTemp} - ${viewingProduct.requiredEndTemp}`
                    : "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Handling instructions</p>
                <p className="text-foreground">
                  {viewingProduct.handlingInstructions?.trim() || "Not provided"}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="text-foreground">{formatDateTime(viewingProduct.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Updated</p>
                  <p className="text-foreground">{formatDateTime(viewingProduct.updatedAt)}</p>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
