import crypto from 'crypto';

export interface VnpayPaymentParams {
  txnRef: string;
  amount: number; // Số tiền VND nguyên bản (ví dụ 100000 đ)
  orderInfo: string;
  ipAddr?: string;
  bankCode?: string; // Tùy chọn (VNPAYQR, VNBANK, INTCARD...)
  locale?: 'vn' | 'en';
}

/**
 * Format ngày theo chuẩn GMT+7: yyyyMMddHHmmss
 */
export function formatVnpayDate(date: Date = new Date()): string {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const gmt7 = new Date(utc + 7 * 3600000);

  const yyyy = gmt7.getFullYear();
  const MM = String(gmt7.getMonth() + 1).padStart(2, '0');
  const dd = String(gmt7.getDate()).padStart(2, '0');
  const HH = String(gmt7.getHours()).padStart(2, '0');
  const mm = String(gmt7.getMinutes()).padStart(2, '0');
  const ss = String(gmt7.getSeconds()).padStart(2, '0');

  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
}

/**
 * Sắp xếp các tham số theo thứ tự alphabet theo chuẩn VNPay
 */
export function sortVnpayObject(obj: Record<string, any>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    const val = obj[key];
    if (val !== undefined && val !== null && val !== '') {
      sorted[key] = String(val);
    }
  }

  return sorted;
}

/**
 * Tạo URL thanh toán VNPay có chữ ký HMAC-SHA512
 */
export function createVnpayPaymentUrl(params: VnpayPaymentParams): {
  paymentUrl: string;
  txnRef: string;
  expireDate: Date;
  createDate: Date;
} {
  const tmnCode = process.env.VNP_TMN_CODE || 'DEMO_TMN';
  const secretKey = process.env.VNP_HASH_SECRET || 'DEMO_SECRET_KEY';
  const vnpUrl = process.env.VNP_PAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const returnUrl =
    process.env.VNP_RETURN_URL || 'http://localhost:3000/staff/billing/vnpay-return';

  const now = new Date();
  const createDateStr = formatVnpayDate(now);

  // Mặc định hết hạn sau 15 phút
  const expireMinutes = Number(process.env.VNP_EXPIRE_MINUTES) || 15;
  const expireDate = new Date(now.getTime() + expireMinutes * 60 * 1000);
  const expireDateStr = formatVnpayDate(expireDate);

  // VNPay yêu cầu nhân 100 số tiền VND (10.000 đ -> 1.000.000)
  const vnpAmount = Math.round(params.amount) * 100;

  const vnpParams: Record<string, string | number> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: params.locale || 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: params.txnRef,
    vnp_OrderInfo: params.orderInfo.trim(),
    vnp_OrderType: 'other',
    vnp_Amount: vnpAmount,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: params.ipAddr || '127.0.0.1',
    vnp_CreateDate: createDateStr,
    vnp_ExpireDate: expireDateStr,
  };

  if (params.bankCode) {
    vnpParams['vnp_BankCode'] = params.bankCode;
  }

  const sortedParams = sortVnpayObject(vnpParams);

  // Tạo sign data: key1=value1&key2=value2...
  const signData = Object.entries(sortedParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', secretKey);
  const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const finalUrl = `${vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;

  return {
    paymentUrl: finalUrl,
    txnRef: params.txnRef,
    expireDate,
    createDate: now,
  };
}

/**
 * Kiểm tra tính hợp lệ của chữ ký HMAC-SHA512 từ VNPay callback (IPN / Return URL)
 */
export function verifyVnpaySecureHash(query: Record<string, any>): {
  isValid: boolean;
  receivedHash: string;
  calculatedHash: string;
} {
  const secretKey = process.env.VNP_HASH_SECRET || 'DEMO_SECRET_KEY';
  const receivedHash = (query['vnp_SecureHash'] || '').toString();

  const cleanQuery: Record<string, any> = {};
  for (const [k, v] of Object.entries(query)) {
    if (k !== 'vnp_SecureHash' && k !== 'vnp_SecureHashType') {
      cleanQuery[k] = v;
    }
  }

  const sorted = sortVnpayObject(cleanQuery);
  const signData = Object.entries(sorted)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', secretKey);
  const calculatedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const isValid = receivedHash.toLowerCase() === calculatedHash.toLowerCase();

  return {
    isValid,
    receivedHash,
    calculatedHash,
  };
}
