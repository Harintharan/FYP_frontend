import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapTracker } from '@/components/map/MapTracker';
import { TelemetryChart } from '@/components/charts/TelemetryChart';
import { ArrowLeft, Shield, MapPin, Activity, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { ProductMeta, TelemetryPoint, CustodyEvent } from '@/types';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductMeta | null>(null);
  
  const { products, telemetryData, temperatureUnit } = useAppStore();

  useEffect(() => {
    const foundProduct = products.find(p => p.id === id);
    setProduct(foundProduct || null);
  }, [id, products]);

  if (!product) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/products')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Button>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Product not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const productTelemetry = telemetryData[product.id] || [];
  
  // Mock custody events
  const custodyEvents: CustodyEvent[] = [
    {
      ts: Date.now() - 86400000 * 3,
      from: undefined,
      to: product.creator,
      note: 'Product created',
      checkpoint: 'Manufacturing Plant',
    },
    {
      ts: Date.now() - 86400000 * 2,
      from: product.creator,
      to: '0x456...' as `0x${string}`,
      note: 'Transferred to warehouse',
      checkpoint: 'Central Warehouse',
    },
    {
      ts: Date.now() - 86400000,
      from: '0x456...' as `0x${string}`,
      to: product.currentHolder || ('0x789...' as `0x${string}`),
      note: 'In transit to retailer',
      checkpoint: 'Distribution Center',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'DELIVERED':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'IN_TRANSIT':
        return <Activity className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'bg-green-500';
      case 'DELIVERED': return 'bg-blue-500';
      case 'IN_TRANSIT': return 'bg-yellow-500';
      case 'CREATED': return 'bg-purple-500';
      default: return 'bg-muted';
    }
  };

  const hasTemperatureAlerts = productTelemetry.some(p => 
    p.tempC !== undefined && (p.tempC < 2 || p.tempC > 8)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/products')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Button>
      </div>

      {/* Product Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              Authenticity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                ✓ Verified
              </Badge>
              <p className="text-sm text-muted-foreground">
                Product authenticity confirmed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(product.status)}
                <Badge variant="secondary" className={getStatusColor(product.status)}>
                  {product.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {product.currentHolder ? 
                  `Holder: ${product.currentHolder.slice(0, 8)}...` : 
                  'No current holder'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5" />
              Condition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge 
                variant={hasTemperatureAlerts ? "destructive" : "secondary"}
                className={hasTemperatureAlerts ? "" : "bg-green-100 text-green-800"}
              >
                {hasTemperatureAlerts ? "⚠️ Alerts" : "✓ Good"}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {hasTemperatureAlerts ? 
                  "Temperature alerts detected" : 
                  "All conditions normal"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{product.name}</CardTitle>
              <p className="text-muted-foreground">Product ID: {product.id}</p>
            </div>
            <Badge variant="secondary" className={getStatusColor(product.status)}>
              {product.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Batch Number:</span> {product.batchNumber}
            </div>
            <div>
              <span className="font-medium">Lot Number:</span> {product.lotNumber || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Production Date:</span> {product.productionDate}
            </div>
            <div>
              <span className="font-medium">Expiration Date:</span> {product.expirationDate}
            </div>
            <div>
              <span className="font-medium">Creator:</span> {product.creator.slice(0, 12)}...
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for detailed information */}
      <Tabs defaultValue="timeline" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
          <TabsTrigger value="map">GPS Tracking</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Provenance Timeline */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provenance Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {custodyEvents.map((event, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b last:border-b-0">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      {index < custodyEvents.length - 1 && (
                        <div className="w-px h-12 bg-border mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {event.from ? 'Transfer' : 'Creation'}
                        </p>
                        <span className="text-sm text-muted-foreground">
                          {new Date(event.ts).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {event.note}
                      </p>
                      {event.checkpoint && (
                        <Badge variant="outline" className="text-xs">
                          {event.checkpoint}
                        </Badge>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {event.from && (
                          <div>From: {event.from.slice(0, 8)}...</div>
                        )}
                        <div>To: {event.to.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Telemetry Charts */}
        <TabsContent value="telemetry" className="space-y-4">
          <TelemetryChart 
            data={productTelemetry}
            temperatureUnit={temperatureUnit}
          />
          
          {/* Door Events */}
          <Card>
            <CardHeader>
              <CardTitle>Door Events</CardTitle>
            </CardHeader>
            <CardContent>
              {productTelemetry.filter(p => p.doorOpen !== undefined).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No door event data available
                </p>
              ) : (
                <div className="space-y-2">
                  {productTelemetry
                    .filter(p => p.doorOpen !== undefined)
                    .slice(-10)
                    .map((point, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{new Date(point.ts).toLocaleString()}</span>
                        <Badge variant={point.doorOpen ? "destructive" : "secondary"}>
                          {point.doorOpen ? "Door Opened" : "Door Closed"}
                        </Badge>
                      </div>
                    ))
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GPS Map */}
        <TabsContent value="map">
          <MapTracker telemetryData={productTelemetry} />
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents & Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No documents uploaded yet</p>
                <p className="text-sm">Documents and media files will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductDetail;