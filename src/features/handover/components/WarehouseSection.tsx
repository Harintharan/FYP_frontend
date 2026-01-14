import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { handoverUtils, useHandoverSharedContext, useSupplierContext } from "../context";
import { ViewShipmentButton } from "./ViewShipmentButton";
import type { SupplierShipmentRecord } from "../types";

const { normalizeStatus } = handoverUtils;

export function WarehouseSection() {
  const shared = useHandoverSharedContext();
  const supplier = useSupplierContext();

  if (shared.role !== "WAREHOUSE") return null;

  const { incomingShipments, loadingIncoming, acceptingShipmentId } = supplier;

  const resolveSegmentId = (shipment: SupplierShipmentRecord) => shipment.segmentId ?? shipment.id;
  const resolveShipmentId = (shipment: SupplierShipmentRecord) =>
    shipment.shipmentId ?? shipment.segmentId ?? shipment.id;

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Incoming Shipments</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {loadingIncoming ? (
            <div className="flex items-center gap-2 py-6 sm:py-8 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : incomingShipments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No incoming shipments</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {incomingShipments.map((shipment) => {
                const segmentId = resolveSegmentId(shipment);
                const shipmentId = resolveShipmentId(shipment);
                return (
                  <div key={segmentId} className="space-y-2 rounded-lg border p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium">Shipment: {shipmentId}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Products: {shipment.shipmentItems?.length ?? shipment.items?.length ?? 0}
                        </p>
                      </div>
                    <Badge
                      variant={normalizeStatus(shipment.status) === "PREPARING" ? "outline" : "secondary"}
                      className="text-xs self-start sm:self-auto"
                    >
                      {shipment.status ?? "PREPARING"}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-[10px] sm:text-xs text-muted-foreground">
                    <span className="truncate">From: {shipment.fromUUID ?? shipment.manufacturerName ?? "Unknown"}</span>
                    <span>Checkpoints: {shipment.checkpoints?.length ?? 0}</span>
                  </div>
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                      <ViewShipmentButton segmentId={segmentId} shipmentId={String(shipmentId)} />
                      <Button
                        size="sm"
                        className="h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto"
                        disabled={
                          supplier.acceptShipmentPending && acceptingShipmentId === segmentId
                        }
                        onClick={() => supplier.acceptShipment(String(segmentId))}
                      >
                        {supplier.acceptShipmentPending && acceptingShipmentId === segmentId ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                            Accepting...
                          </span>
                        ) : (
                          "Accept"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Handover Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 text-xs sm:text-sm p-3 sm:p-6 pt-0 sm:pt-0">
          <GuidelineItem
            title="Scan QR Code"
            description="Scan the product QR to verify handover details."
          />
          <GuidelineItem
            title="Verify Sender"
            description="Confirm the origin and route checkpoints before accepting."
          />
          <GuidelineItem
            title="Record Issues"
            description="Note any discrepancies or damages during receipt."
          />
        </CardContent>
      </Card>
    </div>
  );
}

function GuidelineItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
