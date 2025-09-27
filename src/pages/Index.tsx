import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { ProductCard } from '@/components/products/ProductCard';
import { QRCodeGenerator } from '@/components/qr/QRCodeGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { mockProducts, mockUsers, mockAlerts, generateMockTelemetry } from '@/lib/mock-data';
import type { ProductMeta } from '@/types';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProduct, setSelectedProduct] = useState<ProductMeta | null>(null);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  
  const { 
    user, 
    products, 
    alerts,
    setUser, 
    addProduct, 
    addAlert,
    addTelemetryPoint
  } = useAppStore();

  // Initialize with mock data
  useEffect(() => {
    if (!user) {
      setUser(mockUsers[0]); // Set as manufacturer by default
    }
    
    if (products.length === 0) {
      mockProducts.forEach(addProduct);
      mockAlerts.forEach(addAlert);
      
      // Add some telemetry data
      mockProducts.forEach(product => {
        const telemetryData = generateMockTelemetry(product.id, 12);
        telemetryData.forEach(point => addTelemetryPoint(product.id, point));
      });
    }
  }, [user, products.length, setUser, addProduct, addAlert, addTelemetryPoint]);

  const handleProductSelect = (product: ProductMeta) => {
    setSelectedProduct(product);
    setActiveTab('product-detail');
  };

  const handleGenerateQR = (product: ProductMeta) => {
    setSelectedProduct(product);
    setShowQRGenerator(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Supply Chain Dashboard</h1>
              <p className="text-muted-foreground">
                Track and monitor your products across the entire supply chain
              </p>
            </div>
            
            <DashboardStats />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Recent Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {products.slice(0, 3).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.batchNumber}</p>
                        </div>
                        <Button size="sm" onClick={() => handleProductSelect(product)}>
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Recent Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alerts.slice(0, 3).map((alert) => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          alert.level === 'CRITICAL' ? 'bg-destructive' :
                          alert.level === 'WARN' ? 'bg-warning' : 'bg-secondary'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.ts).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Products</h1>
                <p className="text-muted-foreground">Manage and track all products</p>
              </div>
              {user?.role === 'MANUFACTURER' && (
                <Button onClick={() => setActiveTab('create')}>
                  Create Product
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onViewDetails={handleProductSelect}
                  onGenerateQR={handleGenerateQR}
                />
              ))}
            </div>
          </div>
        );

      case 'create':
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Create New Product</h1>
              <p className="text-muted-foreground">Register a new product in the supply chain</p>
            </div>
            
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Product creation form will be implemented here
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setActiveTab('products')}
                  >
                    Back to Products
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
            <p className="text-muted-foreground">
              The {activeTab} section is under development
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
        />
        
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>

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
    </div>
  );
};

export default Index;
