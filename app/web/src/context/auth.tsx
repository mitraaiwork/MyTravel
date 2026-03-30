"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { authApi } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async (authToken: string) => {
    try {
      // Temporarily set the token in localStorage so the API interceptor picks it up
      localStorage.setItem("token", authToken);
      const userData = await authApi.me();
      setUser(userData);
      setToken(authToken);
    } catch {
      // Token is invalid — clean up
      localStorage.removeItem("token");
      setUser(null);
      setToken(null);
    }
  }, []);

  // On mount: check if a token exists in localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      fetchUser(storedToken).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  const login = useCallback(
    async (newToken: string) => {
      setIsLoading(true);
      await fetchUser(newToken);
      setIsLoading(false);
    },
    [fetchUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
