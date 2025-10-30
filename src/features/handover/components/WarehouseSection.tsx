import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { handoverUtils, useHandoverSharedContext, useSupplierContext } from "../context";
import { ViewShipmentButton } from "./ViewShipmentButton";

const { normalizeStatus } = handoverUtils;

export function WarehouseSection() {
  const shared = useHandoverSharedContext();
  const supplier = useSupplierContext();

  if (shared.role !== "WAREHOUSE") return null;

  const { incomingShipments, loadingIncoming, acceptingShipmentId } = supplier;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Incoming Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingIncoming ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : incomingShipments.length === 0 ? (
            <p className="text-muted-foreground">No incoming shipments</p>
          ) : (
            <div className="space-y-3">
              {incomingShipments.map((shipment) => (
                <div key={shipment.id} className="space-y-2 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Shipment: {shipment.id}</p>
                      <p className="text-xs text-muted-foreground">
                        Products: {shipment.shipmentItems?.length ?? shipment.items?.length ?? 0}
                      </p>
                    </div>
                    <Badge
                      variant={normalizeStatus(shipment.status) === "PREPARING" ? "outline" : "secondary"}
                    >
                      {shipment.status ?? "PREPARING"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>From: {shipment.fromUUID ?? shipment.manufacturerName ?? "Unknown"}</span>
                    <span>Checkpoints: {shipment.checkpoints?.length ?? 0}</span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <ViewShipmentButton shipmentId={String(shipment.id)} />
                    <Button
                      size="sm"
                      disabled={
                        supplier.acceptShipmentPending && acceptingShipmentId === shipment.id
                      }
                      onClick={() => supplier.acceptShipment(String(shipment.id))}
                    >
                      {supplier.acceptShipmentPending && acceptingShipmentId === shipment.id ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Accepting...
                        </span>
                      ) : (
                        "Accept"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Handover Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
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
