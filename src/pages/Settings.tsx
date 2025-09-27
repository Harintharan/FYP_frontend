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

  const [localSettings, setLocalSettings] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    organization: user?.organization || '',
    licenseNumber: user?.licenseNumber || '',
    rpcUrl: 'https://sepolia.infura.io/v3/demo',
    wsUrl: 'wss://ws.example.com/telemetry',
    mqttUrl: 'wss://mqtt.example.com:8083/mqtt',
  });

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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </CardTitle>
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
    </div>
  );
};

export default Settings;