"use client";

import { User } from "@/types/api";

const TOKEN_KEY = "token";
const USER_KEY = "user";

interface JwtPayload {
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function isTokenExpired(token?: string | null): boolean {
  const t = token ?? getToken();
  if (!t) return true;
  const payload = decodeJwtPayload(t);
  if (!payload?.exp) return false; // no exp claim — treat as valid
  // expired if current time is past exp (with 30s buffer for clock skew)
  return Date.now() >= (payload.exp - 30) * 1000;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem(USER_KEY);
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function setUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function isAuthenticated(): boolean {
  const token = getToken();
  return !!token && !isTokenExpired(token);
}

export function forceLogout(): void {
  removeToken();
  window.location.href = "/login";
}
