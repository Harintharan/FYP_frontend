import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHandoverSharedContext } from "../context";
import { formatDistanceToNow } from "date-fns";

export function RecentHandoversSection() {
  const shared = useHandoverSharedContext();
  const { recentHandovers } = shared;

  if (recentHandovers.length === 0) return null;

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">Recent handovers</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 p-3 sm:p-6 pt-0 sm:pt-0">
        {recentHandovers.map((handover) => (
          <div
            key={handover.id}
            className="rounded-lg border border-border/60 bg-muted/20 p-3 sm:p-4 text-xs sm:text-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3">
              <p className="font-medium text-foreground truncate">{handover.productName}</p>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {formatDistanceToNow(handover.timestamp, { addSuffix: true })}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              From {handover.from.slice(0, 6)}… to {handover.to.slice(0, 6)}…
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Checkpoint: {handover.checkpoint}
            </p>
            <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs uppercase text-primary">{handover.status}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
