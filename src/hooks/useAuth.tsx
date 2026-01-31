import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getGatewayEnv } from "../lib/env";
import { clearPassword as clearApiPassword, setPassword as setApiPassword } from "../lib/api";

type AuthStatus = "idle" | "authenticated" | "unauthenticated" | "error";

type AuthContextValue = {
  status: AuthStatus;
  error: string | null;
  isLoading: boolean;
  isPasswordMode: boolean;
  login: (pwd: string) => Promise<boolean>;
  logout: () => void;
  hasPassword: boolean;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState<string | null>(null);

  const { authMode, baseUrl, sessionKey } = getGatewayEnv();
  const isPasswordMode = authMode === "password";

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!isPasswordMode) {
        setStatus("authenticated");
        setIsLoading(false);
        return;
      }

      // Password is only kept in-memory; force login on reload.
      setStatus("unauthenticated");
      setIsLoading(false);
    };

    checkAuth();
  }, [isPasswordMode]);

  // If the Gateway rejects requests (401), invokeTool clears its in-memory password.
  // We listen for that and force the UI back to the login screen.
  useEffect(() => {
    const onUnauthorized = () => {
      setPassword(null);
      setStatus("unauthenticated");
    };
    window.addEventListener("gateway:unauthorized", onUnauthorized as EventListener);
    return () => window.removeEventListener("gateway:unauthorized", onUnauthorized as EventListener);
  }, []);

  const verifyPassword = useCallback(async (pwd: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const auth = btoa(`admin:${pwd}`);
      const res = await fetch(`${baseUrl}/tools/invoke`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tool: "sessions_list",
          args: { limit: 1 },
          sessionKey
        })
      });

      if (res.ok) {
        setPassword(pwd);
        setApiPassword(pwd);
        setStatus("authenticated");
        return true;
      } else {
        setPassword(null);
        clearApiPassword();
        setStatus("unauthenticated");
        setError("密码错误，请重试");
        return false;
      }
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "连接失败（请检查 VITE_GATEWAY_URL、Gateway 是否开启 CORS、以及 HTTPS 证书是否可信）"
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, sessionKey]);

  const login = useCallback(async (pwd: string) => {
    return await verifyPassword(pwd);
  }, [verifyPassword]);

  const logout = useCallback(() => {
    setPassword(null);
    clearApiPassword();
    setStatus("unauthenticated");
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    error,
    isLoading,
    isPasswordMode,
    login,
    logout,
    hasPassword: !!password
  }), [status, error, isLoading, isPasswordMode, login, logout, password]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider />");
  }
  return ctx;
}

// (Deprecated) Previously exported helper for token-mode Authorization headers.
// Kept to avoid breaking imports if any exist out of tree.
export function getAuthHeader(): string | null {
  const { authMode, credentials } = getGatewayEnv();
  if (authMode === "password") return null;
  return `Bearer ${credentials}`;
}
