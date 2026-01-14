import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Search, CheckCircle, Clock, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { Alert } from '@/types';

const Alerts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { alerts, markAlertAsRead, products } = useAppStore();

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.productId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === 'ALL' || alert.level === levelFilter;
    const matchesStatus = statusFilter === 'ALL' || 
                         (statusFilter === 'READ' && alert.acknowledged) ||
                         (statusFilter === 'unread' && !alert.acknowledged);
    
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const handleMarkAsRead = (alertId: string) => {
    markAlertAsRead(alertId);
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />;
      case 'WARN':
        return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />;
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'destructive';
      case 'WARN':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || productId;
  };

  const levelOptions = ['ALL', 'CRITICAL', 'WARN', 'INFO'];
  const statusOptions = ['ALL', 'unread', 'read'];

  const unreadCount = alerts.filter(a => !a.acknowledged).length;
  const criticalCount = alerts.filter(a => a.level === 'CRITICAL' && !a.acknowledged).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Alerts</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Monitor critical events and anomalies in your supply chain
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} unread
            </Badge>
          )}
          {criticalCount > 0 && (
            <Badge variant="destructive" className="gap-1 text-xs">
              <AlertTriangle className="h-3 w-3" />
              {criticalCount} critical
            </Badge>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm">Unread</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-destructive">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm">Critical</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-destructive">
              {alerts.filter(a => a.level === 'CRITICAL').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm">Warnings</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">
              {alerts.filter(a => a.level === 'WARN').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Level Filter */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {levelOptions.map((level) => (
                  <Button
                    key={level}
                    variant={levelFilter === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLevelFilter(level)}
                    className="text-xs h-8 px-2 sm:px-3"
                  >
                    {level}
                  </Button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {statusOptions.map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="text-xs h-8 px-2 sm:px-3"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 sm:py-12">
            <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-green-500" />
            <p className="text-sm text-muted-foreground">
              {alerts.length === 0 
                ? "No alerts yet. All systems are running smoothly!"
                : "No alerts match your search criteria."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredAlerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`${!alert.acknowledged ? 'border-l-4 border-l-primary' : ''}`}
            >
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0 hidden sm:block">
                    {getAlertIcon(alert.level)}
                  </div>
                  
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <div className="sm:hidden">
                            {getAlertIcon(alert.level)}
                          </div>
                          <Badge variant={getAlertColor(alert.level) as any} className="text-xs">
                            {alert.level}
                          </Badge>
                          {!alert.acknowledged && (
                            <Badge variant="outline" className="text-[10px] sm:text-xs">
                              Unread
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-sm sm:text-base lg:text-lg line-clamp-2">{alert.message}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          Product: {getProductName(alert.productId)}
                        </p>
                      </div>
                      
                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1 flex-shrink-0">
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {new Date(alert.ts).toLocaleDateString()}
                        </span>
                        {!alert.acknowledged && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsRead(alert.id)}
                            className="gap-1 text-xs h-7 sm:h-8"
                          >
                            <CheckCircle className="h-3 w-3" />
                            <span className="hidden sm:inline">Mark as Read</span>
                            <span className="sm:hidden">Read</span>
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-sm text-muted-foreground">
                      <span className="truncate max-w-[150px] sm:max-w-none">ID: {alert.productId.slice(0, 8)}...</span>
                      {alert.acknowledged && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>Acknowledged</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;