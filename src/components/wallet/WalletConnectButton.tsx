import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, LogOut, Copy, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { isFakeMode } from '@/lib/web3/config';
import { toast } from '@/hooks/use-toast';

export const WalletConnectButton = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { 
    walletAddress, 
    isConnected, 
    setWalletConnection,
    user,
    setUser 
  } = useAppStore();

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      if (isFakeMode) {
        // Mock wallet connection
        const mockAddress = '0x742d35Cc6634C0532925a3b8D8b5C4e0c5E42F2B' as `0x${string}`;
        setWalletConnection(mockAddress);
        
        // Mock user profile
        if (!user) {
          setUser({
            id: 'user-1',
            address: mockAddress,
            role: 'MANUFACTURER',
            displayName: 'John Manufacturer',
            email: 'john@example.com',
            organization: 'Demo Manufacturing Co.'
          });
        }
        
        toast({
          title: "Wallet Connected (Demo)",
          description: "Connected to mock wallet for demo purposes",
        });
      } else {
        // TODO: Implement real WalletConnect
        toast({
          title: "WalletConnect",
          description: "Real wallet connection not implemented yet",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWalletConnection(null);
    setUser(null);
    toast({
      title: "Wallet Disconnected",
      description: "Successfully disconnected from wallet",
    });
  };

  const handleCopyAddress = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected || !walletAddress) {
    return (
      <Button 
        onClick={handleConnect}
        disabled={isConnecting}
        className="gap-2"
      >
        <Wallet className="h-4 w-4" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <Card className="w-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Connected Wallet
          {isFakeMode && <Badge variant="secondary">Demo</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          <code className="text-sm bg-muted px-2 py-1 rounded">
            {formatAddress(walletAddress)}
          </code>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyAddress}
            className="h-8 w-8 p-0"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDisconnect}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <LogOut className="h-3 w-3" />
          </Button>
        </div>
        {user && (
          <div className="mt-2 text-sm text-muted-foreground">
            {user.displayName} ({user.role})
          </div>
        )}
      </CardContent>
    </Card>
  );
};