import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { VaccineProduct } from '@/types';
import { productRegistryService } from "@/services/productService";

const statusOptions: Array<'ALL' | string> = [
  'ALL',
  'PENDING_QC',
  'READY TO SHIPMENT',
  'IN_TRANSIT',
  'DELIVERED',
  'EXPIRED',
  'RECALLED',
];

const getStatusColor = (status: string | 'ALL') => {
  switch (status) {
    case 'PENDING_QC': return 'bg-muted';
    case 'READY_FOR_SHIPMENT':
    case 'READY TO SHIPMENT':
      return 'bg-blue-500';
    case 'IN_TRANSIT': return 'bg-yellow-500';
    case 'DELIVERED': return 'bg-green-500';
    case 'EXPIRED': return 'bg-destructive';
    case 'RECALLED': return 'bg-red-600';
    default: return 'bg-muted';
  }
};

const Products = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | string>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<VaccineProduct | null>(null);
  const [showQRGenerator, setShowQRGenerator] = useState(false);

  const { uuid, user } = useAppStore();

  const { data: products = [], isLoading: loadingProducts } = useQuery<VaccineProduct[]>({
    queryKey: ["products", uuid],
    queryFn: () => productRegistryService.getAllProducts(uuid),
  });

  const filteredProducts: VaccineProduct[] = products.filter((product) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      !search ||
      product.productName?.toLowerCase().includes(search) ||
      product.batchId?.toLowerCase().includes(search) ||
      product.manufacturerUUID?.toLowerCase().includes(search) ||
      product.status?.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "ALL" || product.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleGenerateQR = (product: VaccineProduct) => {
    setSelectedProduct(product);
    setShowQRGenerator(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Products</h1>
              <p className="text-muted-foreground">Manage and track all products in the supply chain</p>
            </div>
            {user?.role === 'MANUFACTURER' && (
              <Button className="gap-2" onClick={() => navigate('/products/create')}>
                <Plus className="h-4 w-4" />
                Create Product
              </Button>
            )}
          </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, batch, manufacturer UUID, or status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex gap-2 flex-wrap">
                  {statusOptions.map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                      className="gap-2"
                    >
                      {status !== 'ALL' && (
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                      )}
                      {status.replace(/_/g, ' ')}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          {loadingProducts ? (
            <Card><CardContent className="py-12 text-center">Loading products…</CardContent></Card>
          ) : filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  {(products?.length ?? 0) === 0
                    ? "No products found. Create your first product to get started."
                    : "No products match your search criteria."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Results Summary */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                <span>Showing {filteredProducts.length} of {products.length} products</span>
                <div className="flex gap-2 flex-wrap">
                  {statusOptions.slice(1).map((status) => {
                    const count = products.filter(p => p.status === status).length;
                    return count > 0 ? (
                      <Badge key={status} variant="secondary" className="gap-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                        {status.replace(/_/g, ' ')}: {count}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onViewDetails={(p) => {
                      // navigate(`/products/${p.id}`);
                      console.log('Navigate to product detail:', p.id);
                    }}
                    onGenerateQR={handleGenerateQR}
                  />
                ))}
              </div>
            </>
          )}

          {/* QR Code Generator Modal (if you wire it up later) */}
          {showQRGenerator && selectedProduct && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="relative">
                {/* <QRCodeGenerator data={selectedProduct.qrUri} title={`QR Code - ${selectedProduct.productName}`} /> */}
                <Button
                  className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
                  onClick={() => setShowQRGenerator(false)}
                >
                  ×
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;
