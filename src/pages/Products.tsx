import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductCard } from '@/components/products/ProductCard';
import { QRCodeGenerator } from '@/components/qr/QRCodeGenerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { ProductMeta } from '@/types';

const Products = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<ProductMeta | null>(null);
  const [showQRGenerator, setShowQRGenerator] = useState(false);

  const { products, user } = useAppStore();

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || product.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleGenerateQR = (product: ProductMeta) => {
    setSelectedProduct(product);
    setShowQRGenerator(true);
  };

  const statusOptions = ['ALL', 'CREATED', 'IN_TRANSIT', 'DELIVERED', 'VERIFIED'];
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return 'bg-blue-500';
      case 'IN_TRANSIT': return 'bg-yellow-500';
      case 'DELIVERED': return 'bg-green-500';
      case 'VERIFIED': return 'bg-purple-500';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                placeholder="Search products..."
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
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              {products.length === 0 
                ? "No products found. Create your first product to get started."
                : "No products match your search criteria."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Results Summary */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Showing {filteredProducts.length} of {products.length} products</span>
            <div className="flex gap-2">
              {statusOptions.slice(1).map((status) => {
                const count = products.filter(p => p.status === status).length;
                return count > 0 ? (
                  <Badge key={status} variant="secondary" className="gap-1">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                    {status}: {count}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={(product) => {
                  // Navigate to product detail page
                  console.log('Navigate to product detail:', product.id);
                }}
                onGenerateQR={handleGenerateQR}
              />
            ))}
          </div>
        </>
      )}

      {/* QR Code Generator Modal */}
      {showQRGenerator && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative">
            <QRCodeGenerator
              data={selectedProduct.qrUri}
              title={`QR Code - ${selectedProduct.name}`}
            />
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