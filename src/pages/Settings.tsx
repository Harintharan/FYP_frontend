import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, User, Wifi, Thermometer, Moon, Save } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';


const Settings = () => {
  const {
    user,
    temperatureUnit,
    darkMode,
    realtimeSource,
    setTemperatureUnit,
    setDarkMode,
    setRealtimeSource,
    setUser
  } = useAppStore();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState({
    type: '',
    identification: {
      publicKey: '',
      legalName: '',
      businessRegNo: '',
      countryOfIncorporation: ''
    },
    contact: {
      personName: '',
      designation: '',
      email: '',
      phone: '',
      address: ''
    },
    metadata: {
      publicKey: '',
      smartContractRole: '',
      dateOfRegistration: ''
    },
    details: {
      productCategoriesManufactured: [],
      certifications: []
    },
    checkpoint: {
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      state: '',
      country: ''
    }
  }); // Placeholder for future use


  const [localSettings, setLocalSettings] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    organization: user?.organization || '',
    licenseNumber: user?.licenseNumber || '',
    rpcUrl: 'https://sepolia.infura.io/v3/demo',
    wsUrl: 'wss://ws.example.com/telemetry',
    mqttUrl: 'wss://mqtt.example.com:8083/mqtt',
  });

  const handleOpenEdit = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const userId = user?.id;
      const response = await fetch(`http://localhost:5000/api/registrations/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();
      setEditData({
        type: data.type || '',
        identification: {
          publicKey: data.identification?.publicKey || '',
          legalName: data.identification?.legalName || '',
          businessRegNo: data.identification?.businessRegNo || '',
          countryOfIncorporation: data.identification?.countryOfIncorporation || ''
        },
        contact: {
          personName: data.contact?.personName || '',
          designation: data.contact?.designation || '',
          email: data.contact?.email || '',
          phone: data.contact?.phone || '',
          address: data.contact?.address || ''
        },
        metadata: {
          publicKey: data.metadata?.publicKey || '',
          smartContractRole: data.metadata?.smartContractRole || '',
          dateOfRegistration: data.metadata?.dateOfRegistration || ''
        },
        details: {
          productCategoriesManufactured: data.details?.productCategoriesManufactured || [],
          certifications: data.details?.certifications || []
        },
        checkpoint: {
          name: data.checkpoint?.name || '',
          address: data.checkpoint?.address || '',
          latitude: data.checkpoint?.latitude || '',
          longitude: data.checkpoint?.longitude || '',
          state: data.checkpoint?.state || '',
          country: data.checkpoint?.country || ''
        }
      });

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    setLoading(true);

    try {
      const userId = user?.address || 'userid';

      const response = await fetch(`http://localhost:5000/api/registrations/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData)
      });

      if (!response.ok) {
        throw new Error('Failed to update user data');
      }

      const updatedData = await response.json();

      toast({
        title: "Success",
        description: "Your details have been updated successfully",
      });

      setOpen(false);

      // Optionally update local user state if needed
      if (user) {
        setUser({
          ...user,
          displayName: editData.contact.personName,
          email: editData.contact.email,
          organization: editData.identification.legalName,
        });
      }

    } catch (error) {
      console.error('Error updating user data:', error);
      toast({
        title: "Error",
        description: "Failed to update details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const handleSaveProfile = () => {
    if (user) {
      setUser({
        ...user,
        displayName: localSettings.displayName,
        email: localSettings.email,
        organization: localSettings.organization,
        licenseNumber: localSettings.licenseNumber,
      });
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully",
      });
    }
  };

  const handleSaveConnections = () => {
    toast({
      title: "Connection Settings Saved",
      description: "Connection preferences have been updated",
    });
  };

  const realtimeOptions = [
    { value: 'Mock', label: 'Mock Data', description: 'Use simulated data for demo' },
    { value: 'WebSocket', label: 'WebSocket', description: 'Real-time WebSocket connection' },
    { value: 'MQTT', label: 'MQTT', description: 'MQTT broker connection' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your application preferences and connection settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Profile */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </CardTitle>
            <Button variant="outline" size="sm" className="gap-1" onClick={handleSaveEdit}>
              <SettingsIcon className="h-4 w-4" />
              Edit
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit User Details</DialogTitle>
                </DialogHeader>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <div className="space-y-6 py-2">
                    {/* Type */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-type">Type</Label>
                      <Input
                        id="edit-type"
                        className="placeholder:text-gray-400 focus:placeholder:text-blue-500"
                        value={editData.type}
                        onChange={(e) => setEditData(prev => ({ ...prev, type: e.target.value }))}
                      />

                    </div>

                    {/* Identification Section */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm">Identification</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="edit-publicKey">Public Key</Label>
                          <Input
                            id="edit-publicKey"
                            value={editData.identification.publicKey}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              identification: { ...prev.identification, publicKey: e.target.value }
                            }))}
                            className="font-mono text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-legalName">Legal Name</Label>
                          <Input
                            id="edit-legalName"
                            value={editData.identification.legalName}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              identification: { ...prev.identification, legalName: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-businessRegNo">Business Reg No</Label>
                          <Input
                            id="edit-businessRegNo"
                            value={editData.identification.businessRegNo}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              identification: { ...prev.identification, businessRegNo: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-country">Country of Incorporation</Label>
                          <Input
                            id="edit-country"
                            value={editData.identification.countryOfIncorporation}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              identification: { ...prev.identification, countryOfIncorporation: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Contact Section */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm">Contact Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="edit-personName">Person Name</Label>
                          <Input
                            id="edit-personName"
                            value={editData.contact.personName}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              contact: { ...prev.contact, personName: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-designation">Designation</Label>
                          <Input
                            id="edit-designation"
                            value={editData.contact.designation}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              contact: { ...prev.contact, designation: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-email">Email</Label>
                          <Input
                            id="edit-email"
                            type="email"
                            value={editData.contact.email}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              contact: { ...prev.contact, email: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-phone">Phone</Label>
                          <Input
                            id="edit-phone"
                            value={editData.contact.phone}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              contact: { ...prev.contact, phone: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="edit-address">Address</Label>
                          <Input
                            id="edit-address"
                            value={editData.contact.address}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              contact: { ...prev.contact, address: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Checkpoint Section */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm">Checkpoint Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="edit-checkpoint-name">Name</Label>
                          <Input
                            id="edit-checkpoint-name"
                            value={editData.checkpoint.name}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              checkpoint: { ...prev.checkpoint, name: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="edit-checkpoint-address">Address</Label>
                          <Input
                            id="edit-checkpoint-address"
                            value={editData.checkpoint.address}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              checkpoint: { ...prev.checkpoint, address: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-checkpoint-latitude">Latitude</Label>
                          <Input
                            id="edit-checkpoint-latitude"
                            value={editData.checkpoint.latitude}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              checkpoint: { ...prev.checkpoint, latitude: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-checkpoint-longitude">Longitude</Label>
                          <Input
                            id="edit-checkpoint-longitude"
                            value={editData.checkpoint.longitude}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              checkpoint: { ...prev.checkpoint, longitude: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-checkpoint-state">State</Label>
                          <Input
                            id="edit-checkpoint-state"
                            value={editData.checkpoint.state}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              checkpoint: { ...prev.checkpoint, state: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-checkpoint-country">Country</Label>
                          <Input
                            id="edit-checkpoint-country"
                            value={editData.checkpoint.country}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              checkpoint: { ...prev.checkpoint, country: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Details Section */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm">Additional Details</h3>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="edit-categories">Product Categories (comma separated)</Label>
                          <Input
                            id="edit-categories"
                            value={editData.details.productCategoriesManufactured.join(', ')}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              details: {
                                ...prev.details,
                                productCategoriesManufactured: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                              }
                            }))}
                            placeholder="e.g., Widgets, Gadgets, Tools"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-certifications">Certifications (comma separated)</Label>
                          <Input
                            id="edit-certifications"
                            value={editData.details.certifications.join(', ')}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              details: {
                                ...prev.details,
                                certifications: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                              }
                            }))}
                            placeholder="e.g., ISO9001, ISO14001"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      // TODO: send name/password to your update API
                      setOpen(false);
                    }}
                  >
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={localSettings.displayName}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Enter your display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={localSettings.email}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                value={localSettings.organization}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, organization: e.target.value }))}
                placeholder="Enter your organization name"
              />
            </div>

            {user && (
              <div className="space-y-2">
                <Label>Role</Label>
                <Badge variant="secondary" className="w-fit">
                  {user.role}
                </Badge>
              </div>
            )}

            {user?.address && (
              <div className="space-y-2">
                <Label>Wallet Address</Label>
                <code className="block text-sm bg-muted px-3 py-2 rounded">
                  {user.address}
                </code>
              </div>
            )}

            <Button onClick={handleSaveProfile} className="w-full gap-2">
              <Save className="h-4 w-4" />
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Application Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Temperature Unit */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  <Label>Temperature Unit</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose between Celsius and Fahrenheit
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={temperatureUnit === 'C' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTemperatureUnit('C')}
                >
                  °C
                </Button>
                <Button
                  variant={temperatureUnit === 'F' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTemperatureUnit('F')}
                >
                  °F
                </Button>
              </div>
            </div>

            <Separator />

            {/* Dark Mode */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <Label>Dark Mode</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Toggle dark theme appearance
                </p>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>

            <Separator />

            {/* Real-time Data Source */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                <Label>Real-time Data Source</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Select the source for real-time telemetry data
              </p>
              <div className="space-y-2">
                {realtimeOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={option.value}
                      name="realtimeSource"
                      value={option.value}
                      checked={realtimeSource === option.value}
                      onChange={(e) => setRealtimeSource(e.target.value as any)}
                      className="h-4 w-4"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={option.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {option.label}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Connection Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rpc-url">RPC URL</Label>
                <Input
                  id="rpc-url"
                  value={localSettings.rpcUrl}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, rpcUrl: e.target.value }))}
                  placeholder="https://sepolia.infura.io/v3/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ws-url">WebSocket URL</Label>
                <Input
                  id="ws-url"
                  value={localSettings.wsUrl}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, wsUrl: e.target.value }))}
                  placeholder="wss://ws.example.com/telemetry"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mqtt-url">MQTT URL</Label>
                <Input
                  id="mqtt-url"
                  value={localSettings.mqttUrl}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, mqttUrl: e.target.value }))}
                  placeholder="wss://mqtt.example.com:8083/mqtt"
                />
              </div>
            </div>

            <Button onClick={handleSaveConnections} className="gap-2">
              <Save className="h-4 w-4" />
              Save Connection Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div >
  );
};

export default Settings;