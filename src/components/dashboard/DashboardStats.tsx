import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function DashboardStats() {
  const { products, alerts, shipments } = useAppStore();

  const stats = [
    {
      title: 'Total Products',
      value: products.length,
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Active Shipments',
      value: shipments.filter(s => s.status === 'IN_TRANSIT').length,
      icon: Truck,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      title: 'Active Alerts',
      value: alerts.filter(a => !a.acknowledged).length,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      title: 'Doses Administered',
      value: products.filter(p => p.status === 'ADMINISTERED').length,
      icon: CheckCircle,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="shadow-card hover:shadow-floating transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +{Math.floor(Math.random() * 20) + 1}% from last week
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}