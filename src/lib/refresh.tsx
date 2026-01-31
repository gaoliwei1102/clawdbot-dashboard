import * as React from "react";

type RefreshCtx = {
  tick: number;
  trigger: () => void;
};

const Ctx = React.createContext<RefreshCtx | null>(null);

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const [tick, setTick] = React.useState(0);

  const trigger = React.useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  return <Ctx.Provider value={{ tick, trigger }}>{children}</Ctx.Provider>;
}

export function useRefresh() {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useRefresh must be used within <RefreshProvider />");
  return v;
}

