import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, MapPin } from "lucide-react";
import { useAppStore } from "@/lib/store";
import {
  checkpointService,
  type Checkpoint,
} from "@/services/checkpointService";
import { useAppToast } from "@/hooks/useAppToast";

export default function Checkpoints() {
  const { uuid, role } = useAppStore();
  const { showSuccess, showError } = useAppToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: checkpoints = [], isLoading } = useQuery<Checkpoint[]>({
    queryKey: ["checkpoints", uuid],
    queryFn: () => checkpointService.getByOwner(uuid ?? ""),
    enabled: !!uuid,
  });

  const [form, setForm] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    state: "",
    country: "",
  });

  const createMutation = useMutation({
    mutationFn: checkpointService.create,
    onSuccess: () => {
      showSuccess("Checkpoint created");
      queryClient.invalidateQueries({ queryKey: ["checkpoints"] });
      setForm({
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        state: "",
        country: "",
      });
      setOpen(false);
    },
    onError: (err: any) => {
      showError(err?.response?.data?.error || "Failed to create checkpoint");
    },
  });

  const validate = () => {
    if (!form.name.trim()) return "Name is required";
    if (!form.address.trim()) return "Address is required";
    if (!form.latitude.trim() || isNaN(Number(form.latitude)))
      return "Latitude must be a number string";
    if (!form.longitude.trim() || isNaN(Number(form.longitude)))
      return "Longitude must be a number string";
    if (!uuid) return "Owner UUID missing";
    if (!role) return "Owner role is required";
    return null;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) return showError(err);
    createMutation.mutate({
      name: form.name.trim(),
      address: form.address.trim(),
      latitude: form.latitude.trim(),
      longitude: form.longitude.trim(),
      state: form.state.trim() || undefined,
      country: form.country.trim() || undefined,
      ownerUUID: uuid!,
      ownerType: role || "WAREHOUSE",
      checkpointType: "WAREHOUSE",
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Checkpoints</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage facility and route checkpoints
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 h-9 sm:h-10 text-sm w-full sm:w-auto">
              <Plus className="w-4 h-4" /> New Checkpoint
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-2 w-[calc(100%-1rem)] sm:w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto rounded-xl sm:rounded-lg p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Create Checkpoint</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Register a new operational checkpoint
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={onSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-2">
              <div className="md:col-span-2">
                <label className="text-xs sm:text-sm font-medium">Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Colombo Port Warehouse"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs sm:text-sm font-medium">Address</label>
                <Textarea
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Dockyard Road, Colombo 01"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium">Latitude</label>
                <Input
                  value={form.latitude}
                  onChange={(e) =>
                    setForm({ ...form, latitude: e.target.value })
                  }
                  placeholder="6.9370"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium">Longitude</label>
                <Input
                  value={form.longitude}
                  onChange={(e) =>
                    setForm({ ...form, longitude: e.target.value })
                  }
                  placeholder="79.8500"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium">State/Province</label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="Western Province"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium">Country</label>
                <Input
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  placeholder="Sri Lanka"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              {/* Owner UUID, Owner Type, and Checkpoint Type are derived from store and role */}
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  className="w-full h-9 sm:h-10 text-sm"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">My Checkpoints</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {isLoading ? (
            <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm">Loading...</p>
          ) : checkpoints.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm">
              No checkpoints found.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {checkpoints.map((cp) => (
                <div key={cp.id} className="border rounded-lg p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-2 font-medium text-sm sm:text-base">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="truncate">{cp.name}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{cp.address}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {cp.latitude}, {cp.longitude}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {cp.state ?? ""} {cp.country ?? ""}
                  </p>
                  <p className="text-[10px] sm:text-xs">Type: {cp.checkpointType}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
