export type AiChatAuthMode = 'GUEST' | 'CUSTOMER';

export type AiChatIntent =
  | 'SYMPTOM_DIAGNOSIS'
  | 'CATALOG_PRICING'
  | 'WORK_ORDER_TRACKING'
  | 'QUOTATION_EXPLANATION'
  | 'INVOICE_PAYMENT'
  | 'WARRANTY_INQUIRY'
  | 'BOOKING_REQUEST'
  | 'AUTH_REQUIRED'
  | 'GENERAL_SUPPORT'
  | 'HUMAN_HANDOFF'
  | 'OUT_OF_SCOPE';

export type AiChatActionType =
  | 'NAVIGATE'
  | 'OPEN_BOOKING_MODAL'
  | 'CONFIRM_BOOKING'
  | 'VIEW_QUOTATION'
  | 'VIEW_INVOICE'
  | 'CALL_HOTLINE';

export interface AiChatActionPayload {
  preselectedVehicleId?: number | null;
  preselectedServiceIds?: number[];
  preferredDate?: string | null;
  preferredTime?: string | null;
  notes?: string | null;
  isWarranty?: boolean;
  vehicleLabel?: string | null;
  serviceNames?: string[];
  estimatedTotal?: number | null;
  workOrderId?: number | null;
  quotationId?: number | null;
  invoiceId?: number | null;
}

export interface AiChatActionItem {
  type: AiChatActionType;
  label: string;
  icon: string;
  target: string;
  payload?: AiChatActionPayload;
}

export interface AiChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatMessageResponse {
  auth_mode: AiChatAuthMode;
  is_fallback: boolean;
  reply: string;
  intent: AiChatIntent;
  suggested_questions: string[];
  actions: AiChatActionItem[];
}

export interface AiChatWelcomeResponse {
  auth_mode: AiChatAuthMode;
  greeting: string;
  suggested_questions: string[];
  actions: AiChatActionItem[];
}

export interface CatalogServiceItem {
  id: number;
  name: string;
  categoryName: string;
  description: string | null;
  pricingType: 'FIXED' | 'VEHICLE_SIZE' | 'LABOUR_PARTS';
  fixedPrice: number | null;
  sizePrices: Array<{
    vehicleSize: string;
    price: number;
  }>;
  warrantyMonths: number;
}

export interface CatalogCategoryGroup {
  id: number;
  name: string;
  description: string | null;
  services: CatalogServiceItem[];
}

export interface CatalogContext {
  garageInfo: {
    name: string;
    address: string;
    hotline: string;
    workingDays: string;
    workingHours: string;
    bookingSlots: {
      morning: string[];
      afternoon: string[];
    };
    vatPolicy: string;
    processSteps: string[];
  };
  categories: CatalogCategoryGroup[];
}

export interface QuotationSummary {
  totalApprovedAmount: number;
  pendingApprovalAmount: number;
  projectedCombinedTotal: number;
  pendingQuotationIds: number[];
}

export interface CustomerVehicleContext {
  id: number;
  licensePlate: string;
  make: string;
  model: string;
  year: number | null;
  vehicleSize: string;
}

export interface CustomerAppointmentContext {
  id: number;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  isWarranty: boolean;
  notes: string | null;
  vehicle: {
    id: number;
    licensePlate: string;
    make: string;
    model: string;
  };
  serviceNames: string[];
}

export interface CustomerActiveWorkOrderContext {
  id: number;
  woNumber: string;
  status: string;
  orderType: string;
  vehicle: {
    id: number;
    licensePlate: string;
    make: string;
    model: string;
  };
  advisorName: string | null;
  advisorPhone: string | null;
  mileage: number | null;
  complaint: string | null;
  services: Array<{
    id: number;
    name: string;
    status: string;
    pricingType: string;
    latestQcResult: string | null;
  }>;
  findings: Array<{
    id: number;
    description: string;
    severity: string;
    recommendation: string | null;
    partName: string | null;
    status: string;
  }>;
  quotations: Array<{
    id: number;
    quotationNumber: string;
    quotationType: string;
    status: string;
    grandTotal: number;
    lines: Array<{
      description: string;
      lineType: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }>;
  }>;
  quotationSummary: QuotationSummary;
  invoices: Array<{
    id: number;
    invoiceNumber: string;
    status: string;
    totalAmount: number;
    amountDue: number;
  }>;
}

export interface RecentCompletedWorkOrderContext {
  id: number;
  woNumber: string;
  status: string;
  completedAt: string;
  mileageAtService: number | null;
  vehicle: {
    id: number;
    licensePlate: string;
    make: string;
    model: string;
  };
  serviceNames: string[];
  invoices: Array<{
    id: number;
    invoiceNumber: string;
    status: string;
    totalAmount: number;
    amountDue: number;
  }>;
}

export interface DerivedWarrantyRecord {
  workOrderId: number;
  woNumber: string;
  vehicleId: number;
  licensePlate: string;
  itemType: 'SERVICE' | 'PART';
  itemName: string;
  warrantyMonths: number;
  serviceDate: string;
  expiresAt: string | null;
  mileageAtService: number | null;
  status: 'ACTIVE';
}

export interface CustomerPrivateContext {
  customer: {
    id: number;
    fullName: string;
    phone: string | null;
    email: string;
  };
  vehicles: CustomerVehicleContext[];
  upcomingAppointments: CustomerAppointmentContext[];
  activeWorkOrders: CustomerActiveWorkOrderContext[];
  recentCompletedOrders: RecentCompletedWorkOrderContext[];
  warrantyRecords: DerivedWarrantyRecord[];
}
