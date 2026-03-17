"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { User, LoginResponse } from "@/types/api";
import { fetchApi } from "@/lib/api";
import {
  getToken,
  getUser,
  setToken,
  setUser as saveUser,
  removeToken,
  isTokenExpired,
} from "@/lib/auth";

const TOKEN_CHECK_INTERVAL = 60 * 1000; // check every 60 seconds

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    window.location.href = "/login";
  }, []);

  // On mount: check token validity
  useEffect(() => {
    const token = getToken();
    const savedUser = getUser();
    if (token && savedUser && !isTokenExpired(token)) {
      setUser(savedUser);
    } else if (token && isTokenExpired(token)) {
      // Token exists but expired — clean up
      removeToken();
    }
    setIsLoading(false);
  }, []);

  // Periodic token expiration check
  useEffect(() => {
    const interval = setInterval(() => {
      const token = getToken();
      if (token && isTokenExpired(token)) {
        logout();
      }
    }, TOKEN_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetchApi<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(res.accessToken);
    saveUser(res.user);
    setUser(res.user);
  }, []);

  return { user, isLoading, login, logout };
}
