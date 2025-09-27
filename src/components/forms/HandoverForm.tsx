import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { QRScanner } from '@/components/qr/QRScanner';
import { Badge } from '@/components/ui/badge';
import { QrCode, ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import type { ProductMeta } from '@/types';

const handoverSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  toAddress: z.string().min(1, 'Recipient address is required'),
  checkpoint: z.string().optional(),
  note: z.string().optional(),
});

type HandoverFormData = z.infer<typeof handoverSchema>;

interface HandoverFormProps {
  onSubmit?: (data: HandoverFormData) => void;
  className?: string;
}

export const HandoverForm = ({ onSubmit, className }: HandoverFormProps) => {
  const [showScanner, setShowScanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductMeta | null>(null);
  
  const { products, user, updateProduct } = useAppStore();

  const form = useForm<HandoverFormData>({
    resolver: zodResolver(handoverSchema),
    defaultValues: {
      productId: '',
      toAddress: '',
      checkpoint: '',
      note: '',
    },
  });

  const handleScan = (scannedData: string) => {
    // Extract product ID from QR data (assuming format: product://[id])
    const productId = scannedData.replace('product://', '');
    form.setValue('productId', productId);
    
    // Find product by ID
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);
    
    setShowScanner(false);
    
    if (!product) {
      toast({
        title: "Product Not Found",
        description: `No product found with ID: ${productId}`,
        variant: "destructive"
      });
    }
  };

  const handleFormSubmit = async (data: HandoverFormData) => {
    setIsSubmitting(true);
    
    try {
      // Mock blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update product status
      if (selectedProduct) {
        updateProduct(selectedProduct.id, {
          status: 'IN_TRANSIT',
          currentHolder: data.toAddress as `0x${string}`
        });
      }
      
      toast({
        title: "Handover Completed",
        description: `Product ${data.productId} transferred successfully`,
      });
      
      // Reset form
      form.reset();
      setSelectedProduct(null);
      
      // Call external handler if provided
      onSubmit?.(data);
      
    } catch (error) {
      toast({
        title: "Handover Failed",
        description: "Failed to complete the handover transaction",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Product Handover
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
              {/* Product ID Field */}
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product ID</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          placeholder="Enter product ID" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(e);
                            const product = products.find(p => p.id === e.target.value);
                            setSelectedProduct(product || null);
                          }}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowScanner(true)}
                        className="gap-2"
                      >
                        <QrCode className="h-4 w-4" />
                        Scan
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Product Info Display */}
              {selectedProduct && (
                <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{selectedProduct.name}</h4>
                    <Badge variant="secondary">{selectedProduct.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Batch: {selectedProduct.batchNumber}</p>
                  {selectedProduct.currentHolder && (
                    <p className="text-sm text-muted-foreground">
                      Current Holder: {selectedProduct.currentHolder.slice(0, 8)}...
                    </p>
                  )}
                </div>
              )}

              {/* Recipient Address */}
              <FormField
                control={form.control}
                name="toAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="0x..." 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Checkpoint (Optional) */}
              <FormField
                control={form.control}
                name="checkpoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Checkpoint (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Warehouse A, Port Terminal" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any notes about this handover..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full gap-2"
                disabled={isSubmitting || !selectedProduct}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing Handover...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    Complete Handover
                  </>
                )}
              </Button>

              {/* User Info */}
              {user && (
                <div className="text-sm text-muted-foreground text-center">
                  Transferring as: {user.displayName} ({user.role})
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
          title="Scan Product QR Code"
        />
      )}
    </>
  );
};