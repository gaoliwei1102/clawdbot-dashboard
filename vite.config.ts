import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const gatewayUrl = (env.VITE_GATEWAY_URL || "").trim();

  // If you set VITE_GATEWAY_URL=/api, this proxy helps avoid CORS during local dev.
  const proxy =
    gatewayUrl === "/api"
      ? {
          "/api": {
            target: "http://127.0.0.1:18789",
            changeOrigin: true,
            secure: false
          }
        }
      : undefined;

  return {
    plugins: [react()],
    server: {
      port: 8002,
      strictPort: true,
      proxy
    }
  };
});
