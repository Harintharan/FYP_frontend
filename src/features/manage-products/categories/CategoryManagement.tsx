import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { productCategoryService } from "@/services/productCategoryService";
import type { ProductCategory } from "@/types";
import { Loader2, PlusCircle } from "lucide-react";
import { useAppToast } from "@/hooks/useAppToast";

type CategoryFormState = {
  name: string;
};

const emptyForm: CategoryFormState = {
  name: "",
};

const formatDateTime = (value?: string) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatDetailedDateTime = (value?: string) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const datePart = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} - ${timePart}`;
};

export function CategoryManagement() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useAppToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CategoryFormState>(emptyForm);

  const [editingCategory, setEditingCategory] =
    useState<ProductCategory | null>(null);
  const [editForm, setEditForm] = useState<CategoryFormState>(emptyForm);

  const [viewingCategory, setViewingCategory] =
    useState<ProductCategory | null>(null);
  const [categorySearch, setCategorySearch] = useState("");

  const {
    data: categories = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["productCategories"],
    queryFn: () => productCategoryService.list(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      productCategoryService.create({ name: createForm.name.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productCategories"] });
      setCreateForm(emptyForm);
      setIsCreateDialogOpen(false);
      showSuccess("Category created");
    },
    onError: (err: unknown) => {
      showError(
        err instanceof Error ? err.message : "Failed to create category"
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: CategoryFormState }) =>
      productCategoryService.update(payload.id, {
        name: payload.data.name.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productCategories"] });
      setEditingCategory(null);
      setEditForm(emptyForm);
      showSuccess("Category updated");
    },
    onError: (err: unknown) => {
      showError(
        err instanceof Error ? err.message : "Failed to update category"
      );
    },
  });

  const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createForm.name.trim()) {
      showError("Category name is required");
      return;
    }
    createMutation.mutate();
  };

  const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCategory) return;
    if (!editForm.name.trim()) {
      showError("Category name is required");
      return;
    }
    updateMutation.mutate({ id: editingCategory.id, data: editForm });
  };

  const filteredCategories = useMemo(() => {
    const term = categorySearch.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((category) =>
      (category.name ?? "").toLowerCase().includes(term)
    );
  }, [categories, categorySearch]);

  const tableContent = useMemo(() => {
    const hasFilter = Boolean(categorySearch.trim());
    if (isLoading) {
      return (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={`category-skeleton-${index}`}>
                  <TableCell>
                    <Skeleton className="h-5 w-48" />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {(error as Error)?.message ?? "Unable to load categories right now."}
        </div>
      );
    }

    if (!categories.length && !hasFilter) {
      return (
        <div className="rounded-lg border border-border/60 p-6 text-center text-sm text-muted-foreground">
          You have no categories yet. Create one to get started.
        </div>
      );
    }

    if (!filteredCategories.length) {
      return (
        <div className="rounded-lg border border-border/60 p-6 text-center text-sm text-muted-foreground">
          No categories match your current filter.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-lg border border-border/60 -mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="max-h-[60vh] overflow-y-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm">Category</TableHead>
                <TableHead className="text-xs sm:text-sm text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="py-2 sm:py-4">
                    <div className="font-medium text-foreground text-xs sm:text-sm">
                      {category.name}
                    </div>
                    {category.description ? (
                      <p className="text-[10px] sm:text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-none">
                        {category.description}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="py-2 sm:py-4">
                    <div className="flex justify-end gap-1 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingCategory(category)}
                        className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                      >
                        View
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingCategory(category);
                          setEditForm({
                            name: category.name ?? "",
                          });
                        }}
                        className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                      >
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }, [
    categories,
    categorySearch,
    error,
    filteredCategories,
    isError,
    isLoading,
  ]);

  return (
    <section className="space-y-4 sm:space-y-6">
      <header className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Product Categories
          </h2>
        </div>
        <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center lg:justify-end">
          <div className="w-full sm:w-64">
            <label htmlFor="category-filter" className="sr-only">
              Search categories
            </label>
            <Input
              id="category-filter"
              value={categorySearch}
              onChange={(event) => setCategorySearch(event.target.value)}
              placeholder="Search categories..."
              className="h-9 sm:h-10 text-sm"
            />
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 h-9 sm:h-10 text-sm w-full sm:w-auto">
            <PlusCircle className="h-4 w-4" />
            Create Category
          </Button>
        </div>
      </header>

      {tableContent}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="mx-2 w-[calc(100%-1rem)] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Create Category</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Provide a clear name so your team can reuse this category.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-3 sm:space-y-4" onSubmit={handleCreateSubmit}>
            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="category-name" className="text-xs sm:text-sm font-medium">
                Name
              </label>
              <Input
                id="category-name"
                placeholder="e.g. COVID-19 Vaccines"
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="h-9 sm:h-10 text-sm w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="gap-2 h-9 sm:h-10 text-sm w-full sm:w-auto"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingCategory)}
        onOpenChange={(open) => (!open ? setEditingCategory(null) : null)}
      >
        <DialogContent className="mx-2 w-[calc(100%-1rem)] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Category</DialogTitle>
          </DialogHeader>
          <form className="space-y-3 sm:space-y-4" onSubmit={handleEditSubmit}>
            <div className="space-y-1.5 sm:space-y-2">
              <label
                htmlFor="edit-category-name"
                className="text-xs sm:text-sm font-medium"
              >
                Name
              </label>
              <Input
                id="edit-category-name"
                value={editForm.name}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCategory(null)}
                className="h-9 sm:h-10 text-sm w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="gap-2 h-9 sm:h-10 text-sm w-full sm:w-auto"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Save changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(viewingCategory)}
        onOpenChange={(open) => (!open ? setViewingCategory(null) : null)}
      >
        <DialogContent className="mx-2 w-[calc(100%-1rem)] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl truncate">{viewingCategory?.name}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Category details</DialogDescription>
          </DialogHeader>
          {viewingCategory ? (
            <div className="space-y-3 sm:space-y-4">
              {viewingCategory.description ? (
                <div className="rounded-lg border border-border/60 bg-muted/40 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-muted-foreground">
                  {viewingCategory.description}
                </div>
              ) : null}
              <div className="grid gap-2 sm:gap-3 text-xs sm:text-sm">
                {[
                  {
                    label: "Created",
                    value: formatDetailedDateTime(viewingCategory.createdAt),
                  },
                  {
                    label: "Updated",
                    value: formatDetailedDateTime(viewingCategory.updatedAt),
                  },
                ].map((detail) => (
                  <div
                    key={detail.label}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 sm:px-4 py-2.5 sm:py-3"
                  >
                    <span className="text-muted-foreground">
                      {detail.label}
                    </span>
                    <span className="font-medium text-foreground">
                      {detail.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
