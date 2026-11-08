import { createSlice, createAsyncThunk, PayloadAction, isAnyOf } from '@reduxjs/toolkit';
import api from '@/lib/axios';

export interface Uom {
  id: number;
  name: string;
}

export type ItemType = 'PART' | 'CONSUMABLE' | 'CHEMICAL' | 'ACCESSORY';

export interface Brand {
  id: number;
  name: string;
}

// Danh mục phụ tùng chung (Master)
export interface PartCategory {
  id: number;
  code: string;
  name: string;
  itemType: ItemType;
  uomId: number;
  uom?: Uom;
  description?: string | null;
  isActive: boolean;
  variantCount?: number;
  createdAt?: string;
}

// Phụ tùng thực tế theo hãng (Variant)
export interface InventoryItem {
  id: number;
  sku: string;
  name: string; // Suy ra từ Category + Brand
  partCategoryId: number;
  partCategory: Pick<PartCategory, 'id' | 'code' | 'name' | 'itemType'> | null;
  brandId: number | null;
  brand: Brand | null;
  itemType: ItemType;
  uomId: number;
  uom: Uom;
  sellingPrice: number;
  averageCost: number;
  onHand: number;
  reorderLevel: number;
  isActive: boolean;
  createdAt: string;
}

export interface InventoryItemPayload {
  sku?: string;
  partCategoryId?: number;
  brandId?: number | null;
  sellingPrice?: number;
  reorderLevel?: number;
  isActive?: boolean;
}

export interface PartCategoryPayload {
  code?: string;
  name?: string;
  itemType?: ItemType;
  uomId?: number;
  description?: string;
  isActive?: boolean;
}

export interface Supplier {
  id: number;
  code?: string;
  name: string;
  taxCode?: string | null;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  isActive: boolean;
  receiptCount?: number;
  totalPurchaseValue?: number;
  createdAt?: string;
}

export type GoodsReceiptStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';

export interface GoodsReceiptItem {
  id: number;
  itemId: number;
  item: InventoryItem;
  quantity: number;
  unitCost: number;
  discountRate?: number;
  lineTotal?: number;
  oldOnHand?: number | null;
  oldAverageCost?: number | null;
  newAverageCost?: number | null;
}

export interface GoodsReceipt {
  id: number;
  receiptNumber: string;
  supplierId: number | null;
  supplier: Supplier | null;
  receiptType: 'PURCHASE' | 'OPENING_STOCK';
  status: GoodsReceiptStatus;
  referenceNo: string;
  receivedDate: string;
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  notes: string;
  cancelReason?: string | null;
  cancelledAt?: string | null;
  createdById: number;
  createdBy: { id: number; fullName: string } | null;
  createdAt: string;
  items: GoodsReceiptItem[];
}

export interface GoodsReceiptStats {
  totalReceipts: number;
  postedCount: number;
  draftCount: number;
  cancelledCount: number;
  totalPostedValue: number;
}

export interface StockMovementRecord {
  id: number;
  itemId: number;
  movementType: 'RECEIPT' | 'OPENING' | 'ISSUE' | 'RETURN' | 'ADJUSTMENT';
  referenceType: 'GOODS_RECEIPT' | 'JOB' | 'ADJUSTMENT';
  referenceId: number;
  referenceCode: string;
  quantity: number;
  unitCost: number;
  balanceAfter: number;
  notes?: string | null;
  createdBy?: { id: number; fullName: string } | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

interface InventoryState {
  items: InventoryItem[];
  allItems: InventoryItem[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  
  receipts: GoodsReceipt[];
  receiptsStats: GoodsReceiptStats | null;
  receiptsPagination: Pagination | null;
  receiptsLoading: boolean;

  movements: StockMovementRecord[];
  movementsItem: InventoryItem | null;
  movementsPagination: Pagination | null;
  movementsLoading: boolean;

  suppliers: Supplier[];
  suppliersLoading: boolean;

  categories: PartCategory[];
  brands: Brand[];
  uoms: Uom[];

  actionLoading: boolean;
  actionError: string | null;
}

const initialState: InventoryState = {
  items: [],
  allItems: [],
  pagination: null,
  loading: false,
  error: null,
  receipts: [],
  receiptsStats: null,
  receiptsPagination: null,
  receiptsLoading: false,
  movements: [],
  movementsItem: null,
  movementsPagination: null,
  movementsLoading: false,
  suppliers: [],
  suppliersLoading: false,
  categories: [],
  brands: [],
  uoms: [],
  actionLoading: false,
  actionError: null,
};

export const fetchPartCategories = createAsyncThunk(
  'inventory/fetchCategories',
  async (params: { search?: string; itemType?: string; page?: number; limit?: number } | void, { rejectWithValue }) => {
    const p = params || {};
    try {
      const response = await api.get('/api/part-categories', { params: { limit: 500, ...p } });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tải danh mục phụ tùng');
    }
  }
);

export const createPartCategory = createAsyncThunk(
  'inventory/createCategory',
  async (data: PartCategoryPayload, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/part-categories', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi thêm danh mục');
    }
  }
);

export const updatePartCategory = createAsyncThunk(
  'inventory/updateCategory',
  async ({ id, data }: { id: number; data: PartCategoryPayload }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/part-categories/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi cập nhật danh mục');
    }
  }
);

export const fetchBrands = createAsyncThunk(
  'inventory/fetchBrands',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/inventory/brands');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tải thương hiệu');
    }
  }
);

export const fetchUoms = createAsyncThunk(
  'inventory/fetchUoms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/inventory/uoms');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tải đơn vị tính');
    }
  }
);

export const fetchInventoryItems = createAsyncThunk(
  'inventory/fetchItems',
  async (params: { search?: string; itemType?: string; partCategoryId?: number; brandId?: number; page?: number; limit?: number }, { rejectWithValue }) => {
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
  async (data: InventoryItemPayload, { rejectWithValue }) => {
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
  async ({ id, data }: { id: number; data: InventoryItemPayload }, { rejectWithValue }) => {
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

export const fetchAllInventoryItems = createAsyncThunk(
  'inventory/fetchAllItems',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/inventory-items', { params: { page: 1, limit: 500 } });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tải toàn bộ danh mục phụ tùng');
    }
  }
);

export const fetchItemMovements = createAsyncThunk(
  'inventory/fetchItemMovements',
  async ({ itemId, page = 1, limit = 15 }: { itemId: number; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/inventory-items/${itemId}/movements`, { params: { page, limit } });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tải thẻ kho phụ tùng');
    }
  }
);

export const fetchReceipts = createAsyncThunk(
  'inventory/fetchReceipts',
  async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      supplierId?: number;
      receiptType?: string;
      status?: string;
      fromDate?: string;
      toDate?: string;
    } = {},
    { rejectWithValue }
  ) => {
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

export const postDraftReceipt = createAsyncThunk(
  'inventory/postDraftReceipt',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/inventory/receipts/${id}/post`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi ghi sổ phiếu nhập kho');
    }
  }
);

export const cancelReceipt = createAsyncThunk(
  'inventory/cancelReceipt',
  async ({ id, cancelReason }: { id: number; cancelReason: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/inventory/receipts/${id}/cancel`, { cancelReason });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi hủy phiếu nhập kho');
    }
  }
);

export const fetchSuppliers = createAsyncThunk(
  'inventory/fetchSuppliers',
  async (params: { search?: string; includeInactive?: boolean } | void, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/inventory/suppliers', { params: params || {} });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tải danh sách nhà cung cấp');
    }
  }
);

export const createSupplier = createAsyncThunk(
  'inventory/createSupplier',
  async (data: Partial<Supplier>, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/inventory/suppliers', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi thêm nhà cung cấp');
    }
  }
);

export const updateSupplier = createAsyncThunk(
  'inventory/updateSupplier',
  async ({ id, data }: { id: number; data: Partial<Supplier> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/inventory/suppliers/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi cập nhật nhà cung cấp');
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
        state.items = Array.isArray(action.payload?.data?.items)
          ? action.payload.data.items
          : Array.isArray(action.payload?.data)
          ? action.payload.data
          : [];
        state.pagination =
          action.payload?.data?.pagination || action.payload?.pagination || null;
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

      // Fetch All Items (for KPI & Autocomplete)
      .addCase(fetchAllInventoryItems.fulfilled, (state, action) => {
        state.allItems = Array.isArray(action.payload?.data?.items)
          ? action.payload.data.items
          : Array.isArray(action.payload?.data)
          ? action.payload.data
          : [];
      })

      // Fetch Item Movements (Stock Card)
      .addCase(fetchItemMovements.pending, (state) => {
        state.movementsLoading = true;
      })
      .addCase(fetchItemMovements.fulfilled, (state, action) => {
        state.movementsLoading = false;
        state.movementsItem = action.payload?.data?.item || null;
        state.movements = action.payload?.data?.movements || [];
        state.movementsPagination = action.payload?.data?.pagination || null;
      })
      .addCase(fetchItemMovements.rejected, (state) => {
        state.movementsLoading = false;
      })

      // Fetch Receipts
      .addCase(fetchReceipts.pending, (state) => {
        state.receiptsLoading = true;
      })
      .addCase(fetchReceipts.fulfilled, (state, action) => {
        state.receiptsLoading = false;
        state.receipts = action.payload?.data?.receipts || [];
        state.receiptsStats = action.payload?.data?.stats || null;
        state.receiptsPagination = action.payload?.data?.pagination || null;
      })
      .addCase(fetchReceipts.rejected, (state) => {
        state.receiptsLoading = false;
      })
      
      // Create / Post / Cancel Receipt
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
      .addCase(postDraftReceipt.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(postDraftReceipt.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(postDraftReceipt.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      })
      .addCase(cancelReceipt.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(cancelReceipt.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(cancelReceipt.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      })

      // Fetch / Create / Update Suppliers
      .addCase(fetchSuppliers.pending, (state) => {
        state.suppliersLoading = true;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.suppliersLoading = false;
        state.suppliers = Array.isArray(action.payload?.data) ? action.payload.data : [];
      })
      .addCase(fetchSuppliers.rejected, (state) => {
        state.suppliersLoading = false;
      })
      .addCase(createSupplier.fulfilled, (state, action) => {
        if (action.payload?.data) {
          state.suppliers = [action.payload.data, ...state.suppliers];
        }
      })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        if (action.payload?.data) {
          state.suppliers = state.suppliers.map((s) =>
            s.id === action.payload.data.id ? { ...s, ...action.payload.data } : s
          );
        }
      })

      // Categories / Brands / UOMs
      .addCase(fetchPartCategories.fulfilled, (state, action) => {
        state.categories = Array.isArray(action.payload?.data?.categories)
          ? action.payload.data.categories
          : Array.isArray(action.payload?.data)
          ? action.payload.data
          : [];
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.brands = Array.isArray(action.payload?.data) ? action.payload.data : [];
      })
      .addCase(fetchUoms.fulfilled, (state, action) => {
        state.uoms = Array.isArray(action.payload?.data) ? action.payload.data : [];
      })
      .addMatcher(isAnyOf(createPartCategory.pending, updatePartCategory.pending), (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addMatcher(isAnyOf(createPartCategory.fulfilled, updatePartCategory.fulfilled), (state) => {
        state.actionLoading = false;
      })
      .addMatcher(isAnyOf(createPartCategory.rejected, updatePartCategory.rejected), (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      });
  },
});

export const { clearActionError } = inventorySlice.actions;
export default inventorySlice.reducer;
