import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const gatewayUrl = (env.VITE_GATEWAY_URL || "").trim();

  // If using /api as VITE_GATEWAY_URL, proxy to local Gateway (CORS workaround for dev)
  // Otherwise, use the URL directly (for Tailscale Funnel, production, etc.)
  let proxy: Record<string, any> | undefined;

  if (gatewayUrl === "/api") {
    proxy = {
      "/api": {
        target: "http://127.0.0.1:18789",
        changeOrigin: true,
        secure: false
      }
    };
  } else if (gatewayUrl && !gatewayUrl.startsWith("/")) {
    // For remote URLs (Tailscale Funnel, production), we don't proxy in dev
    // The browser will make direct requests to the remote Gateway
    proxy = undefined;
  }

  return {
    plugins: [react()],
    server: {
      port: 8002,
      strictPort: true,
      proxy
    }
  };
});
