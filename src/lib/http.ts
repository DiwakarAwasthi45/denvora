import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import type { ApiErrorBody, ApiSuccess } from "@/types";

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

export class HttpClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly errors?: Record<string, string[]>;

  constructor(message: string, status: number, code: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = "HttpClientError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

const client = axios.create({
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const body = error.response?.data;
    throw new HttpClientError(
      body?.message ?? "Something went wrong. Please try again.",
      error.response?.status ?? 0,
      body?.code ?? "UNKNOWN_ERROR",
      body?.errors
    );
  }
);

export async function http<T>(url: string, options: RequestOptions = {}): Promise<ApiSuccess<T>> {
  const { method = "GET", body, headers } = options;

  const config: AxiosRequestConfig = {
    method,
    url,
    data: body !== undefined ? body : undefined,
    headers,
  };

  const res = await client.request<ApiSuccess<T>>(config);

  const payload = res.data;
  if (!payload) {
    throw new HttpClientError("Invalid response from server", res.status, "INVALID_RESPONSE");
  }

  if (!payload.success) {
    throw new HttpClientError("Invalid response from server", res.status, "INVALID_RESPONSE");
  }

  return payload;
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await http<T>(url);
  return res.data;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await http<T>(url, { method: "POST", body });
  return res.data;
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const res = await http<T>(url, { method: "PATCH", body });
  return res.data;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await http<T>(url, { method: "DELETE" });
  return res.data;
}
