import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatVnpayDate,
  sortVnpayObject,
  createVnpayPaymentUrl,
  verifyVnpaySecureHash,
} from '../../src/utils/vnpay.util';

describe('Unit Test - VNPay Utility & Cryptographic Checksum (SPEC-PAY / UC-28)', () => {
  beforeEach(() => {
    process.env.VNP_TMN_CODE = 'TEST_TMN';
    process.env.VNP_HASH_SECRET = 'TEST_HASH_SECRET_123456';
    process.env.VNP_PAY_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    process.env.VNP_RETURN_URL = 'http://localhost:3000/staff/billing/vnpay-return';
  });

  it('VNP-01: formatVnpayDate() trả về chuỗi 14 ký tự chuẩn yyyyMMddHHmmss', () => {
    const fixedDate = new Date('2026-11-03T10:30:45.000Z');
    const result = formatVnpayDate(fixedDate);

    expect(result).toHaveLength(14);
    expect(/^\d{14}$/.test(result)).toBe(true);
  });

  it('VNP-02: sortVnpayObject() sắp xếp các key theo đúng thứ tự alphabet và bỏ qua giá trị rỗng', () => {
    const input = {
      vnp_TxnRef: 'REF123',
      vnp_Amount: 10000000,
      vnp_Command: 'pay',
      vnp_Empty: '',
      vnp_Null: null,
    };

    const sorted = sortVnpayObject(input);
    const keys = Object.keys(sorted);

    expect(keys).toEqual(['vnp_Amount', 'vnp_Command', 'vnp_TxnRef']);
    expect(sorted.vnp_Amount).toBe('10000000');
    expect(sorted.vnp_Command).toBe('pay');
  });

  it('VNP-03: createVnpayPaymentUrl() tạo URL chứa vnp_SecureHash hợp lệ và nhân 100 số tiền', () => {
    const res = createVnpayPaymentUrl({
      txnRef: 'PAY-WO10-01',
      amount: 250000, // 250.000 đ
      orderInfo: 'Thanh toan hoa don INV-202611-001',
      ipAddr: '127.0.0.1',
    });

    expect(res.paymentUrl).toContain('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?');
    expect(res.paymentUrl).toContain('vnp_Amount=25000000'); // 250.000 * 100
    expect(res.paymentUrl).toContain('vnp_TxnRef=PAY-WO10-01');
    expect(res.paymentUrl).toContain('vnp_SecureHash=');
    expect(res.expireDate.getTime()).toBeGreaterThan(res.createDate.getTime());
  });

  it('VNP-04: verifyVnpaySecureHash() xác thực đúng khi query nguyên vẹn và phát hiện gian lận khi dữ liệu bị sửa', () => {
    const { paymentUrl } = createVnpayPaymentUrl({
      txnRef: 'PAY-WO10-02',
      amount: 500000,
      orderInfo: 'Thanh toan hoa don',
      ipAddr: '127.0.0.1',
    });

    // Bóc tách query params từ URL vừa sinh
    const urlObj = new URL(paymentUrl);
    const queryParams: Record<string, string> = {};
    urlObj.searchParams.forEach((val, key) => {
      queryParams[key] = val;
    });

    // 1. Kiểm tra query gốc -> Hợp lệ
    const validCheck = verifyVnpaySecureHash(queryParams);
    expect(validCheck.isValid).toBe(true);

    // 2. Kẻ gian sửa tiền từ 50.000.000 (500k) thành 100.000 (1k) mà không có Secret Key
    const tamperedQuery = { ...queryParams, vnp_Amount: '100000' };
    const invalidCheck = verifyVnpaySecureHash(tamperedQuery);
    expect(invalidCheck.isValid).toBe(false);

    // 3. Thiếu SecureHash
    const noHashQuery = { ...queryParams, vnp_SecureHash: '' };
    expect(verifyVnpaySecureHash(noHashQuery).isValid).toBe(false);
  });
});

