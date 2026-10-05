import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/axios';

export interface Uom {
  id: number;
  name: string;
}

export interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  itemType: 'PART' | 'MATERIAL' | 'CONSUMABLE' | 'CHEMICAL' | 'ACCESSORY';
  uomId: number;
  uom: Uom;
  sellingPrice: number;
  averageCost: number;
  onHand: number;
  reorderLevel: number;
  isActive: boolean;
  createdAt: string;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  isActive: boolean;
}

export interface GoodsReceiptItem {
  id: number;
  itemId: number;
  item: InventoryItem;
  quantity: number;
  unitCost: number;
}

export interface GoodsReceipt {
  id: number;
  receiptNumber: string;
  supplierId: number | null;
  supplier: Supplier | null;
  receiptType: 'PURCHASE' | 'OPENING_STOCK';
  referenceNo: string;
  receivedDate: string;
  notes: string;
  createdById: number;
  createdBy: any;
  createdAt: string;
  items: GoodsReceiptItem[];
}

interface Pagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

interface InventoryState {
  items: InventoryItem[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  
  receipts: GoodsReceipt[];
  receiptsPagination: Pagination | null;
  receiptsLoading: boolean;

  suppliers: Supplier[];

  actionLoading: boolean;
  actionError: string | null;
}

const initialState: InventoryState = {
  items: [],
  pagination: null,
  loading: false,
  error: null,
  receipts: [],
  receiptsPagination: null,
  receiptsLoading: false,
  suppliers: [],
  actionLoading: false,
  actionError: null,
};

export const fetchInventoryItems = createAsyncThunk(
  'inventory/fetchItems',
  async (params: { search?: string; itemType?: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/inventory-items', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tải danh sách phụ tùng');
    }
  }
);

export const createInventoryItem = createAsyncThunk(
  'inventory/createItem',
  async (data: Partial<InventoryItem>, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/inventory-items', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi thêm phụ tùng');
    }
  }
);

export const updateInventoryItem = createAsyncThunk(
  'inventory/updateItem',
  async ({ id, data }: { id: number; data: Partial<InventoryItem> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/inventory-items/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi cập nhật phụ tùng');
    }
  }
);

export const toggleInventoryItem = createAsyncThunk(
  'inventory/toggleItem',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/inventory-items/${id}/toggle`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái phụ tùng');
    }
  }
);

export const fetchReceipts = createAsyncThunk(
  'inventory/fetchReceipts',
  async (params: { page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/inventory/receipts', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tải danh sách phiếu nhập kho');
    }
  }
);

export const createReceipt = createAsyncThunk(
  'inventory/createReceipt',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/inventory/receipts', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tạo phiếu nhập kho');
    }
  }
);

export const fetchSuppliers = createAsyncThunk(
  'inventory/fetchSuppliers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/inventory/suppliers');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tải danh sách nhà cung cấp');
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearActionError: (state) => {
      state.actionError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Items
      .addCase(fetchInventoryItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data.items;
        state.pagination = action.payload.data.pagination;
      })
      .addCase(fetchInventoryItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create Item
      .addCase(createInventoryItem.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(createInventoryItem.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createInventoryItem.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      })
      
      // Update Item
      .addCase(updateInventoryItem.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateInventoryItem.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateInventoryItem.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      })

      // Fetch Receipts
      .addCase(fetchReceipts.pending, (state) => {
        state.receiptsLoading = true;
      })
      .addCase(fetchReceipts.fulfilled, (state, action) => {
        state.receiptsLoading = false;
        state.receipts = action.payload.data.receipts;
        state.receiptsPagination = action.payload.data.pagination;
      })
      
      // Create Receipt
      .addCase(createReceipt.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(createReceipt.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createReceipt.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      })

      // Fetch Suppliers
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.suppliers = action.payload.data;
      });
  },
});

export const { clearActionError } = inventorySlice.actions;
export default inventorySlice.reducer;
