import { useMemo, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QrCode, Eye, Edit3, Hash } from "lucide-react";
import type { Product } from "@/types";

type BackendProduct = Product & {
  productCategory?: {
    id: string;
    name: string;
  } | null;
  manufacturer?: {
    id?: string | null;
  } | null;
  manufacturerUUID?: string | null;
  productHash?: string | null;
  txHash?: string | null;
  createdBy?: string | null;
  pinataCid?: string | null;
  pinataPinnedAt?: string | null;
};

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
  onGenerateQR?: (product: Product) => void;
  onEdit?: (product: Product) => void;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const formatHash = (value?: string | null) => {
  if (!value) return "Not available";
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
};

const temperatureRange = (product: BackendProduct) => {
  const start = product.requiredStartTemp?.trim();
  const end = product.requiredEndTemp?.trim();

  if (start && end) return `${start} – ${end}`;
  if (start) return `≥ ${start}`;
  if (end) return `≤ ${end}`;
  return "Not specified";
};

export function ProductCard({ product, onViewDetails, onGenerateQR, onEdit }: ProductCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const backendProduct = useMemo(() => product as BackendProduct, [product]);
  const categoryName =
    backendProduct.productCategory?.name ??
    backendProduct.productCategoryName ??
    "Uncategorised";

  const manufacturerId = backendProduct.manufacturer?.id ?? backendProduct.manufacturerUUID ?? "Unknown";

  const handleView = () => {
    if (onViewDetails) {
      onViewDetails(product);
      return;
    }
    setIsDialogOpen(true);
  };

  return (
    <>
      <Card className="border border-border/60 shadow-none hover:shadow-md transition-shadow">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{backendProduct.productName}</CardTitle>
            <Badge variant="outline">{categoryName}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Manufacturer ID: <span className="font-medium text-foreground">{manufacturerId}</span>
          </p>
        </CardHeader>

        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Temperature Range</p>
            <p className="font-medium">{temperatureRange(backendProduct)}</p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Handling Instructions</p>
            <p className="font-medium whitespace-pre-wrap">{backendProduct.handlingInstructions || "Not provided"}</p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Product Hash</p>
            <p className="font-medium flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              {formatHash(backendProduct.productHash)}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Created</p>
              <p className="font-medium">{formatDateTime(backendProduct.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Pinned At</p>
              <p className="font-medium">{formatDateTime(backendProduct.pinataPinnedAt)}</p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleView}>
            <Eye className="h-4 w-4" />
            View
          </Button>
          {onEdit ? (
            <Button variant="secondary" size="sm" className="gap-2" onClick={() => onEdit(product)}>
              <Edit3 className="h-4 w-4" />
              Edit
            </Button>
          ) : null}
          {onGenerateQR ? (
            <Button size="sm" className="gap-2" onClick={() => onGenerateQR(product)}>
              <QrCode className="h-4 w-4" />
              QR Code
            </Button>
          ) : null}
        </CardFooter>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{backendProduct.productName}</DialogTitle>
            <DialogDescription>Product metadata from the registry.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Category</p>
                <p className="font-medium">{categoryName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Manufacturer ID</p>
                <p className="font-medium">{manufacturerId}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Temperature Range</p>
                <p className="font-medium">{temperatureRange(backendProduct)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created By</p>
                <p className="font-medium">{backendProduct.createdBy ?? "Unknown"}</p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground">Handling Instructions</p>
              <p className="font-medium whitespace-pre-wrap">
                {backendProduct.handlingInstructions?.trim() || "Not provided"}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Product Hash</p>
                <p className="font-medium">{backendProduct.productHash ?? "Not available"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Transaction Hash</p>
                <p className="font-medium">{backendProduct.txHash ?? "Not available"}</p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground">Pinata CID</p>
              <p className="font-medium break-all">{backendProduct.pinataCid ?? "Not available"}</p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{formatDateTime(backendProduct.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pinned At</p>
                <p className="font-medium">{formatDateTime(backendProduct.pinataPinnedAt)}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
