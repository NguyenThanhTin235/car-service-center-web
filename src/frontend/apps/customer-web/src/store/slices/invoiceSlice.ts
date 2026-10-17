import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/axios';

export interface InvoiceListItemDto {
  id: number;
  workOrderId: number;
  invoiceNumber: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountDue: number;
  issuedAt?: string;
  createdAt: string;
  vehicle: {
    id: number;
    licensePlate: string;
    make: string;
    model: string;
    year?: number;
  };
  primaryServiceDescription: string;
  paymentMethodDisplay?: string | null;
}

export interface InvoiceLineItemDto {
  id: number;
  lineType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sortOrder: number;
}

export interface InvoicePaymentDto {
  id: number;
  paymentMethod: string;
  amount: number;
  paidAt?: string;
  transactionRef?: string;
  status: string;
}

export interface InvoiceDetailDto {
  id: number;
  workOrderId: number;
  invoiceNumber: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountDue: number;
  issuedAt?: string;
  createdAt: string;
  customer: {
    id: number;
    fullName: string;
    phone: string;
    email: string;
  };
  vehicle: {
    id: number;
    licensePlate: string;
    make: string;
    model: string;
    year?: number;
    color?: string;
  };
  advisor: {
    id: number;
    fullName: string;
    phone?: string;
  };
  lines: InvoiceLineItemDto[];
  payments: InvoicePaymentDto[];
}

export interface InvoiceSummary {
  totalSpent: number;
  pendingAmount: number;
  pendingCount: number;
  rewardPoints: number;
}

interface InvoiceState {
  invoices: InvoiceListItemDto[];
  summary: InvoiceSummary;
  selectedInvoice: InvoiceDetailDto | null;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
}

const initialState: InvoiceState = {
  invoices: [],
  summary: {
    totalSpent: 0,
    pendingAmount: 0,
    pendingCount: 0,
    rewardPoints: 0,
  },
  selectedInvoice: null,
  loading: false,
  detailLoading: false,
  error: null,
};

export const fetchMyInvoices = createAsyncThunk(
  'invoices/fetchMyInvoices',
  async (filters: { status?: string; search?: string } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/api/invoices/my-invoices?${params.toString()}`);
      return response.data.data as { invoices: InvoiceListItemDto[]; summary: InvoiceSummary };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải danh sách hóa đơn');
    }
  }
);

export const fetchInvoiceDetail = createAsyncThunk(
  'invoices/fetchInvoiceDetail',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/invoices/${id}`);
      return response.data.data as InvoiceDetailDto;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải chi tiết hóa đơn');
    }
  }
);

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    setSelectedInvoice: (state, action: PayloadAction<InvoiceDetailDto | null>) => {
      state.selectedInvoice = action.payload;
    },
    clearInvoiceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch invoices list
      .addCase(fetchMyInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload.invoices;
        state.summary = action.payload.summary;
      })
      .addCase(fetchMyInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch invoice detail
      .addCase(fetchInvoiceDetail.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchInvoiceDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedInvoice = action.payload;
      })
      .addCase(fetchInvoiceDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedInvoice, clearInvoiceError } = invoiceSlice.actions;
export default invoiceSlice.reducer;
