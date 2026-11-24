import type { Page, Route } from '@playwright/test';

export const CUSTOMER_BASE_URL = 'http://localhost:3000';

export const MOCK_CUSTOMER_USER = {
  id: 10,
  email: 'customer@example.com',
  fullName: 'Nguyễn Văn Khách',
  phone: '0901234567',
  address: '77 Nguyễn Huệ, Quận 1, TP.HCM',
  roles: ['CUSTOMER'],
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const MOCK_CATEGORIES = [
  { id: 1, name: 'Bảo dưỡng định kỳ', description: 'Bảo dưỡng theo mốc km', _count: { services: 3 } },
  { id: 2, name: 'Sửa chữa động cơ', description: 'Chẩn đoán & đại tu động cơ', _count: { services: 2 } },
  { id: 3, name: 'Chăm sóc xe', description: 'Vệ sinh & làm đẹp xe', _count: { services: 2 } },
];

export const MOCK_PUBLIC_SERVICES = [
  {
    id: 1,
    name: 'Bảo dưỡng 40.000 km',
    description: 'Kiểm tra toàn diện 48 hạng mục an toàn, thay dầu và lọc định kỳ.',
    category: { id: 1, name: 'Bảo dưỡng định kỳ' },
    pricingType: 'VEHICLE_SIZE' as const,
    fixedPrice: null,
    sizePrices: [
      { vehicleSize: 'SMALL', price: '2500000' },
      { vehicleSize: 'LARGE', price: '3200000' },
    ],
  },
  {
    id: 2,
    name: 'Thay dầu động cơ tổng hợp 5W-30',
    description: 'Dầu tổng hợp toàn phần và thay lọc nhớt chính hãng.',
    category: { id: 1, name: 'Bảo dưỡng định kỳ' },
    pricingType: 'FIXED' as const,
    fixedPrice: '950000',
    sizePrices: [],
  },
  {
    id: 3,
    name: 'Bảo dưỡng phanh 4 bánh',
    description: 'Vệ sinh má phanh, tra mỡ ắc phanh và kiểm tra dầu phanh.',
    category: { id: 1, name: 'Bảo dưỡng định kỳ' },
    pricingType: 'FIXED' as const,
    fixedPrice: '650000',
    sizePrices: [],
  },
  {
    id: 4,
    name: 'Chẩn đoán động cơ OBD-II',
    description: 'Đọc lỗi ECU chuyên sâu và kiểm tra cảm biến động cơ.',
    category: { id: 2, name: 'Sửa chữa động cơ' },
    pricingType: 'FIXED' as const,
    fixedPrice: '350000',
    sizePrices: [],
  },
  {
    id: 5,
    name: 'Đại tu gầm & hệ thống treo',
    description: 'Kiểm tra rotuyn, giảm xóc và cân chỉnh thước lái 3D.',
    category: { id: 2, name: 'Sửa chữa động cơ' },
    pricingType: 'LABOUR_PARTS' as const,
    fixedPrice: null,
    sizePrices: [],
  },
  {
    id: 6,
    name: 'Vệ sinh nội thất & khử khuẩn cabin',
    description: 'Làm sạch ghế da, trần nỉ bằng hơi nước nóng và ozone.',
    category: { id: 3, name: 'Chăm sóc xe' },
    pricingType: 'FIXED' as const,
    fixedPrice: '850000',
    sizePrices: [],
  },
  {
    id: 7,
    name: 'Đánh bóng & phủ Ceramic thân vỏ',
    description: 'Hiệu chỉnh bề mặt sơn 3 bước và phủ Ceramic bảo vệ.',
    category: { id: 3, name: 'Chăm sóc xe' },
    pricingType: 'FIXED' as const,
    fixedPrice: '3500000',
    sizePrices: [],
  },
];

export const MOCK_VEHICLES = [
  {
    id: 10,
    licensePlate: '51A-999.99',
    make: 'Honda',
    model: 'CR-V',
    year: 2022,
    color: 'Trắng',
    vehicleSize: 'LARGE',
    isActive: true,
    hasTransactions: true,
    activeWorkOrder: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 11,
    licensePlate: '30E-888.88',
    make: 'Toyota',
    model: 'Camry',
    year: 2021,
    color: 'Đen',
    vehicleSize: 'LARGE',
    isActive: true,
    hasTransactions: false,
    activeWorkOrder: null,
    createdAt: '2026-01-05T00:00:00.000Z',
  },
];

export function formatIsoDateLocal(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function createInitialAppointments() {
  const now = new Date();
  const inSameMonth = new Date(now.getFullYear(), now.getMonth(), Math.min(now.getDate() + 1, 28));
  if (inSameMonth.getDate() <= now.getDate()) {
    inSameMonth.setDate(now.getDate());
  }
  const dateStr = formatIsoDateLocal(inSameMonth);

  return [
    {
      id: 501,
      customer_id: 10,
      vehicle_id: 10,
      scheduled_date: dateStr,
      scheduled_time: '09:00',
      scheduled_time_str: '09:00',
      status: 'REQUESTED',
      cancel_reason: null,
      notes: 'Kiểm tra bảo dưỡng định kỳ và tiếng ồn gầm xe.',
      customer: { id: 10, full_name: MOCK_CUSTOMER_USER.fullName, phone: MOCK_CUSTOMER_USER.phone },
      vehicle: { id: 10, license_plate: '51A-999.99', make: 'Honda', model: 'CR-V' },
      services: [{ id: 1, name: 'Bảo dưỡng 40.000 km' }],
    },
  ];
}

export function createMockTrackingOrder() {
  return {
    id: 701,
    woNumber: 'WO-202611-001',
    status: 'IN_PROGRESS',
    createdAt: '2026-11-20T08:00:00.000Z',
    updatedAt: '2026-11-20T10:30:00.000Z',
    vehicle: {
      id: 10,
      licensePlate: '51A-999.99',
      make: 'Honda',
      model: 'CR-V',
      year: 2022,
      color: 'Trắng',
      vehicleSize: 'LARGE',
      mileage: 42500,
    },
    advisor: {
      id: 2,
      fullName: 'Võ Minh Đạt',
      phone: '0909111222',
    },
    mechanic: {
      id: 5,
      fullName: 'Lê Văn Hùng',
      position: 'Kỹ thuật viên trưởng',
      skills: ['Động cơ', 'Hệ thống treo'],
    },
    services: [
      { id: 1, name: 'Bảo dưỡng 40.000 km', status: 'IN_PROGRESS', pricingType: 'FIXED', categoryName: 'Bảo dưỡng định kỳ' },
      { id: 2, name: 'Cân chỉnh thước lái 3D', status: 'COMPLETED', pricingType: 'FIXED', categoryName: 'Sửa chữa động cơ' },
    ],
    findings: [
      {
        id: 1,
        description: 'Má phanh trước mòn khoảng 75%, khuyến nghị thay mới sớm.',
        severity: 'MEDIUM',
        recommendation: 'Thay cặp má phanh trước chính hãng',
        createdAt: '2026-11-20T09:15:00.000Z',
      },
    ],
    checkIn: {
      id: 31,
      mileage: 42500,
      fuelLevel: 'HALF',
      complaint: JSON.stringify({ tags: ['Bảo dưỡng định kỳ'], notes: 'Xe rung nhẹ khi đi qua gờ giảm tốc' }),
      belongings: 'Bàn giao đầy đủ giấy tờ & lốp dự phòng',
      exteriorCondition: 'Thân vỏ nguyên vẹn, trầy nhẹ cản trước bên phải',
      status: 'CONFIRMED',
      confirmedAt: '2026-11-20T08:20:00.000Z',
      evidenceUrls: [],
      createdAt: '2026-11-20T08:15:00.000Z',
    },
    steps: [
      { stepIndex: 1, title: 'Tiếp nhận & Kiểm tra xe', status: 'COMPLETED', time: '08:15', description: 'Đã tiếp nhận và kiểm tra hiện trạng ban đầu.' },
      { stepIndex: 2, title: 'Thi công bảo dưỡng & sửa chữa', status: 'COMPLETED', time: '09:00', description: 'Hoàn tất thay dầu, lọc và kiểm tra gầm.' },
      { stepIndex: 3, title: 'Kiểm định chất lượng (KCS)', status: 'IN_PROGRESS', time: 'Đang kiểm định', description: 'Kiểm tra chất lượng và nghiệm thu kỹ thuật theo tiêu chuẩn an toàn của trung tâm.' },
      { stepIndex: 4, title: 'Thanh toán & Bàn giao xe', status: 'PENDING', time: undefined, description: 'Hoàn tất thanh toán SePay và bàn giao xe cho chủ xe.' },
    ],
    currentStep: 3,
    progressPercent: 60,
    qcReport: {
      hasQc: true,
      isPassed: true,
      totalItems: 12,
      passedItems: 12,
      failedItems: 0,
      inspectorName: 'Trần Quốc Bảo',
      inspectedAt: '2026-11-20T10:15:00.000Z',
      items: [
        { id: 1, itemName: 'Độ dày má phanh trước/sau', serviceName: 'Hệ thống phanh', result: 'PASS', notes: 'Đạt tiêu chuẩn an toàn' },
        { id: 2, itemName: 'Áp suất lốp & độ chụm bánh xe', serviceName: 'Cân chỉnh thước lái', result: 'PASS', notes: '2.3 bar' },
      ],
    },
    activeQuotation: {
      id: 801,
      quotationNumber: 'QUO-261120-001',
      quotationType: 'INITIAL',
      version: 1,
      status: 'SENT',
      subtotal: 2500000,
      discountAmount: 0,
      taxRate: 0,
      taxAmount: 0,
      grandTotal: 2500000,
      sentAt: '2026-11-20T08:40:00.000Z',
      createdAt: '2026-11-20T08:35:00.000Z',
      lines: [
        { id: 1, lineType: 'PACKAGE', description: 'Bảo dưỡng 40.000 km', quantity: 1, unitPrice: 1850000, amount: 1850000, sortOrder: 1 },
        { id: 2, lineType: 'PART', description: 'Lọc dầu động cơ chính hãng Honda', quantity: 1, unitPrice: 350000, amount: 350000, sortOrder: 2 },
        { id: 3, lineType: 'LABOUR', description: 'Nhân công cân chỉnh thước lái 3D', quantity: 1, unitPrice: 300000, amount: 300000, sortOrder: 3 },
      ],
    },
    quotations: [
      {
        id: 801,
        quotationNumber: 'QUO-261120-001',
        quotationType: 'INITIAL',
        version: 1,
        status: 'SENT',
        subtotal: 2500000,
        discountAmount: 0,
        taxRate: 0,
        taxAmount: 0,
        grandTotal: 2500000,
        sentAt: '2026-11-20T08:40:00.000Z',
        createdAt: '2026-11-20T08:35:00.000Z',
        lines: [
          { id: 1, lineType: 'PACKAGE', description: 'Bảo dưỡng 40.000 km', quantity: 1, unitPrice: 1850000, amount: 1850000, sortOrder: 1 },
          { id: 2, lineType: 'PART', description: 'Lọc dầu động cơ chính hãng Honda', quantity: 1, unitPrice: 350000, amount: 350000, sortOrder: 2 },
          { id: 3, lineType: 'LABOUR', description: 'Nhân công cân chỉnh thước lái 3D', quantity: 1, unitPrice: 300000, amount: 300000, sortOrder: 3 },
        ],
      },
    ],
    invoice: {
      id: 901,
      invoiceNumber: 'INV-261120-001',
      status: 'ISSUED',
      totalAmount: 2500000,
      amountDue: 2500000,
      issuedAt: '2026-11-20T10:30:00.000Z',
    },
  };
}

export const MOCK_INVOICES = [
  {
    id: 901,
    workOrderId: 701,
    invoiceNumber: 'INV-261120-001',
    status: 'ISSUED',
    subtotal: 2500000,
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: 2500000,
    amountDue: 2500000,
    issuedAt: '2026-11-20T10:30:00.000Z',
    createdAt: '2026-11-20T10:30:00.000Z',
    vehicle: { id: 10, licensePlate: '51A-999.99', make: 'Honda', model: 'CR-V', year: 2022 },
    primaryServiceDescription: 'Bảo dưỡng 40.000 km & Cân chỉnh thước lái 3D',
    paymentMethodDisplay: null,
  },
  {
    id: 902,
    workOrderId: 680,
    invoiceNumber: 'INV-261015-002',
    status: 'PAID',
    subtotal: 950000,
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: 950000,
    amountDue: 0,
    issuedAt: '2026-10-15T14:20:00.000Z',
    createdAt: '2026-10-15T14:20:00.000Z',
    vehicle: { id: 11, licensePlate: '30E-888.88', make: 'Toyota', model: 'Camry', year: 2021 },
    primaryServiceDescription: 'Thay dầu động cơ tổng hợp 5W-30',
    paymentMethodDisplay: 'Chuyển khoản SePay',
  },
];

export const MOCK_INVOICE_DETAIL = {
  id: 901,
  workOrderId: 701,
  invoiceNumber: 'INV-261120-001',
  status: 'ISSUED',
  subtotal: 2500000,
  discountAmount: 0,
  taxAmount: 0,
  totalAmount: 2500000,
  amountDue: 2500000,
  issuedAt: '2026-11-20T10:30:00.000Z',
  createdAt: '2026-11-20T10:30:00.000Z',
  customer: {
    id: 10,
    fullName: MOCK_CUSTOMER_USER.fullName,
    phone: MOCK_CUSTOMER_USER.phone,
    email: MOCK_CUSTOMER_USER.email,
  },
  vehicle: { id: 10, licensePlate: '51A-999.99', make: 'Honda', model: 'CR-V', year: 2022, color: 'Trắng' },
  advisor: { id: 2, fullName: 'Võ Minh Đạt', phone: '0909111222' },
  lines: [
    { id: 1, lineType: 'SERVICE', description: 'Bảo dưỡng 40.000 km', quantity: 1, unitPrice: 1850000, amount: 1850000, sortOrder: 1 },
    { id: 2, lineType: 'PART', description: 'Lọc dầu động cơ chính hãng Honda', quantity: 1, unitPrice: 350000, amount: 350000, sortOrder: 2 },
    { id: 3, lineType: 'LABOUR', description: 'Nhân công cân chỉnh thước lái 3D', quantity: 1, unitPrice: 300000, amount: 300000, sortOrder: 3 },
  ],
  payments: [],
};

export const MOCK_HISTORY_ITEMS = [
  {
    id: 680,
    woNumber: 'WO-202610-088',
    status: 'CLOSED',
    createdAt: '2026-10-15T08:00:00.000Z',
    closedAt: '2026-10-15T15:00:00.000Z',
    releasedAt: '2026-10-15T14:45:00.000Z',
    vehicle: { id: 11, license_plate: '30E-888.88', make: 'Toyota', model: 'Camry', year: 2021, color: 'Đen' },
    advisor: { id: 2, full_name: 'Võ Minh Đạt' },
    complaint: 'Thay dầu định kỳ mốc 20.000 km',
    mileageIn: 19850,
    mileageOut: 19855,
    warrantyTerms: 'Bảo hành 06 tháng hoặc 10.000 km tại hệ thống AutoCare Pro.',
    services: [{ id: 2, name: 'Thay dầu động cơ tổng hợp 5W-30', status: 'COMPLETED' }],
    invoice: { id: 902, invoice_number: 'INV-261015-002', status: 'PAID', total_amount: 950000 },
    hasHandoverPdf: true,
  },
];

export const MOCK_NOTIFICATIONS = [
  {
    id: 1001,
    userId: 10,
    type: 'QUOTATION_SENT',
    title: 'Báo giá mới #QUO-261120-001 cần phê duyệt',
    message: 'Cố vấn Võ Minh Đạt vừa gửi bảng báo giá cho xe 51A-999.99.',
    entityType: 'QUOTATION',
    entityId: 801,
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
  {
    id: 1002,
    userId: 10,
    type: 'APPOINTMENT_CONFIRMED',
    title: 'Xác nhận lịch hẹn bảo dưỡng',
    message: 'Lịch hẹn cho xe 30E-888.88 đã được xưởng tiếp nhận.',
    entityType: 'APPOINTMENT',
    entityId: 500,
    isRead: true,
    readAt: new Date(Date.now() - 3600_000).toISOString(),
    createdAt: new Date(Date.now() - 7200_000).toISOString(),
  },
];

export function attachPageErrorGuard(page: Page): string[] {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => {
    pageErrors.push(err.message || String(err));
  });
  return pageErrors;
}

export async function injectCustomerSession(page: Page, user = MOCK_CUSTOMER_USER) {
  await page.addInitScript((u) => {
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('token', 'mock-customer-jwt-token');
    localStorage.setItem('refreshToken', 'mock-customer-refresh-token');
  }, user);
}

export interface CustomerMockState {
  user: typeof MOCK_CUSTOMER_USER;
  vehicles: Array<Record<string, any>>;
  appointments: Array<Record<string, any>>;
  trackingOrder: Record<string, any>;
  invoices: Array<Record<string, any>>;
  invoiceDetail: Record<string, any>;
  historyItems: Array<Record<string, any>>;
  notifications: Array<Record<string, any>>;
  isPaid: boolean;
  authMeStatus: number;
}

function jsonOk(route: Route, data: unknown, status = 200, message = 'OK', extra: Record<string, unknown> = {}) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      code: status,
      message,
      data,
      timestamp: Date.now(),
      ...extra,
    }),
  });
}

export async function setupCustomerApiMocks(
  page: Page,
  overrides: Partial<CustomerMockState> = {}
): Promise<CustomerMockState> {
  const state: CustomerMockState = {
    user: { ...MOCK_CUSTOMER_USER },
    vehicles: structuredClone(MOCK_VEHICLES),
    appointments: createInitialAppointments(),
    trackingOrder: createMockTrackingOrder(),
    invoices: structuredClone(MOCK_INVOICES),
    invoiceDetail: structuredClone(MOCK_INVOICE_DETAIL),
    historyItems: structuredClone(MOCK_HISTORY_ITEMS),
    notifications: structuredClone(MOCK_NOTIFICATIONS),
    isPaid: false,
    authMeStatus: 200,
    ...overrides,
  };

  // Silence socket.io polling noise in headless E2E
  await page.route('**/socket.io/**', (route) => route.abort());

  // Public catalog endpoints
  await page.route('**/api/public/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith('/categories')) {
      return jsonOk(route, MOCK_CATEGORIES);
    }
    if (pathname.endsWith('/services')) {
      return jsonOk(route, MOCK_PUBLIC_SERVICES);
    }
    return jsonOk(route, []);
  });

  await page.route('**/api/services**', async (route) => {
    return jsonOk(
      route,
      MOCK_PUBLIC_SERVICES.map((s) => ({ id: s.id, name: s.name, description: s.description, isActive: true }))
    );
  });

  // Auth /me endpoints
  await page.route('**/api/auth/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const method = route.request().method();

    if (pathname.endsWith('/me')) {
      if (state.authMeStatus === 401) {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, code: 401, message: 'Phiên đăng nhập đã hết hạn' }),
        });
      }
      if (method === 'PUT') {
        const body = JSON.parse(route.request().postData() || '{}');
        state.user = { ...state.user, ...body };
        return jsonOk(route, state.user, 200, 'Cập nhật hồ sơ thành công');
      }
      return jsonOk(route, state.user);
    }

    if (pathname.endsWith('/refresh')) {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, code: 401, message: 'Refresh denied in mock' }),
      });
    }

    if (pathname.endsWith('/logout')) {
      return jsonOk(route, null, 200, 'Logged out');
    }

    return jsonOk(route, {});
  });

  // Notifications dispatcher
  await page.route('**/api/notifications**', async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;
    const method = route.request().method();

    if (pathname.endsWith('/unread-count')) {
      const count = state.notifications.filter((n) => !n.isRead).length;
      return jsonOk(route, { count });
    }

    if (pathname.endsWith('/read-all') && method === 'PATCH') {
      state.notifications = state.notifications.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }));
      return jsonOk(route, { updatedCount: state.notifications.length });
    }

    const readMatch = pathname.match(/\/api\/notifications\/(\d+)\/read$/);
    if (readMatch && method === 'PATCH') {
      const id = Number(readMatch[1]);
      const item = state.notifications.find((n) => n.id === id);
      if (item) {
        item.isRead = true;
        item.readAt = new Date().toISOString();
      }
      return jsonOk(route, item || { id, isRead: true });
    }

    const filterUnread = url.searchParams.get('unreadOnly') === 'true';
    const items = filterUnread ? state.notifications.filter((n) => !n.isRead) : state.notifications;
    return jsonOk(route, items, 200, 'OK', {
      meta: { page: 1, limit: 20, total: items.length, totalPages: 1 },
    });
  });

  // Vehicles dispatcher
  await page.route('**/api/vehicles**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const method = route.request().method();

    const restoreMatch = pathname.match(/\/api\/vehicles\/(\d+)\/restore$/);
    if (restoreMatch && method === 'PATCH') {
      const id = Number(restoreMatch[1]);
      const v = state.vehicles.find((item) => item.id === id);
      if (v) v.isActive = true;
      return jsonOk(route, v || { id }, 200, 'Kích hoạt lại xe thành công');
    }

    const itemMatch = pathname.match(/\/api\/vehicles\/(\d+)$/);
    if (itemMatch) {
      const id = Number(itemMatch[1]);
      const idx = state.vehicles.findIndex((item) => item.id === id);
      if (method === 'PUT') {
        const body = JSON.parse(route.request().postData() || '{}');
        if (idx !== -1) state.vehicles[idx] = { ...state.vehicles[idx], ...body };
        return jsonOk(route, state.vehicles[idx] || { id, ...body });
      }
      if (method === 'DELETE') {
        const v = state.vehicles[idx];
        if (v?.hasTransactions) {
          v.isActive = false;
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, deactivated: true, message: 'Đã vô hiệu hóa xe', data: null }),
          });
        }
        state.vehicles = state.vehicles.filter((item) => item.id !== id);
        return jsonOk(route, null, 200, 'Đã xóa xe');
      }
    }

    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      const created = {
        id: 200 + state.vehicles.length,
        licensePlate: body.licensePlate,
        make: body.make,
        model: body.model,
        year: body.year ?? null,
        color: body.color ?? null,
        vehicleSize: body.vehicleSize ?? 'MEDIUM',
        isActive: true,
        hasTransactions: false,
        activeWorkOrder: null,
        createdAt: new Date().toISOString(),
      };
      state.vehicles.unshift(created);
      return jsonOk(route, created, 201, 'Thêm xe thành công');
    }

    return jsonOk(route, state.vehicles);
  });

  // Appointments dispatcher
  await page.route('**/api/appointments**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const method = route.request().method();

    const cancelMatch = pathname.match(/\/api\/appointments\/(\d+)\/cancel$/);
    if (cancelMatch && method === 'PATCH') {
      const id = Number(cancelMatch[1]);
      const body = JSON.parse(route.request().postData() || '{}');
      const apt = state.appointments.find((a) => a.id === id);
      if (apt) {
        apt.status = 'CANCELLED';
        apt.cancel_reason = body.cancel_reason || 'Khách hàng hủy';
      }
      return jsonOk(route, apt || { id, status: 'CANCELLED', cancel_reason: body.cancel_reason });
    }

    const itemMatch = pathname.match(/\/api\/appointments\/(\d+)$/);
    if (itemMatch && method === 'PUT') {
      const id = Number(itemMatch[1]);
      const body = JSON.parse(route.request().postData() || '{}');
      const apt = state.appointments.find((a) => a.id === id);
      if (apt) {
        apt.scheduled_date = body.scheduled_date || apt.scheduled_date;
        apt.scheduled_time = body.scheduled_time || apt.scheduled_time;
        apt.scheduled_time_str = body.scheduled_time || apt.scheduled_time_str;
        apt.status = 'RESCHEDULED';
      }
      return jsonOk(route, apt || { id, ...body });
    }

    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      const veh = state.vehicles.find((v) => v.id === Number(body.vehicle_id)) || state.vehicles[0];
      const created = {
        id: 600 + state.appointments.length,
        customer_id: state.user.id,
        vehicle_id: Number(body.vehicle_id),
        scheduled_date: body.scheduled_date,
        scheduled_time: body.scheduled_time,
        scheduled_time_str: body.scheduled_time,
        status: 'REQUESTED',
        cancel_reason: null,
        notes: body.notes || '',
        customer: { id: state.user.id, full_name: state.user.fullName, phone: state.user.phone },
        vehicle: veh
          ? { id: veh.id, license_plate: veh.licensePlate, make: veh.make, model: veh.model }
          : undefined,
        services: (body.service_ids || []).map((sid: number) => ({ id: sid, name: `Dịch vụ #${sid}` })),
      };
      state.appointments.unshift(created);
      return jsonOk(route, created, 201, 'Đặt lịch hẹn thành công');
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        code: 200,
        message: 'OK',
        data: state.appointments,
        pagination: { totalRecords: state.appointments.length, totalPages: 1, currentPage: 1, limit: 50 },
        timestamp: Date.now(),
      }),
    });
  });

  // Work orders (tracking & history) dispatcher
  await page.route('**/api/work-orders/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;

    if (pathname.endsWith('/my-tracking')) {
      return jsonOk(route, [state.trackingOrder]);
    }
    if (pathname.match(/\/my-tracking\/\d+$/)) {
      return jsonOk(route, state.trackingOrder);
    }
    if (pathname.endsWith('/my-history')) {
      return jsonOk(route, {
        items: state.historyItems,
        pagination: { page: 1, limit: 10, total: state.historyItems.length, totalPages: 1 },
      });
    }
    if (pathname.match(/\/my-history\/\d+$/)) {
      const detail = {
        ...createMockTrackingOrder(),
        id: 680,
        woNumber: 'WO-202610-088',
        status: 'CLOSED',
        vehicle: { id: 11, licensePlate: '30E-888.88', make: 'Toyota', model: 'Camry', year: 2021, mileage: 19855 },
        services: [{ id: 2, name: 'Thay dầu động cơ tổng hợp 5W-30', status: 'COMPLETED', categoryName: 'Bảo dưỡng định kỳ' }],
        invoice: { id: 902, invoiceNumber: 'INV-261015-002', status: 'PAID', totalAmount: 950000, amountDue: 0 },
      };
      return jsonOk(route, detail);
    }

    return jsonOk(route, {});
  });

  // Quotations dispatcher
  await page.route('**/api/quotations/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith('/approve')) {
      state.trackingOrder.activeQuotation.status = 'APPROVED';
      return jsonOk(route, { id: state.trackingOrder.activeQuotation.id, status: 'APPROVED' }, 200, 'Phê duyệt thành công');
    }
    if (pathname.endsWith('/reject')) {
      const body = JSON.parse(route.request().postData() || '{}');
      state.trackingOrder.activeQuotation.status = 'REJECTED';
      state.trackingOrder.activeQuotation.rejectReason = body.rejectReason || body.reason;
      state.trackingOrder.activeQuotation.rejectDetails = {
        type: body.rejectType || 'REVISE',
        reason: body.rejectReason || body.reason,
      };
      return jsonOk(route, { id: state.trackingOrder.activeQuotation.id, status: 'REJECTED' }, 200, 'Đã ghi nhận phản hồi');
    }
    return jsonOk(route, {});
  });

  // Invoices & SePay payment dispatcher
  await page.route('**/api/invoices/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const method = route.request().method();

    if (pathname.endsWith('/payments/sepay') && method === 'POST') {
      const svgQr = encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="180" height="180" fill="#fff"/><rect x="20" y="20" width="40" height="40" fill="#0050CD"/><rect x="120" y="20" width="40" height="40" fill="#0050CD"/><rect x="20" y="120" width="40" height="40" fill="#0050CD"/><rect x="75" y="75" width="30" height="30" fill="#0050CD"/></svg>'
      );
      return jsonOk(route, {
        paymentId: 301,
        invoiceId: 901,
        invoiceNumber: 'INV-261120-001',
        amount: 2500000,
        checkoutUrl: 'https://sandbox.sepay.vn/checkout/mock-301',
        fields: {},
        bankInfo: {
          bankCode: 'MB',
          bankName: 'MB Bank (Quân Đội)',
          accountNumber: '090123456789',
          accountName: 'CONG TY AUTO CARE PRO',
          transferContent: 'CSC INV261120001',
          amount: 2500000,
          qrCodeUrl: `data:image/svg+xml;utf8,${svgQr}`,
        },
      });
    }

    if (pathname.endsWith('/payments/status')) {
      return jsonOk(route, {
        invoiceId: 901,
        invoiceNumber: 'INV-261120-001',
        status: state.isPaid ? 'PAID' : 'ISSUED',
        amountDue: state.isPaid ? 0 : 2500000,
        totalAmount: 2500000,
        isPaid: state.isPaid,
      });
    }

    if (pathname.endsWith('/my-invoices')) {
      const paidTotal = state.invoices
        .filter((i) => i.status === 'PAID')
        .reduce((acc, i) => acc + i.totalAmount, 0);
      const pendingItems = state.invoices.filter((i) => i.status !== 'PAID');
      return jsonOk(route, {
        invoices: state.invoices,
        summary: {
          totalSpent: paidTotal,
          pendingAmount: pendingItems.reduce((acc, i) => acc + i.amountDue, 0),
          pendingCount: pendingItems.length,
          rewardPoints: Math.floor(paidTotal / 10000),
        },
      });
    }

    return jsonOk(route, state.invoiceDetail);
  });

  await page.route('**/api/payments/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith('/simulate-success')) {
      state.isPaid = true;
      const target = state.invoices.find((i) => i.id === 901);
      if (target) {
        target.status = 'PAID';
        target.amountDue = 0;
        target.paymentMethodDisplay = 'Chuyển khoản SePay';
      }
      if (state.trackingOrder.invoice) {
        state.trackingOrder.invoice.status = 'PAID';
        state.trackingOrder.invoice.amountDue = 0;
      }
      return jsonOk(route, { paymentId: 301, status: 'SUCCESS' }, 200, 'Thanh toán thành công');
    }
    return jsonOk(route, { paymentId: 301, status: state.isPaid ? 'SUCCESS' : 'PENDING', isCleared: state.isPaid });
  });

  // AI Customer Support Chat dispatcher
  await page.route('**/api/v1/ai-chat/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const authHeader = route.request().headers()['authorization'] || '';
    const isAuth = Boolean(authHeader.startsWith('Bearer '));

    if (pathname.endsWith('/welcome')) {
      return jsonOk(route, {
        auth_mode: isAuth ? 'CUSTOMER' : 'GUEST',
        greeting: isAuth
          ? `Chào **${state.user.fullName}**! Xe **51A-999.99** đang có báo giá chờ duyệt (**0% VAT**).`
          : 'Chào Anh/Chị! Em là **Trợ lý Cố vấn Dịch vụ AI của AutoCare Pro** (**0% VAT**).',
        suggested_questions: isAuth
          ? ['Giải thích báo giá của tôi', 'Thanh toán hóa đơn ở đâu?']
          : ['Xe phanh kêu két két là bị sao?', 'Bảng giá bảo dưỡng định kỳ 40.000 km'],
        actions: isAuth
          ? [
              {
                type: 'VIEW_QUOTATION',
                label: 'Mở báo giá để phê duyệt',
                icon: 'receipt_long',
                target: 'modal:quotation',
                payload: { workOrderId: 500, quotationId: 302 },
              },
            ]
          : [
              {
                type: 'OPEN_BOOKING_MODAL',
                label: 'Đặt lịch dịch vụ ngay',
                icon: 'calendar_month',
                target: 'modal:booking',
              },
            ],
      });
    }

    if (pathname.endsWith('/message')) {
      const body = JSON.parse(route.request().postData() || '{}');
      return jsonOk(route, {
        auth_mode: isAuth ? 'CUSTOMER' : 'GUEST',
        is_fallback: false,
        reply: `Em đã nhận câu hỏi: **${body.message || ''}**. Mọi dịch vụ tại xưởng áp dụng chính sách **0% VAT** ạ.`,
        intent: 'SYMPTOM_DIAGNOSIS',
        suggested_questions: ['Đặt lịch kiểm tra xe'],
        actions: [
          {
            type: 'OPEN_BOOKING_MODAL',
            label: 'Đặt lịch kiểm tra phanh',
            icon: 'calendar_month',
            target: 'modal:booking',
            payload: {
              preselectedServiceIds: [2],
              notes: body.message || 'Kiểm tra hệ thống phanh',
            },
          },
        ],
      });
    }

    return jsonOk(route, {});
  });

  return state;
}
