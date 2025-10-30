import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHandoverSharedContext } from "../context";
import { formatDistanceToNow } from "date-fns";

export function RecentHandoversSection() {
  const shared = useHandoverSharedContext();
  const { recentHandovers } = shared;

  if (recentHandovers.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent handovers</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {recentHandovers.map((handover) => (
          <div
            key={handover.id}
            className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-foreground">{handover.productName}</p>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(handover.timestamp, { addSuffix: true })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              From {handover.from.slice(0, 6)}… to {handover.to.slice(0, 6)}…
            </p>
            <p className="text-xs text-muted-foreground">
              Checkpoint: {handover.checkpoint}
            </p>
            <p className="mt-2 text-xs uppercase text-primary">{handover.status}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
