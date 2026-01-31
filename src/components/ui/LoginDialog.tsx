import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "./Button";
import { Input } from "./Input";

interface LoginDialogProps {
  onSuccess?: () => void;
}

export function LoginDialog({ onSuccess }: LoginDialogProps) {
  const { login, isLoading, error, isPasswordMode } = useAuth();
  const [password, setPassword] = useState("");

  if (!isPasswordMode) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(password);
    if (ok) {
      onSuccess?.();
      setPassword("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          输入访问密码
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              密码
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              disabled={isLoading || !password}
              isLoading={isLoading}
            >
              {isLoading ? "验证中..." : "确认"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
