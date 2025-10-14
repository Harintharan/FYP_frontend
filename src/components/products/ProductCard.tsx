// src/components/ProductCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCode, MapPin, Thermometer, Clock, Edit3 } from 'lucide-react';
import type { VaccineProduct, VaccineProductStatus } from '@/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';
import { productRegistryService } from '@/services/productService';

interface ProductCardProps {
  product: VaccineProduct;
  onViewDetails: (product: VaccineProduct) => void;
  onGenerateQR?: (product: VaccineProduct) => void;
  onEdit?: (product: VaccineProduct) => void;            // ✅ NEW
}

const statusClassMap: Record<VaccineProductStatus, string> = {
  PENDING_QC: 'bg-muted text-muted-foreground border border-border',
  READY_FOR_SHIPMENT: 'bg-primary/10 text-primary border border-primary/20',
  IN_TRANSIT: 'bg-warning/10 text-warning border border-warning/20',
  DELIVERED: 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900',
  EXPIRED: 'bg-destructive/10 text-destructive border border-destructive/20',
  RECALLED: 'bg-destructive/10 text-destructive border border-destructive/20',
};

function humanizeStatus(status: string) {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateString?: string) {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString();
}

function formatEthAddr(addr?: `0x${string}`) {
  if (!addr) return 'Unassigned';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function ProductCard({ product, onViewDetails, onGenerateQR, onEdit }: ProductCardProps) {
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const statusOptions: string[] = ['PENDING_QC', 'READY TO SHIPMENT', 'IN_TRANSIT', 'DELIVERED', 'EXPIRED', 'RECALLED'];

  const [form, setForm] = useState({
    productName: product.productName ?? '',
    productCategory: (product as any).productCategory ?? '',
    microprocessorMac: product.microprocessorMac ?? '',
    sensorTypes: product.sensorTypes ?? '',
    wifiSSID: product.wifiSSID ?? '',
    wifiPassword: product.wifiPassword ?? '',
    status: (product.status as string) ?? 'PENDING_QC',
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (!form.wifiPassword || !form.wifiPassword.trim()) {
        toast.error('Wi-Fi Password is required.');
        return;
      }
      await productRegistryService.updateProduct(product.id, {
        productName: form.productName,
        productCategory: form.productCategory,
        microprocessorMac: form.microprocessorMac,
        sensorTypes: form.sensorTypes,
        wifiSSID: form.wifiSSID,
        wifiPassword: form.wifiPassword,
        status: form.status,
      });
      toast.success('Product updated');
      setShowEdit(false);
      if (onEdit) onEdit({ ...product, ...form } as VaccineProduct);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  const statusClasses = statusClassMap[product.status as VaccineProductStatus] ?? 'bg-muted text-muted-foreground border';

  return (
    <Card className="shadow-card hover:shadow-floating transition-all duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-lg group-hover:text-primary transition-colors truncate">
              {product.productName}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              Batch: {product.batchId}
            </p>
          </div>
          <Badge className={cn('text-xs whitespace-nowrap', statusClasses)}>
            {humanizeStatus(product.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Exp Date</p>
              <p className="font-medium">{formatDate(product.expiryDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Current Holder</p>
              <p className="font-medium text-xs">{formatEthAddr(product.createdBy)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Thermometer className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-muted-foreground">Storage</p>
            <p className="font-medium">{product.requiredStorageTemp}</p>
          </div>
        </div>

        {/* ✅ Actions: View + Edit (+ optional QR) */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => { setShowView(true); if (onViewDetails) onViewDetails(product); }}
            className="flex-1"
          >
            View Details
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowEdit(true)}
            className="flex-1"
            aria-label="Edit Product"
            title="Edit Product"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit
          </Button>

          {onGenerateQR && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onGenerateQR(product)}
              aria-label="Generate QR"
              title="Generate QR"
            >
              <QrCode className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>

      {/* View Dialog */}
      <Dialog open={showView} onOpenChange={setShowView}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>Review product information</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium break-words">{product.productName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Batch</p>
              <p className="font-medium break-words">{product.batchId}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Category</p>
              <p className="font-medium break-words">{(product as any).productCategory}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium">{(product.status || '').toString()}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-muted-foreground">Microprocessor MAC</p>
              <p className="font-medium">{product.microprocessorMac}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-muted-foreground">Sensor Types</p>
              <p className="font-medium">{product.sensorTypes}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-muted-foreground">Wi-Fi SSID</p>
              <p className="font-medium">{product.wifiSSID}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product fields and save</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Product Category</label>
              <Input value={form.productCategory} onChange={(e) => setForm({ ...form, productCategory: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Sensor Types</label>
              <Input value={form.sensorTypes} onChange={(e) => setForm({ ...form, sensorTypes: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Wi-Fi SSID</label>
              <Input value={form.wifiSSID} onChange={(e) => setForm({ ...form, wifiSSID: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Wi-Fi Password</label>
              <Input type="password" value={form.wifiPassword} onChange={(e) => setForm({ ...form, wifiPassword: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Microprocessor MAC</label>
              <Input value={form.microprocessorMac} onChange={(e) => setForm({ ...form, microprocessorMac: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button disabled={isSaving} onClick={handleSave}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
