import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      // 1. Set host to true to allow external connections (like ngrok)
      host: true,
      port: parseInt(env.VITE_PORT || "8080"),

      // 2. Add HMR configuration for ngrok
      hmr: {
        // *** REPLACE THIS WITH YOUR ACTUAL NGROK URL ***
        host: 'shockproof-norris-transplanetary.ngrok-free.dev',
        protocol: 'wss',
        clientPort: 443, // Standard HTTPS port
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(
      Boolean
    ),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});