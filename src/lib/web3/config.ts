import { createConfig, http } from '@wagmi/core';
import { sepolia, mainnet } from 'viem/chains';
import { walletConnect, injected } from '@wagmi/connectors';

// Environment variables with fallbacks
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id';
const rpcUrl = import.meta.env.VITE_RPC_URL || 'https://sepolia.infura.io/v3/demo';
const chainId = Number(import.meta.env.VITE_CHAIN_ID) || 11155111;
const isFakeMode = import.meta.env.VITE_FAKE_MODE === 'true';

// Select chain based on environment
const chains = [chainId === 1 ? mainnet : sepolia] as const;

export const config = createConfig({
  chains,
  connectors: [
    walletConnect({
      projectId,
    }),
    injected(),
  ],
  transports: {
    [sepolia.id]: http(rpcUrl),
    [mainnet.id]: http(),
  },
});

export { projectId, isFakeMode };