import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { AlertTable } from "@/components/AlertTable";

export default function SupplierAlertsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Alerts</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor condition breaches during your shipment segments
          </p>
        </div>
      </div>

      {/* Alerts Table */}
      <Card>
        <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
          <AlertTable
            apiEndpoint="/api/alerts/supplier"
            columns={[
              "packageId",
              "alertType",
              "severity",
              "integrity",
              "segmentId",
              "location",
              "breachTime",
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
