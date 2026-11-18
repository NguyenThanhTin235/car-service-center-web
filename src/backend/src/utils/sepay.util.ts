import * as crypto from 'crypto';
import { SePayPgClient } from 'sepay-pg-node';

export interface SepayConfig {
  env?: 'sandbox' | 'production';
  merchant_id?: string;
  secret_key?: string;
  api_version?: 'v1';
  checkout_version?: 'v1';
  success_url?: string;
  cancel_url?: string;
}

export interface CreateSepayPaymentParams {
  order_invoice_number: string;
  order_amount: number;
  currency?: string;
  order_description?: string;
  payment_method?: 'BANK_TRANSFER' | 'NAPAS_BANK_TRANSFER';
  customer_id?: string;
  success_url?: string;
  cancel_url?: string;
  error_url?: string;
  custom_data?: string;
}

export interface SepayPaymentFields extends Record<string, any> {
  merchant: string;
  operation: 'PURCHASE';
  payment_method: string;
  order_invoice_number: string;
  order_amount: number;
  currency: string;
  order_description: string;
  success_url?: string;
  cancel_url?: string;
  error_url?: string;
  customer_id?: string;
  custom_data?: string;
  signature: string;
}

export interface SepayIpnPayload {
  timestamp: number;
  notification_type: 'ORDER_PAID' | 'TRANSACTION_VOID' | string;
  order: {
    id?: string;
    order_id?: string;
    order_status?: string;
    order_currency?: string;
    order_amount: string | number;
    order_invoice_number: string;
    order_description?: string;
    custom_data?: any;
  };
  transaction?: {
    id?: string;
    payment_method?: string;
    transaction_id?: string;
    transaction_type?: string;
    transaction_date?: string;
    transaction_status?: string;
    transaction_amount?: string | number;
  };
  customer?: {
    id?: string;
    email?: string;
  };
}

/**
 * Returns configuration from environment variables with fallback defaults
 */
export function getSepayConfig(): Required<SepayConfig> {
  const env = (process.env.SEPAY_ENV as 'sandbox' | 'production') || 'sandbox';
  return {
    env,
    merchant_id: process.env.SEPAY_MERCHANT_ID || 'SB_MERCHANT_CAR_SERVICE',
    secret_key: process.env.SEPAY_SECRET_KEY || 'sepay_secret_key_car_service_2026',
    api_version: (process.env.SEPAY_API_VERSION as 'v1') || 'v1',
    checkout_version: (process.env.SEPAY_CHECKOUT_VERSION as 'v1') || 'v1',
    success_url: process.env.SEPAY_SUCCESS_URL || 'http://localhost:3000/customer/invoices?status=success',
    cancel_url: process.env.SEPAY_CANCEL_URL || 'http://localhost:3000/customer/invoices?status=cancel',
  };
}

/**
 * Creates an instance of the official SePayPgClient from sepay-pg-node
 */
export function createSepayPgClient(config?: SepayConfig): SePayPgClient {
  const cfg = { ...getSepayConfig(), ...config };
  return new SePayPgClient({
    env: cfg.env,
    merchant_id: cfg.merchant_id,
    secret_key: cfg.secret_key,
    api_version: cfg.api_version,
    checkout_version: cfg.checkout_version,
  });
}

/**
 * Computes canonical HMAC-SHA256 Base64 signature for SePay Checkout
 * Matching the exact algorithm in sepay-pg-node
 */
export function signSepayFields(fields: Record<string, any>, secretKey: string): string {
  const canonicalOrder = [
    'merchant',
    'env',
    'operation',
    'payment_method',
    'order_amount',
    'currency',
    'order_invoice_number',
    'order_description',
    'customer_id',
    'agreement_id',
    'agreement_name',
    'agreement_type',
    'agreement_payment_frequency',
    'agreement_amount_per_payment',
    'success_url',
    'error_url',
    'cancel_url',
    'order_id',
  ];

  const signedParts: string[] = [];
  for (const field of canonicalOrder) {
    if (fields[field] !== undefined) {
      signedParts.push(`${field}=${fields[field] ?? ''}`);
    }
  }

  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(signedParts.join(','));
  return hmac.digest('base64');
}

/**
 * Returns the checkout URL based on environment and version using SePayPgClient
 */
export function getSepayCheckoutUrl(config?: SepayConfig): string {
  const client = createSepayPgClient(config);
  return client.checkout.initCheckoutUrl();
}

/**
 * Prepares one-time payment fields and signs them with secret key using SePayPgClient
 */
export function initSepayOneTimePaymentFields(
  params: CreateSepayPaymentParams,
  config?: SepayConfig,
): { checkoutUrl: string; fields: SepayPaymentFields } {
  const cfg = { ...getSepayConfig(), ...config };
  const client = createSepayPgClient(cfg);

  const rawFields: any = {
    operation: 'PURCHASE',
    payment_method: params.payment_method || 'BANK_TRANSFER',
    order_invoice_number: params.order_invoice_number,
    order_amount: Math.round(Number(params.order_amount)),
    currency: params.currency || 'VND',
    order_description: params.order_description || `Thanh toan hoa don ${params.order_invoice_number}`,
    success_url: params.success_url || cfg.success_url,
    cancel_url: params.cancel_url || cfg.cancel_url,
    error_url: params.error_url || cfg.cancel_url,
  };

  if (params.customer_id) {
    rawFields.customer_id = params.customer_id;
  }
  if (params.custom_data) {
    rawFields.custom_data = params.custom_data;
  }

  const fields = client.checkout.initOneTimePaymentFields(rawFields) as SepayPaymentFields;
  const checkoutUrl = client.checkout.initCheckoutUrl();

  return {
    checkoutUrl,
    fields,
  };
}

/**
 * Verifies the X-Secret-Key or Authorization: Apikey header from incoming IPN requests
 */
export function verifySepayIpnSecretKey(
  headerKey?: string | string[],
  authHeader?: string | string[]
): boolean {
  const cfg = getSepayConfig();
  const configuredSecret = cfg.secret_key?.trim();
  const configuredApiKey = process.env.SEPAY_API_KEY?.trim();

  // 1. Kiểm tra qua X-Secret-Key (SePay Payment Gateway)
  if (headerKey && configuredSecret) {
    const key = Array.isArray(headerKey) ? headerKey[0] : headerKey;
    if (key.trim() === configuredSecret) return true;
  }

  // 2. Kiểm tra qua Authorization: Apikey <api_key> (SePay Bank Hub Webhook)
  if (authHeader) {
    const auth = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    const token = auth.replace(/^Apikey\s+/i, '').replace(/^Bearer\s+/i, '').trim();
    if (
      (configuredSecret && token === configuredSecret) ||
      (configuredApiKey && token === configuredApiKey)
    ) {
      return true;
    }
  }

  // 3. Nếu người dùng cấu hình không chứng thực cho Webhook Bank Hub trong môi trường dev/local
  if (!headerKey && !authHeader && process.env.SEPAY_BYPASS_WEBHOOK_AUTH === 'true') {
    return true;
  }

  return false;
}

/**
 * Trích xuất mã hóa đơn từ nội dung chuyển khoản ngân hàng (SePay Bank Hub)
 * Vd: "Thanh toan INV-202611-001" -> "INV-202611-001"
 */
export function extractInvoiceNumberFromContent(content?: string): string | null {
  if (!content) return null;
  const match = content.match(/INV(?:[-_][A-Za-z0-9]+)+|\bINV\d{4,}\b/i);
  return match ? match[0].toUpperCase() : null;
}
