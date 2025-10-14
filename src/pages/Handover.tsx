import { HandoverForm } from '@/components/forms/HandoverForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { productRegistryService } from '@/services/productService';
import type { VaccineProduct } from '@/types';

const Handover = () => {
  const { user, uuid } = useAppStore();

  // Fetch products for this manufacturer via API
  const { data: products = [], isLoading: loadingProducts } = useQuery<VaccineProduct[]>({
    queryKey: ["products", uuid],
    queryFn: () => productRegistryService.getAllProducts(uuid ?? ''),
    enabled: !!uuid,
  });

  // Mock recent handovers
  const recentHandovers = [
    {
      id: 'h1',
      productId: 'prod-001',
      productName: 'Organic Coffee Beans',
      from: '0x742d35Cc6634C0532925a3b8D8b5C4e0c5E42F2B',
      to: '0x8ba1f109551bD432803012645Hac136c30c6213c',
      timestamp: Date.now() - 3600000,
      status: 'completed',
      checkpoint: 'Central Warehouse'
    },
    {
      id: 'h2',
      productId: 'prod-002',
      productName: 'Premium Tea Selection',
      from: '0x8ba1f109551bD432803012645Hac136c30c6213c',
      to: '0x456d35Cc6634C0532925a3b8D8b5C4e0c5E42F2B',
      timestamp: Date.now() - 7200000,
      status: 'pending',
      checkpoint: 'Distribution Center'
    },
  ];

  // Products already come filtered by manufacturer UUID from the backend route
  const userProducts = products || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Product Shipments</h1>
        <p className="text-muted-foreground">
          Transfer custody of products to another party in the supply chain
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Handover Form */}
        <div className="space-y-6">
          <HandoverForm />

          {/* User Products */}
          <Card>
            <CardHeader>
              <CardTitle>Your Products</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProducts ? (
                <p className="text-muted-foreground text-center py-8">Loading products...</p>
              ) : userProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No products under your custody
                </p>
              ) : (
                <div className="space-y-3">
                  {products.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium">{(product as any).productName ?? (product as any).name ?? product.id}</p>
                        <p className="text-sm text-muted-foreground">ID: {product.id}</p>
                      </div>
                      <Badge variant="secondary">{(product as any).status ?? 'UNKNOWN'}</Badge>
                    </div>
                  ))}
                  {userProducts.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      And {userProducts.length - 5} more...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Handovers */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Handovers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentHandovers.map((handover) => (
                  <div key={handover.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{handover.productName}</h4>
                      <Badge
                        variant={handover.status === 'completed' ? 'secondary' : 'outline'}
                        className="gap-1"
                      >
                        {handover.status === 'completed' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {handover.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{handover.from.slice(0, 8)}...</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>{handover.to.slice(0, 8)}...</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{handover.checkpoint}</span>
                      <span>{new Date(handover.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Handover Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Handover Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">Scan QR Code</p>
                  <p className="text-muted-foreground">Use the camera to scan the product's QR code for quick identification</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">Verify Recipient</p>
                  <p className="text-muted-foreground">Ensure the recipient address is correct before proceeding</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">Add Notes</p>
                  <p className="text-muted-foreground">Include any relevant information about the handover</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">Blockchain Transaction</p>
                  <p className="text-muted-foreground">The handover will be recorded on the blockchain for immutable tracking</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Handover;
