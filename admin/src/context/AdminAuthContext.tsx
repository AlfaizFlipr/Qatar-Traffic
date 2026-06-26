import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { adminApi } from "../api/admin";
import { tokenStore } from "../api/client";

interface AdminAuthValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStore.get());

  const login = useCallback(async (username: string, password: string) => {
    const result = await adminApi.login(username, password);
    tokenStore.set(result.token);
    setToken(result.token);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
  }, []);

  const value = useMemo<AdminAuthValue>(
    () => ({ token, isAuthenticated: Boolean(token), login, logout }),
    [token, login, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx)
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
