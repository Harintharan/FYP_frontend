import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { productRegistryService } from "@/services/productService";
import { productCategoryService } from "@/services/productCategoryService";
import type { Product, ProductCategory } from "@/types";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { useAppToast } from "@/hooks/useAppToast";

const filterBySearch = (products: Product[], term: string) => {
  const query = term.toLowerCase();
  if (!query) return products;

  return products.filter((product) => {
    const categoryName =
      product.productCategory?.name ?? product.productCategoryName ?? "";
    return (
      product.productName.toLowerCase().includes(query) ||
      categoryName.toLowerCase().includes(query)
    );
  });
};

export default function Products() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess } = useAppToast();
  const { user } = useAppStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data: categories = [], isLoading: loadingCategories } = useQuery<
    ProductCategory[]
  >({
    queryKey: ["productCategories"],
    queryFn: () => productCategoryService.list(),
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery<
    Product[]
  >({
    queryKey: ["products", categoryFilter],
    queryFn: () =>
      productRegistryService.getAllProducts(
        categoryFilter ? { categoryId: categoryFilter } : undefined
      ),
  });

  const categoryLookup = useMemo(
    () =>
      categories.reduce<Record<string, string>>((acc, category) => {
        acc[category.id] = category.name;
        return acc;
      }, {}),
    [categories]
  );

  const filteredProducts = useMemo(
    () => filterBySearch(products, searchTerm.trim()),
    [products, searchTerm]
  );

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["products"] }),
      queryClient.invalidateQueries({ queryKey: ["productCategories"] }),
    ]);
    showSuccess("Product list refreshed");
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value === "ALL" ? "" : value);
  };

  const categorySelectValue = categoryFilter || "ALL";

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10 space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Products</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Browse registered products, filter by category, and review
              handling requirements.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="sm:size-default" onClick={handleRefresh}>
              Refresh
            </Button>
            {user?.role === "MANUFACTURER" && (
              <Button
                size="sm"
                className="gap-2 sm:size-default"
                onClick={() => navigate("/products/create")}
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Create Product</span>
                <span className="sm:hidden">Create</span>
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader className="p-3 sm:p-4 lg:p-6 pb-2">
            <CardTitle className="text-sm sm:text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 grid gap-3 sm:gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="text-xs sm:text-sm font-medium">Search</label>
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by product name or category..."
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium">Category</label>
              {loadingCategories ? (
                <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                <Select
                  value={categorySelectValue}
                  onValueChange={handleCategoryFilterChange}
                >
                  <SelectTrigger className="mt-1 text-sm">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {loadingProducts ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-8 sm:py-12 text-xs sm:text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading products...
            </CardContent>
          </Card>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="py-8 sm:py-12 text-center text-xs sm:text-sm text-muted-foreground">
              {products.length === 0
                ? "No products found. Create your first product to get started."
                : "No products match your filters."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="border border-border/60">
                <CardHeader className="p-3 sm:p-4 pb-2">
                  <CardTitle className="text-sm sm:text-base lg:text-lg line-clamp-1">
                    {product.productName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0 space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <div>
                    <p className="text-muted-foreground text-[10px] sm:text-xs uppercase">
                      Category
                    </p>
                    <p className="font-medium truncate">
                      {product.productCategory?.name ??
                        product.productCategoryName ??
                        categoryLookup[product.productCategoryId] ??
                        "-"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-muted-foreground text-[10px] sm:text-xs uppercase">
                        Start Temp
                      </p>
                      <p className="font-medium">
                        {product.requiredStartTemp ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px] sm:text-xs uppercase">
                        End Temp
                      </p>
                      <p className="font-medium">
                        {product.requiredEndTemp ?? "-"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] sm:text-xs uppercase">
                      Handling Instructions
                    </p>
                    <p className="font-medium whitespace-pre-wrap line-clamp-2 sm:line-clamp-3">
                      {product.handlingInstructions ?? "-"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
