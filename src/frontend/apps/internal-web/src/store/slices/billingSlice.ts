import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  BillingQueueRecord,
  BillingQueueSummary,
  InvoiceDetail,
  getBillingQueue,
  getInvoiceById,
} from '@/lib/api/invoice.api';

interface BillingState {
  tab: 'PENDING' | 'DRAFT' | 'ISSUED' | 'PAID' | 'ALL';
  search: string;
  page: number;
  summary: BillingQueueSummary;
  records: BillingQueueRecord[];
  pagination: {
    total: number;
    count: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  };
  loading: boolean;
  error: string | null;
  currentInvoice: InvoiceDetail | null;
  currentInvoiceLoading: boolean;
}

const initialState: BillingState = {
  tab: 'PENDING',
  search: '',
  page: 1,
  summary: {
    pendingCount: 0,
    draftCount: 0,
    issuedCount: 0,
    paidTodayCount: 0,
    paidTodayRevenue: 0,
  },
  records: [],
  pagination: {
    total: 0,
    count: 0,
    totalPages: 0,
    currentPage: 1,
    perPage: 5,
  },
  loading: false,
  error: null,
  currentInvoice: null,
  currentInvoiceLoading: false,
};

export const fetchBillingQueue = createAsyncThunk(
  'billing/fetchQueue',
  async (
    params: {
      tab?: 'PENDING' | 'DRAFT' | 'ISSUED' | 'PAID' | 'ALL';
      search?: string;
      page?: number;
      limit?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const data = await getBillingQueue({ limit: 5, ...params });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchInvoiceDetail = createAsyncThunk(
  'billing/fetchInvoiceDetail',
  async (id: number, { rejectWithValue }) => {
    try {
      const data = await getInvoiceById(id);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    setTab: (state, action: PayloadAction<'PENDING' | 'DRAFT' | 'ISSUED' | 'PAID' | 'ALL'>) => {
      state.tab = action.payload;
      state.page = 1;
      state.records = [];
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.page = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    clearCurrentInvoice: (state) => {
      state.currentInvoice = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchBillingQueue
      .addCase(fetchBillingQueue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBillingQueue.fulfilled, (state, action) => {
        state.loading = false;
        state.tab = action.payload.tab;
        state.summary = action.payload.summary;
        state.records = action.payload.records;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchBillingQueue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchInvoiceDetail
      .addCase(fetchInvoiceDetail.pending, (state) => {
        state.currentInvoiceLoading = true;
      })
      .addCase(fetchInvoiceDetail.fulfilled, (state, action) => {
        state.currentInvoiceLoading = false;
        state.currentInvoice = action.payload;
      })
      .addCase(fetchInvoiceDetail.rejected, (state) => {
        state.currentInvoiceLoading = false;
      });
  },
});

export const { setTab, setSearch, setPage, clearCurrentInvoice } = billingSlice.actions;
export default billingSlice.reducer;

