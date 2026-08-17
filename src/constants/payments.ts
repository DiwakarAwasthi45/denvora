/**
 * Payment gateway configuration.
 *
 * Real merchant credentials are read from env at the clinic-level when available.
 * In development (vars absent), a dev mock gateway is used that logs to dev.log
 * and records transactions in Mongo, so billing flows are fully testable offline.
 *
 * Env schema:
 *   PAYMENT_GATEWAY        esewa | khalti | fonepay | mock   (default: mock in dev)
 *   ESEWA_MERCHANT_ID      esewa merchant id
 *   ESEWA_MERCHANT_SECRET  esewa secret key
 *   ESEWA_SUCCESS_URL      esewa success redirect
 *   ESEWA_FAILURE_URL      esewa failure redirect
 *   KHALTI_PUBLIC_KEY      khalti public key
 *   KHALTI_SECRET_KEY      khalti secret key
 *   KHALTI_RETURN_URL      khalti return url
 *   FONEPAY_MERCHANT_CODE  fonepay merchant code
 *   FONEPAY_MERCHANT_RNC   fonepay RNC
 *   FONEPAY_SECRET         fonepay secret
 *   FONEPAY_RETURN_URL     fonepay return url
 */

export type Gateway = "esewa" | "khalti" | "fonepay" | "mock";

export interface GatewayConfig {
  gateway: Gateway;
  isLive: boolean;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  gateway: Gateway;
  redirectUrl: string | null;
  payload: Record<string, unknown>;
  expiresAt: string;
}

export interface VerifyResult {
  ok: boolean;
  transactionId?: string;
  status: "completed" | "failed" | "pending";
  message?: string;
}

export const PAYMENT_CONFIG: GatewayConfig = {
  gateway: (process.env.PAYMENT_GATEWAY as Gateway) ?? (process.env.NODE_ENV === "production" ? "esewa" : "mock"),
  isLive:
    process.env.NODE_ENV === "production" &&
    Boolean(
      process.env.ESEWA_MERCHANT_SECRET ||
        process.env.KHALTI_SECRET_KEY ||
        process.env.FONEPAY_SECRET
    ),
};
