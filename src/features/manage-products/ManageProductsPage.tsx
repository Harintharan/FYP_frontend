import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store";
import { useSearchParams } from "react-router-dom";
import { PackageManagement } from "./packages/PackageManagement";
import { BatchManagement } from "./batches/BatchManagement";
import { ProductManagement } from "./products/ProductManagement";
import { CategoryManagement } from "./categories/CategoryManagement";

const tabOrder = ["packages", "batches", "products", "categories"] as const;

const tabLabels: Record<(typeof tabOrder)[number], string> = {
  packages: "Packages",
  batches: "Batches",
  products: "Products",
  categories: "Categories",
};

export function ManageProductsPage() {
  const { role } = useAppStore();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const defaultTab =
    role === "ADMIN"
      ? "categories"
      : (tabFromUrl as (typeof tabOrder)[number]) || "packages";
  const [currentTab, setCurrentTab] =
    useState<(typeof tabOrder)[number]>(defaultTab);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    const newTab =
      role === "ADMIN" && !tabFromUrl
        ? "categories"
        : (tabFromUrl as (typeof tabOrder)[number]) || "packages";
    setCurrentTab(newTab);
  }, [searchParams, role]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Manage Products</h1>
        <p className="text-sm text-muted-foreground">
          Orchestrate categories, products, batches, and packages from a single workspace.
        </p>
      </header> */}

      <Tabs
        value={currentTab}
        onValueChange={(value) =>
          setCurrentTab(value as (typeof tabOrder)[number])
        }
      >
        {/* <TabsList className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
          {tabOrder.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {tabLabels[tab]}
            </TabsTrigger>
          ))}
        </TabsList> */}

        <TabsContent
          value="packages"
          className="mt-4 sm:mt-6 focus-visible:outline-none focus-visible:ring-0"
        >
          <PackageManagement />
        </TabsContent>
        <TabsContent
          value="batches"
          className="mt-4 sm:mt-6 focus-visible:outline-none focus-visible:ring-0"
        >
          <BatchManagement />
        </TabsContent>
        <TabsContent
          value="products"
          className="mt-4 sm:mt-6 focus-visible:outline-none focus-visible:ring-0"
        >
          <ProductManagement />
        </TabsContent>
        <TabsContent
          value="categories"
          className="mt-4 sm:mt-6 focus-visible:outline-none focus-visible:ring-0"
        >
          <CategoryManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ManageProductsPage;
