import { Navigate, Route, Routes } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { ChannelsPage } from "./components/pages/Channels";
import { DashboardPage } from "./components/pages/Dashboard";
import { SessionsPage } from "./components/pages/Sessions";
import { RefreshProvider } from "./lib/refresh";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { LoginDialog } from "./components/ui/LoginDialog";
import { Skeleton } from "./components/ui/Skeleton";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status, isPasswordMode, isLoading } = useAuth();

  // Don't render anything while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="w-[min(520px,90vw)] space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-6">
          <div className="h-balance font-display text-base text-zinc-100">连接中…</div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isPasswordMode && status !== "authenticated") {
    // Important: don't render children before auth, otherwise pages will fire unauthenticated
    // Gateway requests and show confusing "CORS/URL/token" errors.
    return <LoginDialog />;
  }

  return (
    <>
      {children}
    </>
  );
}

export default function App() {
  return (
    <div className="app-surface min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1400px]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <RefreshProvider>
            <AuthProvider>
              <AuthGuard>
                <Header />
                <main className="min-w-0 flex-1 px-4 pb-10 pt-4 sm:px-6">
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/sessions" element={<SessionsPage />} />
                    <Route path="/channels" element={<ChannelsPage />} />
                    <Route
                      path="*"
                      element={
                        <div className="p-pretty rounded-xl border border-zinc-800 bg-zinc-950/60 p-6 text-sm text-zinc-200">
                          Not Found
                        </div>
                      }
                    />
                  </Routes>
                </main>
              </AuthGuard>
            </AuthProvider>
          </RefreshProvider>
        </div>
      </div>
    </div>
  );
}
