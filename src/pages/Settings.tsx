import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Settings as SettingsIcon, User, Wifi, Thermometer, Moon, Save } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { registrationService } from '@/services/registrationService';
import { Textarea } from '@/components/ui/textarea';

type RegistrationRecord = {
  id?: string;
  type: string;
  identification: {
    publicKey: string;
    legalName: string;
    businessRegNo: string;
    countryOfIncorporation: string;
  };
  contact: {
    personName: string;
    designation: string;
    email: string;
    phone: string;
    address: string;
  };
  metadata: {
    publicKey: string;
    smartContractRole: string;
    dateOfRegistration: string;
  };
  details: {
    productCategoriesManufactured: string[];
    certifications: string[];
  };
  checkpoint: {
    name: string;
    address: string;
    latitude: string;
    longitude: string;
    state: string;
    country: string;
  };
};

type ConnectionSettings = {
  rpcUrl: string;
  wsUrl: string;
  mqttUrl: string;
};

const emptyRegistration: RegistrationRecord = {
  type: '',
  identification: {
    publicKey: '',
    legalName: '',
    businessRegNo: '',
    countryOfIncorporation: '',
  },
  contact: {
    personName: '',
    designation: '',
    email: '',
    phone: '',
    address: '',
  },
  metadata: {
    publicKey: '',
    smartContractRole: '',
    dateOfRegistration: '',
  },
  details: {
    productCategoriesManufactured: [],
    certifications: [],
  },
  checkpoint: {
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    state: '',
    country: '',
  },
};

const normalizeRegistration = (data: Partial<RegistrationRecord> | null | undefined): RegistrationRecord => ({
  ...emptyRegistration,
  ...(data ?? {}),
  identification: {
    ...emptyRegistration.identification,
    ...(data?.identification ?? {}),
  },
  contact: {
    ...emptyRegistration.contact,
    ...(data?.contact ?? {}),
  },
  metadata: {
    ...emptyRegistration.metadata,
    ...(data?.metadata ?? {}),
  },
  details: {
    ...emptyRegistration.details,
    ...(data?.details ?? {}),
  },
  checkpoint: {
    ...emptyRegistration.checkpoint,
    ...(data?.checkpoint ?? {}),
  },
});

const resolveRegistrationPayload = (raw: unknown): Partial<RegistrationRecord> | null => {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;

  if ('payload' in record && typeof record.payload === 'object' && record.payload !== null) {
    const payload = { ...(record.payload as Partial<RegistrationRecord>) };
    if (!payload.type && typeof record.reg_type === 'string') {
      payload.type = record.reg_type as RegistrationRecord['type'];
    }
    return payload;
  }

  return raw as Partial<RegistrationRecord>;
};

const listToTextareaValue = (values: string[] | undefined): string =>
  (values ?? []).join('\n');

const textareaValueToList = (value: string): string[] =>
  value
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);

const Settings = () => {
  const {
    uuid,
    user,
    temperatureUnit,
    darkMode,
    realtimeSource,
    setTemperatureUnit,
    setDarkMode,
    setRealtimeSource,
    setUser,
  } = useAppStore();

  const registrationId = uuid;
  console.log('Settings page - registrationId:', registrationId);


  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [registration, setRegistration] = useState<RegistrationRecord | null>(null);
  const [editableRegistration, setEditableRegistration] = useState<RegistrationRecord>(emptyRegistration);
  const [connectionSettings, setConnectionSettings] = useState<ConnectionSettings>({
    rpcUrl: 'https://sepolia.infura.io/v3/demo',
    wsUrl: 'wss://ws.example.com/telemetry',
    mqttUrl: 'wss://mqtt.example.com:8083/mqtt',
  });

  useEffect(() => {
    if (!registrationId) {
      setRegistration(null);
      return;
    }

    let isMounted = true;
    setIsProfileLoading(true);
    console.log('Settings: fetching registration', registrationId);


    registrationService
      .getById(registrationId)
      .then((data) => {
        console.log('Settings: fetch success', data);

        if (!isMounted) return;
        const payload = resolveRegistrationPayload(data);
        const normalized = normalizeRegistration(payload);
        setRegistration(normalized);
        setEditableRegistration(normalized);
      })
      .catch((error) => {
        console.error('Error fetching registration:', error);
        toast({
          title: 'Unable to load profile',
          description: 'Please try again later.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [registrationId]);

  const handleOpenProfileDialog = () => {
    setEditableRegistration(registration ? normalizeRegistration(registration) : emptyRegistration);
    setIsProfileDialogOpen(true);
  };

  const handleCloseProfileDialog = () => {
    if (isProfileSaving) return;
    setIsProfileDialogOpen(false);
  };

  const updateIdentificationField = (field: keyof RegistrationRecord['identification'], value: string) => {
    setEditableRegistration((prev) => ({
      ...prev,
      identification: {
        ...prev.identification,
        [field]: value,
      },
    }));
  };

  const updateContactField = (field: keyof RegistrationRecord['contact'], value: string) => {
    setEditableRegistration((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value,
      },
    }));
  };

  const updateMetadataField = (field: keyof RegistrationRecord['metadata'], value: string) => {
    setEditableRegistration((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value,
      },
    }));
  };

  const updateDetailsField = (field: keyof RegistrationRecord['details'], value: string[]) => {
    setEditableRegistration((prev) => ({
      ...prev,
      details: {
        ...prev.details,
        [field]: value,
      },
    }));
  };

  const updateCheckpointField = (field: keyof RegistrationRecord['checkpoint'], value: string) => {
    setEditableRegistration((prev) => ({
      ...prev,
      checkpoint: {
        ...prev.checkpoint,
        [field]: value,
      },
    }));
  };

const handleSaveRegistration = async () => {
  if (!registrationId) {
    toast({ title: 'Missing user identifier', description: 'Cannot update profile without a valid registration id.', variant: 'destructive' });
    return;
  }

  setIsProfileSaving(true);
  try {
    const payload = normalizeRegistration(editableRegistration);

    await registrationService.update(registrationId, payload);

    // Re-fetch so the UI gets the canonical data returned by the API
    const latest = await registrationService.getById(registrationId);
    const normalized = normalizeRegistration(resolveRegistrationPayload(latest));

    setRegistration(normalized);
    setEditableRegistration(normalized);

    if (user) {
      setUser({
        ...user,
        displayName: normalized.contact.personName || user.displayName,
        email: normalized.contact.email || user.email,
        organization: normalized.identification.legalName || user.organization,
      });
    }

    toast({ title: 'Profile saved', description: 'Registration details have been updated.' });
    setIsProfileDialogOpen(false);
  } catch (error) {
    console.error('Error updating registration:', error);
    toast({ title: 'Save failed', description: 'We could not update the profile. Please try again.', variant: 'destructive' });
  } finally {
    setIsProfileSaving(false);
  }
};

  const realtimeOptions = useMemo(
    () => [
      { value: 'Mock', label: 'Mock Data', description: 'Use simulated data for demo' },
      { value: 'WebSocket', label: 'WebSocket', description: 'Real-time WebSocket connection' },
      { value: 'MQTT', label: 'MQTT', description: 'MQTT broker connection' },
    ],
    []
  );

  const handleConnectionChange = (field: keyof ConnectionSettings, value: string) => {
    setConnectionSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveConnections = () => {
    toast({
      title: 'Connection settings saved',
      description: 'Connection preferences have been updated.',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your application preferences and connection settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={handleOpenProfileDialog}
              disabled={isProfileLoading}
            >
              <SettingsIcon className="h-4 w-4" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {isProfileLoading ? (
              <p className="text-muted-foreground">Loading profile information…</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-muted-foreground">Organization</p>
                  <p className="text-base font-medium">
                    {registration?.identification.legalName || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Registration Type</p>
                  <Badge variant="secondary" className="mt-1">
                    {registration?.type || 'N/A'}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Contact Person</p>
                  <p className="text-base font-medium">
                    {registration?.contact.personName || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="text-base font-medium">
                    {registration?.contact.email || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="text-base font-medium">
                    {registration?.contact.phone || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Address</p>
                  <p className="text-base font-medium">
                    {registration?.contact.address || '—'}
                  </p>
                </div>
                {user?.role && (
                  <div>
                    <p className="text-muted-foreground">Role</p>
                    <Badge variant="outline" className="mt-1">
                      {user.role}
                    </Badge>
                  </div>
                )}
                {user?.address && (
                  <div>
                    <p className="text-muted-foreground">Wallet Address</p>
                    <code className="block text-xs bg-muted px-3 py-2 rounded break-all">
                      {user.address}
                    </code>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <Label>Dark Mode</Label>
                </div>
                <p className="text-sm text-muted-foreground">Toggle dark theme appearance</p>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>

            <Separator />

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
                      onChange={(event) => setRealtimeSource(event.target.value as typeof realtimeSource)}
                      className="h-4 w-4"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={option.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {option.label}
                      </label>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* <Card className="lg:col-span-2">
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
                  value={connectionSettings.rpcUrl}
                  onChange={(event) => handleConnectionChange('rpcUrl', event.target.value)}
                  placeholder="https://sepolia.infura.io/v3/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ws-url">WebSocket URL</Label>
                <Input
                  id="ws-url"
                  value={connectionSettings.wsUrl}
                  onChange={(event) => handleConnectionChange('wsUrl', event.target.value)}
                  placeholder="wss://ws.example.com/telemetry"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mqtt-url">MQTT URL</Label>
                <Input
                  id="mqtt-url"
                  value={connectionSettings.mqttUrl}
                  onChange={(event) => handleConnectionChange('mqttUrl', event.target.value)}
                  placeholder="wss://mqtt.example.com:8083/mqtt"
                />
              </div>
            </div>
            <Button onClick={handleSaveConnections} className="gap-2">
              <Save className="h-4 w-4" />
              Save Connection Settings
            </Button>
          </CardContent>
        </Card> */}
      </div>

      <Dialog
        open={isProfileDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseProfileDialog();
        }}
      >
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Edit Registration Profile</DialogTitle>
            <DialogDescription>
              Update your organization information. Changes are saved to the registry.
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[calc(85vh-180px)] px-1">
            <div className="space-y-6 py-2">
              {/* Essential Information Card */}
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Essential Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-legal-name" className="text-sm font-medium">
                        Organization Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-legal-name"
                        value={editableRegistration.identification.legalName}
                        onChange={(event) => updateIdentificationField('legalName', event.target.value)}
                        placeholder="Acme Manufacturing Ltd."
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-type" className="text-sm font-medium">
                        Registration Type <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-type"
                        value={editableRegistration.type}
                        onChange={(event) => setEditableRegistration((prev) => ({ ...prev, type: event.target.value }))}
                        placeholder="MANUFACTURER"
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground">e.g., MANUFACTURER, DISTRIBUTOR, RETAILER</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-contact-name" className="text-sm font-medium">
                        Contact Person <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-contact-name"
                        value={editableRegistration.contact.personName}
                        onChange={(event) => updateContactField('personName', event.target.value)}
                        placeholder="Jane Doe"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email" className="text-sm font-medium">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editableRegistration.contact.email}
                        onChange={(event) => updateContactField('email', event.target.value)}
                        placeholder="jane.doe@company.com"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone" className="text-sm font-medium">
                        Phone Number
                      </Label>
                      <Input
                        id="edit-phone"
                        value={editableRegistration.contact.phone}
                        onChange={(event) => updateContactField('phone', event.target.value)}
                        placeholder="+94 77 123 4567"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-designation" className="text-sm font-medium">
                        Job Title
                      </Label>
                      <Input
                        id="edit-designation"
                        value={editableRegistration.contact.designation}
                        onChange={(event) => updateContactField('designation', event.target.value)}
                        placeholder="Supply Chain Director"
                        className="h-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Details Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <SettingsIcon className="h-4 w-4" />
                    Company Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-business-reg" className="text-sm font-medium">
                        Registration Number
                      </Label>
                      <Input
                        id="edit-business-reg"
                        value={editableRegistration.identification.businessRegNo}
                        onChange={(event) => updateIdentificationField('businessRegNo', event.target.value)}
                        placeholder="REG-2024-12345"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-country" className="text-sm font-medium">
                        Country
                      </Label>
                      <Input
                        id="edit-country"
                        value={editableRegistration.identification.countryOfIncorporation}
                        onChange={(event) => updateIdentificationField('countryOfIncorporation', event.target.value)}
                        placeholder="Sri Lanka"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="edit-address" className="text-sm font-medium">
                        Business Address
                      </Label>
                      <Textarea
                        id="edit-address"
                        value={editableRegistration.contact.address}
                        onChange={(event) => updateContactField('address', event.target.value)}
                        placeholder="123 Industrial Park, Colombo 03"
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products & Certifications Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Products & Certifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-product-categories" className="text-sm font-medium">
                        Product Categories
                      </Label>
                      <Textarea
                        id="edit-product-categories"
                        value={listToTextareaValue(editableRegistration.details.productCategoriesManufactured)}
                        onChange={(event) =>
                          updateDetailsField('productCategoriesManufactured', textareaValueToList(event.target.value))
                        }
                        placeholder="Vaccines&#10;Medical Devices&#10;Pharmaceuticals"
                        rows={4}
                        className="resize-none font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">One category per line</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-certifications" className="text-sm font-medium">
                        Certifications
                      </Label>
                      <Textarea
                        id="edit-certifications"
                        value={listToTextareaValue(editableRegistration.details.certifications)}
                        onChange={(event) => updateDetailsField('certifications', textareaValueToList(event.target.value))}
                        placeholder="ISO 9001:2015&#10;GMP Certified&#10;WHO Prequalified"
                        rows={4}
                        className="resize-none font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">One certification per line</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Checkpoint Location Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Facility Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="edit-checkpoint-name" className="text-sm font-medium">
                        Facility Name
                      </Label>
                      <Input
                        id="edit-checkpoint-name"
                        value={editableRegistration.checkpoint.name}
                        onChange={(event) => updateCheckpointField('name', event.target.value)}
                        placeholder="Colombo Main Facility"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="edit-checkpoint-address" className="text-sm font-medium">
                        Street Address
                      </Label>
                      <Textarea
                        id="edit-checkpoint-address"
                        value={editableRegistration.checkpoint.address}
                        onChange={(event) => updateCheckpointField('address', event.target.value)}
                        placeholder="456 Factory Road, Industrial Zone"
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-checkpoint-state" className="text-sm font-medium">
                        State / Province
                      </Label>
                      <Input
                        id="edit-checkpoint-state"
                        value={editableRegistration.checkpoint.state}
                        onChange={(event) => updateCheckpointField('state', event.target.value)}
                        placeholder="Western Province"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-checkpoint-country" className="text-sm font-medium">
                        Country
                      </Label>
                      <Input
                        id="edit-checkpoint-country"
                        value={editableRegistration.checkpoint.country}
                        onChange={(event) => updateCheckpointField('country', event.target.value)}
                        placeholder="Sri Lanka"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-checkpoint-latitude" className="text-sm font-medium">
                        Latitude
                      </Label>
                      <Input
                        id="edit-checkpoint-latitude"
                        value={editableRegistration.checkpoint.latitude}
                        onChange={(event) => updateCheckpointField('latitude', event.target.value)}
                        placeholder="6.9271"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-checkpoint-longitude" className="text-sm font-medium">
                        Longitude
                      </Label>
                      <Input
                        id="edit-checkpoint-longitude"
                        value={editableRegistration.checkpoint.longitude}
                        onChange={(event) => updateCheckpointField('longitude', event.target.value)}
                        placeholder="79.8612"
                        className="h-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced: Blockchain Data Card */}
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-muted-foreground">Advanced: Blockchain Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-identification-public-key" className="text-sm font-medium">
                        Organization Public Key
                      </Label>
                      <Input
                        id="edit-identification-public-key"
                        value={editableRegistration.identification.publicKey}
                        onChange={(event) => updateIdentificationField('publicKey', event.target.value)}
                        placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                        className="h-10 font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-metadata-public-key" className="text-sm font-medium">
                        Metadata Public Key
                      </Label>
                      <Input
                        id="edit-metadata-public-key"
                        value={editableRegistration.metadata.publicKey}
                        onChange={(event) => updateMetadataField('publicKey', event.target.value)}
                        placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                        className="h-10 font-mono text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-smart-contract-role" className="text-sm font-medium">
                          Smart Contract Role
                        </Label>
                        <Input
                          id="edit-smart-contract-role"
                          value={editableRegistration.metadata.smartContractRole}
                          onChange={(event) => updateMetadataField('smartContractRole', event.target.value)}
                          placeholder="MANUFACTURER"
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-date-of-registration" className="text-sm font-medium">
                          Registration Date
                        </Label>
                        <Input
                          id="edit-date-of-registration"
                          type="date"
                          value={editableRegistration.metadata.dateOfRegistration?.slice(0, 10) || ''}
                          onChange={(event) => updateMetadataField('dateOfRegistration', event.target.value)}
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseProfileDialog} disabled={isProfileSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveRegistration} disabled={isProfileSaving} className="gap-2">
              {isProfileSaving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>    </div>
  );
};

export default Settings;
