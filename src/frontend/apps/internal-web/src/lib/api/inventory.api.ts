import api from '../axios';

export interface AvailableInventoryItem {
  id: number;
  sku: string;
  name: string;
  sellingPrice: number;
  averageCost?: number;
  onHand: number;
  reorderLevel?: number;
  isActive: boolean;
  itemType?: 'PART' | 'FLUID' | 'ACCESSORY';
  uom?: { id: number; name: string } | null;
  brand?: { id: number; name: string } | null;
  partCategory?: { id: number; code: string; name: string; itemType: string } | null;
}

export interface InventoryItemsResponse {
  items: AvailableInventoryItem[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
}

export const inventoryApi = {
  getItems: async (params?: {
    search?: string;
    itemType?: string;
    page?: number;
    limit?: number;
    partCategoryId?: number;
    brandId?: number;
  }) => {
    const response = await api.get<{ success: boolean; data: InventoryItemsResponse }>(
      '/api/inventory-items',
      { params }
    );
    return response.data;
  },

  getItemById: async (id: number) => {
    const response = await api.get<{ success: boolean; data: AvailableInventoryItem }>(
      `/api/inventory-items/${id}`
    );
    return response.data;
  },
};
