import { useState, useEffect, useCallback } from "react";
import { getGatewayEnv } from "../lib/env";

type AuthStatus = "idle" | "authenticated" | "unauthenticated" | "error";

export function useAuth() {
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

      // Verify password if we have one in memory
      if (password) {
        await verifyPassword(password);
      } else {
        setStatus("unauthenticated");
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isPasswordMode]);

  const verifyPassword = useCallback(async (pwd: string) => {
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
        setStatus("authenticated");
      } else {
        setPassword(null);
        setStatus("unauthenticated");
        setError("密码错误，请重试");
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "连接失败");
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, sessionKey]);

  const login = useCallback(async (pwd: string) => {
    await verifyPassword(pwd);
  }, [verifyPassword]);

  const logout = useCallback(() => {
    setPassword(null);
    setStatus("unauthenticated");
    setError(null);
  }, []);

  return {
    status,
    error,
    isLoading,
    isPasswordMode,
    login,
    logout,
    hasPassword: !!password
  };
}

// Get the auth header value for API calls
export function getAuthHeader(): string | null {
  const { authMode, credentials } = getGatewayEnv();

  if (authMode === "password") {
    return null; // Will be provided by useAuth context
  }
  return `Bearer ${credentials}`;
}
