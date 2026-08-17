import type { ZodError } from "zod";
import type { ApiErrorBody, ApiSuccess, PaginationMeta } from "@/types";

export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  TOO_MANY_ATTEMPTS: "TOO_MANY_ATTEMPTS",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  ACCOUNT_INACTIVE: "ACCOUNT_INACTIVE",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  TOKEN_INVALID: "TOKEN_INVALID",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  OTP_INVALID: "OTP_INVALID",
  OTP_EXPIRED: "OTP_EXPIRED",
  OTP_MAX_ATTEMPTS: "OTP_MAX_ATTEMPTS",
  OTP_COOLDOWN: "OTP_COOLDOWN",
  USER_EXISTS: "USER_EXISTS",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly errors?: Record<string, string[]>;

  constructor(
    message: string,
    opts: { statusCode?: number; code?: ErrorCode; errors?: Record<string, string[]> } = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = opts.statusCode ?? 400;
    this.code = opts.code ?? ERROR_CODES.INTERNAL_ERROR;
    this.errors = opts.errors;
  }

  static badRequest(message: string, errors?: Record<string, string[]>): ApiError {
    return new ApiError(message, { statusCode: 400, code: ERROR_CODES.VALIDATION_ERROR, errors });
  }

  static unauthorized(message = "Authentication required"): ApiError {
    return new ApiError(message, { statusCode: 401, code: ERROR_CODES.UNAUTHORIZED });
  }

  static forbidden(message = "You do not have permission to perform this action"): ApiError {
    return new ApiError(message, { statusCode: 403, code: ERROR_CODES.FORBIDDEN });
  }

  static notFound(message = "Resource not found"): ApiError {
    return new ApiError(message, { statusCode: 404, code: ERROR_CODES.NOT_FOUND });
  }

  static conflict(message: string): ApiError {
    return new ApiError(message, { statusCode: 409, code: ERROR_CODES.CONFLICT });
  }

  static rateLimited(message = "Too many requests. Please try again later."): ApiError {
    return new ApiError(message, { statusCode: 429, code: ERROR_CODES.RATE_LIMITED });
  }

  static internal(message = "Internal server error"): ApiError {
    return new ApiError(message, { statusCode: 500, code: ERROR_CODES.INTERNAL_ERROR });
  }
}

export function apiSuccess<T>(data: T, meta?: PaginationMeta, status = 200): Response {
  const body: ApiSuccess<T> = { success: true, data, ...(meta ? { meta } : {}) };
  return Response.json(body, { status });
}

export function apiError(
  message: string,
  statusCode: number,
  code: ErrorCode,
  errors?: Record<string, string[]>
): Response {
  const body: ApiErrorBody = { success: false, message, code, ...(errors ? { errors } : {}) };
  return Response.json(body, { status: statusCode });
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return apiError(error.message, error.statusCode, error.code, error.errors);
  }

  if (isZodError(error)) {
    const errors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "_";
      errors[key] ??= [];
      errors[key].push(issue.message);
    }
    return apiError("Validation failed", 400, ERROR_CODES.VALIDATION_ERROR, errors);
  }

  console.error("[api] Unhandled error:", error);
  const message =
    process.env.NODE_ENV !== "production" && error instanceof Error
      ? error.message
      : "Internal server error";
  return apiError(message, 500, ERROR_CODES.INTERNAL_ERROR);
}

function isZodError(error: unknown): error is ZodError {
  return (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray((error as ZodError).issues)
  );
}

export type ApiHandler = (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<Response>;

export function route(handler: ApiHandler): ApiHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
