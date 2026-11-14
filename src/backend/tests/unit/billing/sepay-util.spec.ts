import { describe, it, expect, beforeEach } from 'vitest';
import {
  signSepayFields,
  initSepayOneTimePaymentFields,
  getSepayCheckoutUrl,
  verifySepayIpnSecretKey,
  extractInvoiceNumberFromContent,
} from '../../../src/utils/sepay.util';
import * as crypto from 'crypto';

describe('Unit Test - SePay Payment Gateway Utility (SPEC-SEPAY)', () => {
  const secretKey = 'test_secret_key_12345';
  const merchantId = 'TEST_MERCHANT_01';

  beforeEach(() => {
    process.env.SEPAY_ENV = 'sandbox';
    process.env.SEPAY_MERCHANT_ID = merchantId;
    process.env.SEPAY_SECRET_KEY = secretKey;
    process.env.SEPAY_API_KEY = 'test_api_key_bank_hub_67890';
    process.env.SEPAY_CHECKOUT_VERSION = 'v1';
    delete process.env.SEPAY_BYPASS_WEBHOOK_AUTH;
  });

  it('SEPAY-01: getSepayCheckoutUrl() trả về URL sandbox hoặc production chính xác', () => {
    expect(getSepayCheckoutUrl({ env: 'sandbox', checkout_version: 'v1' })).toBe(
      'https://pay-sandbox.sepay.vn/v1/checkout/init'
    );
    expect(getSepayCheckoutUrl({ env: 'production', checkout_version: 'v1' })).toBe(
      'https://pay.sepay.vn/v1/checkout/init'
    );
  });

  it('SEPAY-02: signSepayFields() tạo chữ ký HMAC-SHA256 Base64 đúng thứ tự canonical', () => {
    const fields = {
      merchant: merchantId,
      operation: 'PURCHASE',
      payment_method: 'BANK_TRANSFER',
      order_amount: 1425000,
      currency: 'VND',
      order_invoice_number: 'INV-202611-001',
      order_description: 'Thanh toan hoa don INV-202611-001',
      success_url: 'http://localhost:3000/customer/invoices?status=success',
      cancel_url: 'http://localhost:3000/customer/invoices?status=cancel',
    };

    const signature = signSepayFields(fields, secretKey);
    expect(typeof signature).toBe('string');
    expect(signature.length).toBeGreaterThan(20);

    // Kiểm tra tính lại thủ công
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
    for (const key of canonicalOrder) {
      if ((fields as any)[key] !== undefined) {
        signedParts.push(`${key}=${(fields as any)[key]}`);
      }
    }
    const expectedHmac = crypto.createHmac('sha256', secretKey).update(signedParts.join(',')).digest('base64');
    expect(signature).toBe(expectedHmac);
  });

  it('SEPAY-03: initSepayOneTimePaymentFields() chuẩn bị đầy đủ trường và URL checkout', () => {
    const result = initSepayOneTimePaymentFields({
      order_invoice_number: 'INV-202611-001',
      order_amount: 1425000,
      order_description: 'Thanh toan don hang',
    });

    expect(result.checkoutUrl).toBe('https://pay-sandbox.sepay.vn/v1/checkout/init');
    expect(result.fields.merchant).toBe(merchantId);
    expect(result.fields.operation).toBe('PURCHASE');
    expect(result.fields.order_amount).toBe(1425000);
    expect(result.fields.order_invoice_number).toBe('INV-202611-001');
    expect(result.fields.currency).toBe('VND');
    expect(result.fields.signature).toBeDefined();
  });

  it('SEPAY-04: verifySepayIpnSecretKey() xác thực đúng khi header khớp secret key hoặc Authorization Apikey', () => {
    expect(verifySepayIpnSecretKey(secretKey)).toBe(true);
    expect(verifySepayIpnSecretKey('wrong_secret_key')).toBe(false);
    expect(verifySepayIpnSecretKey(undefined)).toBe(false);
    expect(verifySepayIpnSecretKey('')).toBe(false);

    // SePay Bank Hub Authorization header
    expect(verifySepayIpnSecretKey(undefined, 'Apikey test_api_key_bank_hub_67890')).toBe(true);
    expect(verifySepayIpnSecretKey(undefined, 'Bearer test_api_key_bank_hub_67890')).toBe(true);
    expect(verifySepayIpnSecretKey(undefined, 'Apikey wrong_api_key')).toBe(false);
  });

  it('SEPAY-05: extractInvoiceNumberFromContent() trích xuất chính xác mã INV', () => {
    expect(extractInvoiceNumberFromContent('Thanh toan INV-202611-0001 tien sua xe')).toBe('INV-202611-0001');
    expect(extractInvoiceNumberFromContent('CK INV-202611-002')).toBe('INV-202611-002');
    expect(extractInvoiceNumberFromContent('No invoice here')).toBeNull();
    expect(extractInvoiceNumberFromContent('')).toBeNull();
    expect(extractInvoiceNumberFromContent(undefined)).toBeNull();
  });
});

