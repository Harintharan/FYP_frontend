import { HandoverProvider, useSupplierContext } from "./context";
import { HandoverHeader } from "./components/HandoverHeader";
import { ManufacturerShipmentsSection } from "./components/ManufacturerShipmentsSection";
import { SupplierSection } from "./components/SupplierSection";
import { WarehouseSection } from "./components/WarehouseSection";
import { RecentHandoversSection } from "./components/RecentHandoversSection";
import { useNotifications } from "@/hooks/useNotifications";
import { useMemo } from "react";

function HandoverContent() {
  const supplier = useSupplierContext();

  // Suppress notifications for shipments/segments currently being accepted
  const suppressionOptions = useMemo(
    () => ({
      suppressNotificationsFor: {
        shipmentIds: supplier.acceptingShipmentId
          ? [supplier.acceptingShipmentId]
          : [],
        segmentIds: supplier.takeoverSegmentId
          ? [supplier.takeoverSegmentId]
          : [],
      },
    }),
    [supplier.acceptingShipmentId, supplier.takeoverSegmentId]
  );

  // Initialize notifications with suppression options
  useNotifications(suppressionOptions);

  return (
    <div className="space-y-4 sm:space-y-6">
      <HandoverHeader />
      <ManufacturerShipmentsSection />
      <SupplierSection />
      <WarehouseSection />
      <RecentHandoversSection />
    </div>
  );
}

export default function HandoverPage() {
  return (
    <HandoverProvider>
      <HandoverContent />
    </HandoverProvider>
  );
}
