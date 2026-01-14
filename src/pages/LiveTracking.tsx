import { useState } from "react";
import { MapTracker } from "@/components/map/MapTracker";
import { TelemetryChart } from "@/components/charts/TelemetryChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Thermometer, MapPin, Clock, Package } from "lucide-react";
import type { TelemetryPoint } from "@/types";

const mockTelemetryData: TelemetryPoint[] = [
  { lat: 40.7128, lng: -74.006, tempC: 4.2, ts: Date.now() - 3600000, compliant: true },
  { lat: 40.758, lng: -73.9855, tempC: 3.8, ts: Date.now() - 2700000, compliant: true },
  { lat: 40.7614, lng: -73.9776, tempC: 4.5, ts: Date.now() - 1800000, compliant: true },
  { lat: 40.7489, lng: -73.968, tempC: 3.5, ts: Date.now() - 900000, compliant: true },
  { lat: 40.7306, lng: -73.9352, tempC: 4.1, ts: Date.now(), compliant: true },
];

const activeShipments = [
  {
    id: "SHP-001",
    product: "Pfizer-BioNTech COVID-19",
    batchNumber: "PF-2024-001",
    currentTemp: 4.1,
    status: "in-transit",
    destination: "NYC Health Center",
    eta: "2 hours",
  },
  {
    id: "SHP-002",
    product: "Moderna COVID-19",
    batchNumber: "MD-2024-015",
    currentTemp: -18.5,
    status: "in-transit",
    destination: "Boston Medical",
    eta: "4 hours",
  },
];

export default function LiveTracking() {
  const [selectedShipment, setSelectedShipment] = useState(activeShipments[0]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">Live Tracking</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Monitor vaccine shipments in real-time with GPS and temperature tracking
        </p>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="map" className="space-y-3 sm:space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="map" className="flex-1 sm:flex-none text-xs sm:text-sm">Map View</TabsTrigger>
          <TabsTrigger value="telemetry" className="flex-1 sm:flex-none text-xs sm:text-sm">Temperature</TabsTrigger>
        </TabsList>

        {/* --- MAP TAB --- */}
        <TabsContent value="map" className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {/* Map Section */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <Card>
                <CardHeader className="p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-sm sm:text-base">Shipment Location</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                  <div className="h-[300px] sm:h-[400px] lg:h-[500px]">
                    <MapTracker telemetryData={mockTelemetryData} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Shipments + Details */}
            <div className="space-y-3 sm:space-y-4 order-1 lg:order-2">
              <Card>
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="text-sm sm:text-base">Active Shipments</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0 space-y-2 sm:space-y-3">
                  {activeShipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedShipment.id === shipment.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-accent"
                      }`}
                      onClick={() => setSelectedShipment(shipment)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm sm:text-base">{shipment.id}</span>
                        <Badge variant="outline" className="text-[10px] sm:text-xs">{shipment.status}</Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-1">
                        {shipment.product}
                      </p>
                      <div className="space-y-1 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span>{shipment.currentTemp}°C</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="truncate">{shipment.destination}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span>ETA: {shipment.eta}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="text-sm sm:text-base">Shipment Details</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0 space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground">Product</p>
                      <p className="font-medium text-xs sm:text-sm truncate">{selectedShipment.product}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Batch Number</p>
                    <p className="font-medium text-xs sm:text-sm">{selectedShipment.batchNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Current Temperature</p>
                    <p className="font-medium text-xl sm:text-2xl">
                      {selectedShipment.currentTemp}°C
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Status</p>
                    <Badge className="mt-1 text-xs">{selectedShipment.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* --- TELEMETRY TAB --- */}
        <TabsContent value="telemetry" className="space-y-3 sm:space-y-4">
          <TelemetryChart
            data={mockTelemetryData}
            temperatureUnit="C"
            minTemp={2}
            maxTemp={8}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
