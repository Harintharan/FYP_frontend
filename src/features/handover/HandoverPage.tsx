import { HandoverProvider } from "./context";
import { HandoverHeader } from "./components/HandoverHeader";
import { ManufacturerSection } from "./components/ManufacturerSection";
import { SupplierSection } from "./components/SupplierSection";
import { WarehouseSection } from "./components/WarehouseSection";
import { RecentHandoversSection } from "./components/RecentHandoversSection";

function HandoverContent() {
  return (
    <div className="space-y-6">
      <HandoverHeader />
      <ManufacturerSection />
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
