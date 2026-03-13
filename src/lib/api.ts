import {
  PaginatedResponse,
  AiInsightResponse,
  ProjectPnlAnalysis,
  ProductionForecast,
  DashboardSummary,
  ProjectAnalysisRequest,
  ProductionForecastRequest,
  DashboardSummaryRequest,
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let message = "API Error";
    try {
      const error = await res.json();
      message = error.message || message;
    } catch {
      // ignore parse error
    }
    throw new ApiError(message, res.status);
  }

  const json = await res.json();
  return json.data;
}

// AI Insights
export async function analyzeProjectPnl(params: ProjectAnalysisRequest) {
  return fetchApi<AiInsightResponse<ProjectPnlAnalysis>>(
    "/ai-insights/batch-pnl-analysis",
    { method: "POST", body: JSON.stringify(params) }
  );
}

export async function getProductionForecast(params: ProductionForecastRequest) {
  return fetchApi<AiInsightResponse<ProductionForecast>>(
    "/ai-insights/production-forecast",
    { method: "POST", body: JSON.stringify(params) }
  );
}

export async function getDashboardSummary(params: DashboardSummaryRequest) {
  return fetchApi<AiInsightResponse<DashboardSummary>>(
    "/ai-insights/dashboard-summary",
    { method: "POST", body: JSON.stringify(params) }
  );
}

export async function fetchPaginated<T>(
  endpoint: string,
  params?: { page?: number; limit?: number; search?: string; extra?: Record<string, string> }
): Promise<PaginatedResponse<T>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);
  if (params?.extra) {
    Object.entries(params.extra).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
  }

  const query = searchParams.toString();
  const url = query ? `${endpoint}?${query}` : endpoint;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${API_URL}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!res.ok) {
    let message = "API Error";
    try {
      const error = await res.json();
      message = error.message || message;
    } catch {
      // ignore parse error
    }
    throw new ApiError(message, res.status);
  }

  const json = await res.json();
  return json.data;
}
