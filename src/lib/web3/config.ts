import { createConfig, http } from '@wagmi/core';
import { sepolia, mainnet } from 'viem/chains';
import { walletConnect, injected } from '@wagmi/connectors';
import { defineChain } from 'viem';

// Environment variables with fallbacks
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id';
const rpcUrl = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:7545';
const chainId = Number(import.meta.env.VITE_CHAIN_ID) || 1337;
const isFakeMode = import.meta.env.VITE_FAKE_MODE === 'true';

// Define Ganache Local chain (named "Ganesh" to match MetaMask)
export const ganacheLocal = defineChain({
  id: 1337,
  name: 'Ganesh',  // Changed to match your MetaMask network name
  network: 'ganache',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:7545'],
    },
    public: {
      http: ['http://127.0.0.1:7545'],
    },
  },
  testnet: true,
});

// Select chains based on chain ID
const getChains = () => {
  if (chainId === 1337) {
    return [ganacheLocal] as const;
  } else if (chainId === 1) {
    return [mainnet] as const;
  } else {
    return [sepolia] as const;
  }
};

const chains = getChains();

export const config = createConfig({
  chains,
  connectors: [
    walletConnect({
      projectId,
    }),
    injected(),
  ],
  transports: {
    [ganacheLocal.id]: http('http://127.0.0.1:7545'),
    [sepolia.id]: http(rpcUrl),
    [mainnet.id]: http(),
  },
});

export { projectId, isFakeMode };