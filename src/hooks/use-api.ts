"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApi, fetchPaginated, ApiError } from "@/lib/api";
import { PaginatedResponse } from "@/types/api";

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(endpoint: string | null): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(!!endpoint);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  useEffect(() => {
    if (!endpoint) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchApi<T>(endpoint)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "An error occurred"
          );
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [endpoint, trigger]);

  return { data, isLoading, error, refetch };
}

interface UsePaginatedState<T> {
  data: T[];
  meta: PaginatedResponse<T>["meta"] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePaginated<T>(
  endpoint: string,
  params?: { page?: number; limit?: number; search?: string; extra?: Record<string, string> }
): UsePaginatedState<T> {
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<T>["meta"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const extraKey = params?.extra ? JSON.stringify(params.extra) : "";
  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchPaginated<T>(endpoint, params)
      .then((result) => {
        if (!cancelled) {
          setData(result.data);
          setMeta(result.meta);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "An error occurred"
          );
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [endpoint, params?.page, params?.limit, params?.search, extraKey, trigger]);

  return { data, meta, isLoading, error, refetch };
}
