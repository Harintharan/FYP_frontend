import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2, MapPin } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { checkpointService, type Checkpoint } from '@/services/checkpointService';
import { toast } from 'sonner';

export default function Checkpoints() {
  const { uuid, role } = useAppStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: checkpoints = [], isLoading } = useQuery<Checkpoint[]>({
    queryKey: ['checkpoints', uuid],
    queryFn: () => checkpointService.getByOwner(uuid ?? ''),
    enabled: !!uuid,
  });

  const [form, setForm] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    state: '',
    country: '',
  });

  const createMutation = useMutation({
    mutationFn: checkpointService.create,
    onSuccess: () => {
      toast.success('Checkpoint created');
      queryClient.invalidateQueries({ queryKey: ['checkpoints'] });
      setForm({ name: '', address: '', latitude: '', longitude: '', state: '', country: '' });
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to create checkpoint');
    },
  });

  const validate = () => {
    if (!form.name.trim()) return 'Name is required';
    if (!form.address.trim()) return 'Address is required';
    if (!form.latitude.trim() || isNaN(Number(form.latitude))) return 'Latitude must be a number string';
    if (!form.longitude.trim() || isNaN(Number(form.longitude))) return 'Longitude must be a number string';
    if (!uuid) return 'Owner UUID missing';
    if (!role) return 'Owner role is required';
    return null;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) return toast.error(err);
    createMutation.mutate({
      name: form.name.trim(),
      address: form.address.trim(),
      latitude: form.latitude.trim(),
      longitude: form.longitude.trim(),
      state: form.state.trim() || undefined,
      country: form.country.trim() || undefined,
      ownerUUID: uuid!,
      ownerType: role || 'WAREHOUSE',
      checkpointType: 'WAREHOUSE',
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Checkpoints</h1>
          <p className="text-muted-foreground">Manage facility and route checkpoints</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> New Checkpoint</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Checkpoint</DialogTitle>
              <DialogDescription>Register a new operational checkpoint</DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Colombo Port Warehouse" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Address</label>
                <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Dockyard Road, Colombo 01" />
              </div>
              <div>
                <label className="text-sm font-medium">Latitude</label>
                <Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="6.9370" />
              </div>
              <div>
                <label className="text-sm font-medium">Longitude</label>
                <Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="79.8500" />
              </div>
              <div>
                <label className="text-sm font-medium">State/Province</label>
                <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="Western Province" />
              </div>
              <div>
                <label className="text-sm font-medium">Country</label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Sri Lanka" />
              </div>
              {/* Owner UUID, Owner Type, and Checkpoint Type are derived from store and role */}
              <div className="md:col-span-2">
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>) : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Checkpoints</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : checkpoints.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No checkpoints found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {checkpoints.map((cp) => (
                <div key={cp.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <MapPin className="w-4 h-4" />
                    <span>{cp.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{cp.address}</p>
                  <p className="text-xs text-muted-foreground">{cp.latitude}, {cp.longitude}</p>
                  <p className="text-xs text-muted-foreground">{cp.state ?? ''} {cp.country ?? ''}</p>
                  <p className="text-xs">Type: {cp.checkpointType}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
