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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/products')}
          className="gap-2 h-9 sm:h-10 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Products</span>
          <span className="sm:hidden">Back</span>
        </Button>
      </div>

      {/* Product Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              Authenticity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-1.5 sm:space-y-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                ✓ Verified
              </Badge>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Product authenticity confirmed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(product.status)}
                <Badge variant="secondary" className={`${getStatusColor(product.status)} text-xs`}>
                  {product.status}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {product.currentHolder ? 
                  `Holder: ${product.currentHolder.slice(0, 8)}...` : 
                  'No current holder'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
              Condition
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-1.5 sm:space-y-2">
              <Badge 
                variant={hasTemperatureAlerts ? "destructive" : "secondary"}
                className={`text-xs ${hasTemperatureAlerts ? "" : "bg-green-100 text-green-800"}`}
              >
                {hasTemperatureAlerts ? "⚠️ Alerts" : "✓ Good"}
              </Badge>
              <p className="text-xs sm:text-sm text-muted-foreground">
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
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl lg:text-2xl">{product.name}</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Product ID: {product.id}</p>
            </div>
            <Badge variant="secondary" className={`${getStatusColor(product.status)} text-xs self-start sm:self-auto`}>
              {product.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
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
            <div className="truncate">
              <span className="font-medium">Creator:</span> {product.creator.slice(0, 12)}...
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for detailed information */}
      <Tabs defaultValue="timeline" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-9 sm:h-10">
          <TabsTrigger value="timeline" className="text-xs sm:text-sm">Timeline</TabsTrigger>
          <TabsTrigger value="telemetry" className="text-xs sm:text-sm">Telemetry</TabsTrigger>
          <TabsTrigger value="map" className="text-xs sm:text-sm"><span className="hidden sm:inline">GPS </span>Tracking</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs sm:text-sm">Documents</TabsTrigger>
        </TabsList>

        {/* Provenance Timeline */}
        <TabsContent value="timeline" className="space-y-3 sm:space-y-4">
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Provenance Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-3 sm:space-y-4">
                {custodyEvents.map((event, index) => (
                  <div key={index} className="flex gap-3 sm:gap-4 pb-3 sm:pb-4 border-b last:border-b-0">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary rounded-full"></div>
                      {index < custodyEvents.length - 1 && (
                        <div className="w-px h-10 sm:h-12 bg-border mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-0">
                        <p className="font-medium text-sm">
                          {event.from ? 'Transfer' : 'Creation'}
                        </p>
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {new Date(event.ts).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {event.note}
                      </p>
                      {event.checkpoint && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs">
                          {event.checkpoint}
                        </Badge>
                      )}
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
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
        <TabsContent value="telemetry" className="space-y-3 sm:space-y-4">
          <TelemetryChart 
            data={productTelemetry}
            temperatureUnit={temperatureUnit}
          />
          
          {/* Door Events */}
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Door Events</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              {productTelemetry.filter(p => p.doorOpen !== undefined).length === 0 ? (
                <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm">
                  No door event data available
                </p>
              ) : (
                <div className="space-y-1.5 sm:space-y-2">
                  {productTelemetry
                    .filter(p => p.doorOpen !== undefined)
                    .slice(-10)
                    .map((point, index) => (
                      <div key={index} className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="truncate">{new Date(point.ts).toLocaleString()}</span>
                        <Badge variant={point.doorOpen ? "destructive" : "secondary"} className="text-xs ml-2">
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
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Documents & Media
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="text-center py-8 sm:py-12 text-muted-foreground">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm">No documents uploaded yet</p>
                <p className="text-xs sm:text-sm">Documents and media files will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductDetail;