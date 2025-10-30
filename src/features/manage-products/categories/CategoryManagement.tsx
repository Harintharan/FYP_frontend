import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { productCategoryService } from "@/services/productCategoryService";
import type { ProductCategory } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle } from "lucide-react";

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

export function CategoryManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CategoryFormState>(emptyForm);

  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [editForm, setEditForm] = useState<CategoryFormState>(emptyForm);

  const [viewingCategory, setViewingCategory] = useState<ProductCategory | null>(null);

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
    mutationFn: () => productCategoryService.create({ name: createForm.name.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productCategories"] });
      setCreateForm(emptyForm);
      setIsCreateDialogOpen(false);
      toast({
        title: "Category created",
        description: "The category was created successfully.",
      });
    },
    onError: (err: unknown) => {
      toast({
        variant: "destructive",
        title: "Failed to create category",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: CategoryFormState }) =>
      productCategoryService.update(payload.id, { name: payload.data.name.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productCategories"] });
      setEditingCategory(null);
      setEditForm(emptyForm);
      toast({
        title: "Category updated",
        description: "The category was updated successfully.",
      });
    },
    onError: (err: unknown) => {
      toast({
        variant: "destructive",
        title: "Failed to update category",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    },
  });

  const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createForm.name.trim()) {
      toast({
        variant: "destructive",
        title: "Category name is required",
      });
      return;
    }
    createMutation.mutate();
  };

  const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCategory) return;
    if (!editForm.name.trim()) {
      toast({
        variant: "destructive",
        title: "Category name is required",
      });
      return;
    }
    updateMutation.mutate({ id: editingCategory.id, data: editForm });
  };

  const cardContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={`skeleton-${index}`} className="border-border/50">
              <CardHeader>
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
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
          {(error as Error)?.message ?? "Unable to load categories right now."}
        </div>
      );
    }

    if (categories.length === 0) {
      return (
        <div className="rounded-lg border border-border/60 p-6 text-center text-sm text-muted-foreground">
          No categories found. Use the Create Category button to add your first category.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id} className="border-border/60 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{category.name}</span>
                <Badge variant="outline">Category</Badge>
              </CardTitle>
              {category.description ? (
                <CardDescription>{category.description}</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Created:</span> {formatDateTime(category.createdAt)}
              </p>
              <p>
                <span className="font-medium text-foreground">Updated:</span> {formatDateTime(category.updatedAt)}
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setViewingCategory(category)}>
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
              >
                Edit
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }, [categories, error, isError, isLoading]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Product Categories</h2>
          <p className="text-sm text-muted-foreground">
            Organize your products into clear groups for easier filtering and reporting.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Category
        </Button>
      </header>

      {cardContent}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
            <DialogDescription>Provide a clear name so your team can reuse this category.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateSubmit}>
            <div className="space-y-2">
              <label htmlFor="category-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="category-name"
                placeholder="e.g. COVID-19 Vaccines"
                value={createForm.name}
                onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingCategory)} onOpenChange={(open) => (!open ? setEditingCategory(null) : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update the category name to keep your catalog organised.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="space-y-2">
              <label htmlFor="edit-category-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="edit-category-name"
                value={editForm.name}
                onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewingCategory)} onOpenChange={(open) => (!open ? setViewingCategory(null) : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{viewingCategory?.name}</DialogTitle>
            <DialogDescription>Category details</DialogDescription>
          </DialogHeader>
          {viewingCategory ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="text-foreground">{formatDateTime(viewingCategory.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Updated</p>
                <p className="text-foreground">{formatDateTime(viewingCategory.updatedAt)}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
