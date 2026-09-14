"use client";

import { User } from "@/types/api";
import { STORAGE_KEYS } from "@/lib/constants";

const LEGACY_TOKEN_KEY = "token";
const LEGACY_USER_KEY = "user";

function migrateLegacyValue(currentKey: string, legacyKey: string): string | null {
  const currentValue = localStorage.getItem(currentKey);
  if (currentValue) return currentValue;

  const legacyValue = localStorage.getItem(legacyKey);
  if (legacyValue) {
    localStorage.setItem(currentKey, legacyValue);
    localStorage.removeItem(legacyKey);
  }
  return legacyValue;
}

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
  return migrateLegacyValue(STORAGE_KEYS.accessToken, LEGACY_TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.accessToken, token);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function removeToken(): void {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const user = migrateLegacyValue(STORAGE_KEYS.user, LEGACY_USER_KEY);
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function setUser(user: User): void {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  localStorage.removeItem(LEGACY_USER_KEY);
}

export function isAuthenticated(): boolean {
  const token = getToken();
  return !!token && !isTokenExpired(token);
}

export function forceLogout(): void {
  removeToken();
  window.location.href = "/login";
}
