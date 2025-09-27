import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QrCode, MapPin, Thermometer, Clock } from 'lucide-react';
import type { VaccineProduct } from '@/types';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: VaccineProduct;
  onViewDetails: (product: VaccineProduct) => void;
  onGenerateQR?: (product: VaccineProduct) => void;
}

export function ProductCard({ product, onViewDetails, onGenerateQR }: ProductCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'MANUFACTURED': return 'bg-muted text-muted-foreground';
      case 'IN_COLD_STORAGE': return 'bg-primary/10 text-primary border-primary/20';
      case 'IN_TRANSIT': return 'bg-warning/10 text-warning border-warning/20';
      case 'AT_FACILITY': return 'status-ok';
      case 'ADMINISTERED': return 'status-ok';
      case 'EXPIRED': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'RECALLED': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatAddress = (address?: `0x${string}`) => {
    if (!address) return 'Unassigned';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card className="shadow-card hover:shadow-floating transition-all duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {product.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Batch: {product.batchNumber}
            </p>
          </div>
          <Badge className={cn("text-xs", getStatusColor(product.status))}>
            {product.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Exp Date</p>
              <p className="font-medium">{formatDate(product.expirationDate)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Current Holder</p>
              <p className="font-medium text-xs">{formatAddress(product.currentHolder)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Thermometer className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-muted-foreground">Storage</p>
            <p className="font-medium">{product.temperatureRange.min}°{product.temperatureRange.unit} to {product.temperatureRange.max}°{product.temperatureRange.unit}</p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            onClick={() => onViewDetails(product)}
            className="flex-1"
          >
            View Details
          </Button>
          
          {onGenerateQR && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onGenerateQR(product)}
            >
              <QrCode className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}