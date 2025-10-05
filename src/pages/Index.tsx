import { useEffect } from "react";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { mockProducts, mockUsers, mockAlerts, generateMockTelemetry } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const {
    user,
    products,
    alerts,
    setUser,
    addProduct,
    addAlert,
    addTelemetryPoint,
  } = useAppStore();

  // Initialize mock data (for demo)
  useEffect(() => {
    if (!user) {
      setUser(mockUsers[0]); // Default manufacturer
    }

    if (products.length === 0) {
      mockProducts.forEach(addProduct);
      mockAlerts.forEach(addAlert);
      mockProducts.forEach((product) => {
        const telemetry = generateMockTelemetry(product.id, 12);
        telemetry.forEach((point) => addTelemetryPoint(product.id, point));
      });
    }
  }, [user, products.length, setUser, addProduct, addAlert, addTelemetryPoint]);

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Supply Chain Dashboard</h1>
        <p className="text-muted-foreground">
          Track and monitor your products across the entire supply chain
        </p>
      </div>

      {/* Stats Section */}
      <DashboardStats />

      {/* Recent Products & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Products */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.batchNumber}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/products/${p.id}`)}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      alert.level === "CRITICAL"
                        ? "bg-destructive"
                        : alert.level === "WARN"
                        ? "bg-warning"
                        : "bg-secondary"
                    }`}
                  />
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
};

export default Index;
