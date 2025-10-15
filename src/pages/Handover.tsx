import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, CheckCircle, Loader2, Plus, Trash } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productRegistryService } from '@/services/productService';
import { checkpointService } from '@/services/checkpointService';
import { shipmentService } from '@/services/shipmentService';
import type { VaccineProduct } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';

const Handover = () => {
  const { user, uuid, role } = useAppStore();
  const queryClient = useQueryClient();

  // Fetch products for this manufacturer via API
  const { data: products = [], isLoading: loadingProducts } = useQuery<VaccineProduct[]>({
    queryKey: ["products", uuid],
    queryFn: () => productRegistryService.getAllProducts(uuid ?? ''),
    enabled: !!uuid && role === 'MANUFACTURER',
  });

  // Checkpoints: manufacturer sees all, others see own
  const { data: checkpoints = [], isLoading: loadingCheckpoints } = useQuery({
    queryKey: ['checkpoints', role, uuid],
    queryFn: () => (role === 'MANUFACTURER' ? checkpointService.getAll() : checkpointService.getByOwner(uuid ?? '')),
    enabled: !!uuid,
  });

  // Incoming shipments for Supplier/Warehouse
  const { data: incoming = [], isLoading: loadingIncoming } = useQuery({
    queryKey: ['incomingShipments', uuid],
    queryFn: () => shipmentService.getIncoming(uuid ?? ''),
    enabled: !!uuid && (role === 'SUPPLIER' || role === 'WAREHOUSE'),
  });

  // Manufacturer shipments list
  const { data: myShipments = [], isLoading: loadingMyShipments } = useQuery({
    queryKey: ['myShipments', uuid],
    queryFn: () => shipmentService.getByManufacturer(uuid ?? ''),
    enabled: !!uuid && role === 'MANUFACTURER',
  });

  // Mock recent handovers
  const recentHandovers = [
    {
      id: 'h1',
      productId: 'prod-001',
      productName: 'Organic Coffee Beans',
      from: '0x742d35Cc6634C0532925a3b8D8b5C4e0c5E42F2B',
      to: '0x8ba1f109551bD432803012645Hac136c30c6213c',
      timestamp: Date.now() - 3600000,
      status: 'completed',
      checkpoint: 'Central Warehouse'
    },
    {
      id: 'h2',
      productId: 'prod-002',
      productName: 'Premium Tea Selection',
      from: '0x8ba1f109551bD432803012645Hac136c30c6213c',
      to: '0x456d35Cc6634C0532925a3b8D8b5C4e0c5E42F2B',
      timestamp: Date.now() - 7200000,
      status: 'pending',
      checkpoint: 'Distribution Center'
    },
  ];

  const userProducts = products || [];

  // Manufacturer shipment builder state
  const [destUUID, setDestUUID] = useState('');
  const [itemsQty, setItemsQty] = useState<Record<string, string>>({});
  const [legs, setLegs] = useState<Array<{ startId: string; endId: string; estArrival: string; expectedShip: string; timeTolerance: string; requiredAction: string }>>([
    { startId: '', endId: '', estArrival: '', expectedShip: '', timeTolerance: '', requiredAction: '' },
  ]);
  const [createOpen, setCreateOpen] = useState(false);

  const createShipment = useMutation({
    mutationFn: shipmentService.create,
    onSuccess: () => {
      toast.success('Shipment created');
      setDestUUID('');
      setItemsQty({});
      setLegs([{ startId: '', endId: '', estArrival: '', expectedShip: '', timeTolerance: '', requiredAction: '' }]);
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['myShipments'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Failed to create shipment'),
  });

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    const shipmentItems = Object.entries(itemsQty)
      .map(([pid, q]) => ({ product_uuid: pid, quantity: Number(q) }))
      .filter((x) => x.quantity > 0);
    if (shipmentItems.length === 0) return toast.error('Add at least one product with quantity');
    if (!destUUID.trim()) return toast.error('Enter destination party UUID');

    const toISO = (s: string) => {
      if (!s) return '';
      try { return new Date(s).toISOString(); } catch { return s; }
    };
    const checkpointsPayload = legs
      .filter((l) => l.startId && l.endId)
      .map((l) => ({
        start_checkpoint_id: isFinite(Number(l.startId)) ? Number(l.startId) : l.startId,
        end_checkpoint_id: isFinite(Number(l.endId)) ? Number(l.endId) : l.endId,
        estimated_arrival_date: toISO(l.estArrival),
        time_tolerance: l.timeTolerance || '2h',
        expected_ship_date: toISO(l.expectedShip),
        required_action: l.requiredAction || 'None',
      }));
    if (checkpointsPayload.length === 0) return toast.error('Add at least one route checkpoint leg');

    createShipment.mutate({
      manufacturerUUID: uuid!,
      destinationPartyUUID: destUUID.trim(),
      shipmentItems,
      checkpoints: checkpointsPayload,
    });
  };

  const acceptShipment = useMutation({
    mutationFn: shipmentService.accept,
    onSuccess: () => {
      toast.success('Shipment accepted');
      queryClient.invalidateQueries({ queryKey: ['incomingShipments'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Failed to accept shipment'),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Shipments</h1>
          <p className="text-muted-foreground">Transfer custody across the supply chain</p>
        </div>
        {role === 'MANUFACTURER' && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> New Shipment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Shipment</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateShipment} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Destination Party UUID</label>
                  <Input placeholder="DST-003" value={destUUID} onChange={(e) => setDestUUID(e.target.value)} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Select Products</p>
                  {loadingProducts ? (
                    <div className="py-4 text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading products...</div>
                  ) : userProducts.length === 0 ? (
                    <p className="text-muted-foreground">No products available</p>
                  ) : (
                    <div className="max-h-56 overflow-y-auto space-y-2">
                      {userProducts.map((p) => (
                        <div key={p.id} className="flex items-center gap-2 text-sm">
                          <span className="flex-1 truncate">{p.productName}</span>
                          <Input type="number" min={0} placeholder="qty" className="w-24" value={itemsQty[p.id] ?? ''} onChange={(e) => setItemsQty((m) => ({ ...m, [p.id]: e.target.value }))} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Route Checkpoint Legs</p>
                  {loadingCheckpoints ? (
                    <div className="py-4 text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading checkpoints...</div>
                  ) : (checkpoints as any[]).length === 0 ? (
                    <p className="text-muted-foreground">No checkpoints found</p>
                  ) : (
                    <div className="space-y-3">
                      {legs.map((leg, idx) => (
                        <div key={idx} className="border rounded-md p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Start Checkpoint</label>
                            <Select value={leg.startId} onValueChange={(v) => setLegs((arr) => arr.map((l, i) => i === idx ? { ...l, startId: v } : l))}>
                              <SelectTrigger><SelectValue placeholder="Select start" /></SelectTrigger>
                              <SelectContent>
                                {(checkpoints as any[]).map((c: any) => (
                                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">End Checkpoint</label>
                            <Select value={leg.endId} onValueChange={(v) => setLegs((arr) => arr.map((l, i) => i === idx ? { ...l, endId: v } : l))}>
                              <SelectTrigger><SelectValue placeholder="Select end" /></SelectTrigger>
                              <SelectContent>
                                {(checkpoints as any[]).map((c: any) => (
                                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Expected Ship Date</label>
                            <Input type="datetime-local" value={leg.expectedShip} onChange={(e) => setLegs((arr) => arr.map((l, i) => i === idx ? { ...l, expectedShip: e.target.value } : l))} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Estimated Arrival</label>
                            <Input type="datetime-local" value={leg.estArrival} onChange={(e) => setLegs((arr) => arr.map((l, i) => i === idx ? { ...l, estArrival: e.target.value } : l))} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Time Tolerance</label>
                            <Input placeholder="2h" value={leg.timeTolerance} onChange={(e) => setLegs((arr) => arr.map((l, i) => i === idx ? { ...l, timeTolerance: e.target.value } : l))} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Required Action</label>
                            <Input placeholder="Temperature check" value={leg.requiredAction} onChange={(e) => setLegs((arr) => arr.map((l, i) => i === idx ? { ...l, requiredAction: e.target.value } : l))} />
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="secondary" size="sm" onClick={() => setLegs((arr) => [...arr, { startId: '', endId: '', estArrival: '', expectedShip: '', timeTolerance: '', requiredAction: '' }])}><Plus className="w-4 h-4 mr-1" /> Add Leg</Button>
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={createShipment.isPending} className="w-full">{createShipment.isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>) : 'Create Shipment'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Manufacturer view: create shipment and review products */}
      {role === 'MANUFACTURER' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Create Shipment</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreateShipment} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Destination Party UUID</label>
                  <Input placeholder="DST-003" value={destUUID} onChange={(e) => setDestUUID(e.target.value)} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Select Products</p>
                  {loadingProducts ? (
                    <div className="py-4 text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading products...</div>
                  ) : userProducts.length === 0 ? (
                    <p className="text-muted-foreground">No products available</p>
                  ) : (
                    <div className="max-h-56 overflow-y-auto space-y-2">
                      {userProducts.map((p) => (
                        <div key={p.id} className="flex items-center gap-2 text-sm">
                          <span className="flex-1 truncate">{p.productName}</span>
                          <Input type="number" min={0} placeholder="qty" className="w-24" value={itemsQty[p.id] ?? ''} onChange={(e) => setItemsQty((m) => ({ ...m, [p.id]: e.target.value }))} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Route Checkpoint Legs</p>
                  {loadingCheckpoints ? (
                    <div className="py-4 text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading checkpoints...</div>
                  ) : (checkpoints as any[]).length === 0 ? (
                    <p className="text-muted-foreground">No checkpoints found</p>
                  ) : (
                    <div className="space-y-3">
                      {legs.map((leg, idx) => (
                        <div key={idx} className="border rounded-md p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Start Checkpoint</label>
                            <Select value={leg.startId} onValueChange={(v) => setLegs((arr) => arr.map((l, i) => i === idx ? { ...l, startId: v } : l))}>
                              <SelectTrigger><SelectValue placeholder="Select start" /></SelectTrigger>
                              <SelectContent>
                                {(checkpoints as any[]).map((c: any) => (
                                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">End Checkpoint</label>
                            <Select value={leg.endId} onValueChange={(v) => setLegs((arr) => arr.map((l, i) => i === idx ? { ...l, endId: v } : l))}>
                              <SelectTrigger><SelectValue placeholder="Select end" /></SelectTrigger>
                              <SelectContent>
                                {(checkpoints as any[]).map((c: any) => (
                                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Expected Ship Date</label>
                            <Input type="datetime-local" value={leg.expectedShip} onChange={(e) => setLegs((arr) => arr.map((l, i) => i === idx ? { ...l, expectedShip: e.target.value } : l))} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Estimated Arrival</label>
                            <Input type="datetime-local" value={leg.estArrival} onChange={(e) => setLegs((arr) => arr.map((l, i) => i === idx ? { ...l, estArrival: e.target.value } : l))} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Time Tolerance</label>
                            <Input placeholder="2h" value={leg.timeTolerance} onChange={(e) => setLegs((arr) => arr.map((l, i) => i === idx ? { ...l, timeTolerance: e.target.value } : l))} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Required Action</label>
                            <Input placeholder="Temperature check" value={leg.requiredAction} onChange={(e) => setLegs((arr) => arr.map((l, i) => i === idx ? { ...l, requiredAction: e.target.value } : l))} />
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                            {legs.length > 1 && (
                              <Button type="button" variant="outline" size="sm" onClick={() => setLegs((arr) => arr.filter((_, i) => i !== idx))}>
                                <Trash className="w-4 h-4 mr-1" /> Remove Leg
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="secondary" size="sm" onClick={() => setLegs((arr) => [...arr, { startId: '', endId: '', estArrival: '', expectedShip: '', timeTolerance: '', requiredAction: '' }])}>
                        <Plus className="w-4 h-4 mr-1" /> Add Leg
                      </Button>
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={createShipment.isPending} className="w-full">
                  {createShipment.isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>) : 'Create Shipment'}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Your Products</CardTitle></CardHeader>
            <CardContent>
              {loadingProducts ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
              ) : userProducts.length === 0 ? (
                <p className="text-muted-foreground">No products</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {userProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-xs text-muted-foreground">ID: {product.id}</p>
                      </div>
                      <Badge variant="secondary">{(product as any).status ?? 'UNKNOWN'}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>My Shipments</CardTitle></CardHeader>
            <CardContent>
              {loadingMyShipments ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
              ) : (myShipments as any[]).length === 0 ? (
                <p className="text-muted-foreground">No shipments yet</p>
              ) : (
                <div className="space-y-3 max-h-[28rem] overflow-y-auto">
                  {(myShipments as any[]).map((s: any) => (
                    <div key={s.id} className="border rounded-lg p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Shipment: {s.id}</p>
                          <p className="text-xs text-muted-foreground">To: {s.destinationPartyUUID ?? s.toUUID}</p>
                        </div>
                        <Badge variant={s.status === 'PREPARING' ? 'outline' : 'secondary'}>{s.status ?? 'PREPARING'}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>Items: {(s.shipmentItems?.length ?? s.productIds?.length ?? 0)}</span>
                        <span>Legs: {(s.checkpoints?.length ?? s.checkpointIds?.length ?? 0)}</span>
                      </div>
                      <div className="flex justify-end gap-2">
                        <ViewShipmentButton shipmentId={s.id} />
                        <EditShipmentButton shipment={s} checkpoints={checkpoints as any[]} onUpdated={() => queryClient.invalidateQueries({ queryKey: ['myShipments'] })} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {(role === 'SUPPLIER' || role === 'WAREHOUSE') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Incoming Shipments</CardTitle></CardHeader>
            <CardContent>
              {loadingIncoming ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
              ) : (incoming as any[]).length === 0 ? (
                <p className="text-muted-foreground">No incoming shipments</p>
              ) : (
                <div className="space-y-3">
                  {(incoming as any[]).map((s: any) => (
                    <div key={s.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Shipment: {s.id}</p>
                          <p className="text-xs text-muted-foreground">Products: {(s.productIds || []).length}</p>
                        </div>
                        <Badge variant={s.status === 'PREPARING' ? 'outline' : 'secondary'}>{s.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>From: {s.fromUUID}</span>
                        <span>Checkpoints: {(s.checkpointIds || []).length}</span>
                      </div>
                      <div className="flex justify-end gap-2">
                        <ViewShipmentButton shipmentId={s.id} />
                        <Button size="sm" disabled={acceptShipment.isPending} onClick={() => acceptShipment.mutate(s.id)}>
                          {acceptShipment.isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Accepting...</>) : 'Accept'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Handover Guidelines</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><div><p className="font-medium">Scan QR Code</p><p className="text-muted-foreground">Scan the product QR to verify handover details.</p></div></div>
              <div className="flex gap-3"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><div><p className="font-medium">Verify Sender</p><p className="text-muted-foreground">Confirm the origin and route checkpoints before accepting.</p></div></div>
              <div className="flex gap-3"><div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div><div><p className="font-medium">Record Issues</p><p className="text-muted-foreground">Note any discrepancies or damages during receipt.</p></div></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Handover;

// Inline edit component for shipments
function EditShipmentButton({ shipment, checkpoints, onUpdated }: { shipment: any; checkpoints: any[]; onUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const [dest, setDest] = useState<string>(shipment.destinationPartyUUID ?? shipment.toUUID ?? '');
  const [legs, setLegs] = useState<Array<{ startId: string; endId: string; estArrival: string; expectedShip: string; timeTolerance: string; requiredAction: string }>>(
    (shipment.checkpoints || []).map((c: any) => ({
      startId: String(c.start_checkpoint_id ?? c.startId ?? ''),
      endId: String(c.end_checkpoint_id ?? c.endId ?? ''),
      estArrival: c.estimated_arrival_date ?? c.estArrival ?? '',
      expectedShip: c.expected_ship_date ?? c.expectedShip ?? '',
      timeTolerance: c.time_tolerance ?? c.timeTolerance ?? '',
      requiredAction: c.required_action ?? c.requiredAction ?? '',
    }))
  );

  const qc = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: (payload: any) => shipmentService.update(String(shipment.id), payload),
    onSuccess: () => {
      onUpdated();
      setOpen(false);
    },
  });

  const toISO = (s: string) => {
    if (!s) return '';
    try { return new Date(s).toISOString(); } catch { return s; }
  };

  const handleSave = () => {
    const checkpointsPayload = (legs || [])
      .filter((l) => l.startId && l.endId)
      .map((l) => ({
        start_checkpoint_id: isFinite(Number(l.startId)) ? Number(l.startId) : l.startId,
        end_checkpoint_id: isFinite(Number(l.endId)) ? Number(l.endId) : l.endId,
        estimated_arrival_date: toISO(l.estArrival),
        time_tolerance: l.timeTolerance || '2h',
        expected_ship_date: toISO(l.expectedShip),
        required_action: l.requiredAction || 'None',
      }));
    updateMutation.mutate({ destinationPartyUUID: dest, checkpoints: checkpointsPayload });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Edit</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Shipment</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Destination Party UUID</label>
            <Input value={dest} onChange={(e) => setDest(e.target.value)} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Route Legs</p>
            {(legs || []).map((leg, idx) => (
              <div key={idx} className="border rounded-md p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Start Checkpoint</label>
                  <Select value={leg.startId} onValueChange={(v) => setLegs((arr) => arr.map((l, i) => i === idx ? { ...l, startId: v } : l))}>
                    <SelectTrigger><SelectValue placeholder="Select start" /></SelectTrigger>
                    <SelectContent>
                      {checkpoints.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">End Checkpoint</label>
                  <Select value={leg.endId} onValueChange={(v) => setLegs((arr) => arr.map((l, i) => i === idx ? { ...l, endId: v } : l))}>
                    <SelectTrigger><SelectValue placeholder="Select end" /></SelectTrigger>
                    <SelectContent>
                      {checkpoints.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Expected Ship Date</label>
                  <Input type="datetime-local" value={leg.expectedShip} onChange={(e) => setLegs((arr) => arr.map((l, i) => i === idx ? { ...l, expectedShip: e.target.value } : l))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Estimated Arrival</label>
                  <Input type="datetime-local" value={leg.estArrival} onChange={(e) => setLegs((arr) => arr.map((l, i) => i === idx ? { ...l, estArrival: e.target.value } : l))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Time Tolerance</label>
                  <Input placeholder="2h" value={leg.timeTolerance} onChange={(e) => setLegs((arr) => arr.map((l, i) => i === idx ? { ...l, timeTolerance: e.target.value } : l))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Required Action</label>
                  <Input placeholder="Temperature check" value={leg.requiredAction} onChange={(e) => setLegs((arr) => arr.map((l, i) => i === idx ? { ...l, requiredAction: e.target.value } : l))} />
                </div>
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={() => setLegs((arr) => [...arr, { startId: '', endId: '', estArrival: '', expectedShip: '', timeTolerance: '', requiredAction: '' }])}>
              <Plus className="w-4 h-4 mr-1" /> Add Leg
            </Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Inline view component for shipments
function ViewShipmentButton({ shipmentId }: { shipmentId: string }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['shipment', shipmentId],
    queryFn: () => shipmentService.getById(shipmentId),
    enabled: open,
  });

  const s: any = data || {};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">View</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Shipment Details</DialogTitle></DialogHeader>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div><p className="text-muted-foreground">Shipment ID</p><p className="font-medium break-all">{s.id}</p></div>
              <div><p className="text-muted-foreground">Status</p><p className="font-medium">{s.status ?? 'PREPARING'}</p></div>
              <div><p className="text-muted-foreground">Manufacturer</p><p className="font-medium break-all">{s.manufacturerUUID ?? s.fromUUID}</p></div>
              <div><p className="text-muted-foreground">Destination</p><p className="font-medium break-all">{s.destinationPartyUUID ?? s.toUUID}</p></div>
            </div>

            <div>
              <p className="text-muted-foreground mb-1">Items</p>
              {(s.shipmentItems && s.shipmentItems.length > 0) ? (
                <div className="border rounded-md divide-y">
                  {s.shipmentItems.map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between p-2">
                      <span className="truncate">{it.product_uuid}</span>
                      <span className="text-muted-foreground">x{it.quantity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No items listed</p>
              )}
            </div>

            <div>
              <p className="text-muted-foreground mb-1">Route Checkpoints</p>
              {(s.checkpoints && s.checkpoints.length > 0) ? (
                <div className="border rounded-md divide-y">
                  {s.checkpoints.map((c: any, idx: number) => (
                    <div key={idx} className="p-2 space-y-1">
                      <p className="font-medium text-xs">Leg {idx + 1}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">Start</span>: {c.start_checkpoint_id}</div>
                        <div><span className="text-muted-foreground">End</span>: {c.end_checkpoint_id}</div>
                        <div><span className="text-muted-foreground">Exp Ship</span>: {c.expected_ship_date}</div>
                        <div><span className="text-muted-foreground">ETA</span>: {c.estimated_arrival_date}</div>
                        <div><span className="text-muted-foreground">Tolerance</span>: {c.time_tolerance}</div>
                        <div><span className="text-muted-foreground">Action</span>: {c.required_action}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No checkpoints listed</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
