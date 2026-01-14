import { useHandoverSharedContext, useManufacturerContext } from "../context";
import { CreateShipmentDialog } from "./CreateShipmentDialog";

export function HandoverHeader() {
  const shared = useHandoverSharedContext();
  const manufacturer = useManufacturerContext();

  return (
    <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Product Shipments</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Transfer custody across the supply chain</p>
      </div>
      {manufacturer.enabled && shared.role === "MANUFACTURER" ? <CreateShipmentDialog /> : null}
    </div>
  );
}
