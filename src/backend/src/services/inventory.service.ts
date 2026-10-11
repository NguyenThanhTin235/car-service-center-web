import { PrismaClient, Prisma, ItemType, MovementType, ReferenceType, CatalogType } from '@prisma/client';
const prisma = new PrismaClient();

const ITEM_INCLUDE = {
  part_category: { include: { uom: true } },
  brand: true,
} satisfies Prisma.InventoryItemInclude;

export class InventoryService {
  // ==========================================
  // PART CATEGORY (Master)
  // ==========================================
  async getCategories(search?: string, itemType?: ItemType, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const where: Prisma.PartCategoryWhereInput = {};
    if (search) {
      where.OR = [{ code: { contains: search } }, { name: { contains: search } }];
    }
    if (itemType) where.item_type = itemType;

    const [categories, total] = await Promise.all([
      prisma.partCategory.findMany({
        where,
        skip,
        take: limit,
        include: { uom: true, _count: { select: { inventory_items: true } } },
        orderBy: { created_at: 'desc' },
      }),
      prisma.partCategory.count({ where }),
    ]);

    return {
      categories: categories.map((c) => this.mapCategoryToCamelCase(c)),
      pagination: { page, limit, totalRecords: total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCategoryById(id: number) {
    const category = await prisma.partCategory.findUnique({
      where: { id },
      include: { uom: true, inventory_items: { include: ITEM_INCLUDE, orderBy: { sku: 'asc' } } },
    });
    if (!category) throw new Error('Không tìm thấy danh mục phụ tùng');
    return {
      ...this.mapCategoryToCamelCase(category),
      variants: category.inventory_items.map((i) => this.mapItemToCamelCase(i)),
    };
  }

  async createCategory(data: any) {
    const existing = await prisma.partCategory.findUnique({ where: { code: data.code } });
    if (existing) throw new Error('Mã danh mục đã tồn tại');

    const category = await prisma.partCategory.create({
      data: {
        code: data.code,
        name: data.name,
        item_type: data.itemType,
        uom_id: data.uomId,
        description: data.description,
      },
      include: { uom: true },
    });
    return this.mapCategoryToCamelCase(category);
  }

  async updateCategory(id: number, data: any) {
    const category = await prisma.partCategory.findUnique({ where: { id } });
    if (!category) throw new Error('Không tìm thấy danh mục phụ tùng');

    if (data.code && data.code !== category.code) {
      const existing = await prisma.partCategory.findUnique({ where: { code: data.code } });
      if (existing) throw new Error('Mã danh mục đã tồn tại');
    }

    const updated = await prisma.partCategory.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        item_type: data.itemType,
        uom_id: data.uomId,
        description: data.description,
        is_active: data.isActive,
      },
      include: { uom: true },
    });
    return this.mapCategoryToCamelCase(updated);
  }

  async toggleCategory(id: number) {
    const category = await prisma.partCategory.findUnique({ where: { id } });
    if (!category) throw new Error('Không tìm thấy danh mục phụ tùng');

    const variantCount = await prisma.inventoryItem.count({ where: { part_category_id: id } });
    if (variantCount > 0) {
      const updated = await prisma.partCategory.update({
        where: { id },
        data: { is_active: !category.is_active },
        include: { uom: true },
      });
      return { deactivated: true, category: this.mapCategoryToCamelCase(updated) };
    }
    await prisma.partCategory.delete({ where: { id } });
    return { deleted: true };
  }

  // ==========================================
  // INVENTORY ITEM (Variant)
  // ==========================================
  async getItems(
    search?: string,
    itemType?: ItemType,
    page: number = 1,
    limit: number = 10,
    partCategoryId?: number,
    brandId?: number,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.InventoryItemWhereInput = {};
    if (search) {
      where.OR = [
        { sku: { contains: search } },
        { part_category: { name: { contains: search } } },
        { part_category: { code: { contains: search } } },
        { brand: { name: { contains: search } } },
      ];
    }
    if (itemType) where.part_category = { item_type: itemType };
    if (partCategoryId) where.part_category_id = partCategoryId;
    if (brandId) where.brand_id = brandId;

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip,
        take: limit,
        include: ITEM_INCLUDE,
        orderBy: { created_at: 'desc' },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    return {
      items: items.map((i) => this.mapItemToCamelCase(i)),
      pagination: { page, limit, totalRecords: total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getItemById(id: number) {
    const item = await prisma.inventoryItem.findUnique({ where: { id }, include: ITEM_INCLUDE });
    if (!item) throw new Error('Không tìm thấy phụ tùng');
    return this.mapItemToCamelCase(item);
  }

  async createItem(data: any) {
    const existing = await prisma.inventoryItem.findUnique({ where: { sku: data.sku } });
    if (existing) throw new Error('Mã SKU đã tồn tại');
    await this.assertCategoryExists(data.partCategoryId);
    if (data.brandId) await this.assertBrandExists(data.brandId);

    const item = await prisma.inventoryItem.create({
      data: {
        sku: data.sku,
        part_category_id: data.partCategoryId,
        brand_id: data.brandId ?? null,
        selling_price: data.sellingPrice,
        reorder_level: data.reorderLevel || 0,
      },
      include: ITEM_INCLUDE,
    });
    return this.mapItemToCamelCase(item);
  }

  async updateItem(id: number, data: any) {
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new Error('Không tìm thấy phụ tùng');

    if (data.sku && data.sku !== item.sku) {
      const existing = await prisma.inventoryItem.findUnique({ where: { sku: data.sku } });
      if (existing) throw new Error('Mã SKU đã tồn tại');
    }
    if (data.partCategoryId) await this.assertCategoryExists(data.partCategoryId);
    if (data.brandId) await this.assertBrandExists(data.brandId);

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        sku: data.sku,
        part_category_id: data.partCategoryId,
        brand_id: data.brandId,
        selling_price: data.sellingPrice,
        reorder_level: data.reorderLevel,
        is_active: data.isActive,
      },
      include: ITEM_INCLUDE,
    });
    return this.mapItemToCamelCase(updated);
  }

  async toggleItem(id: number) {
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new Error('Không tìm thấy phụ tùng');

    const jobPartsCount = await prisma.jobPart.count({ where: { item_id: id } });
    const receiptItemsCount = await prisma.goodsReceiptItem.count({ where: { item_id: id } });

    if (jobPartsCount > 0 || receiptItemsCount > 0) {
      const updated = await prisma.inventoryItem.update({
        where: { id },
        data: { is_active: !item.is_active },
        include: ITEM_INCLUDE,
      });
      return { deactivated: true, item: this.mapItemToCamelCase(updated) };
    }
    await prisma.inventoryItem.delete({ where: { id } });
    return { deleted: true };
  }

  // ==========================================
  // BRANDS & UOM (SystemCatalog)
  // ==========================================
  async getBrands() {
    return prisma.systemCatalog.findMany({
      where: { catalog_type: CatalogType.BRAND, is_active: true },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    });
  }

  async getUoms() {
    return prisma.systemCatalog.findMany({
      where: { catalog_type: CatalogType.UOM, is_active: true },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    });
  }

  // ==========================================
  // GOODS RECEIPT
  // ==========================================
  async getReceipts(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [receipts, total] = await Promise.all([
      prisma.goodsReceipt.findMany({
        skip,
        take: limit,
        include: { supplier: true, created_by: true, items: { include: { item: { include: ITEM_INCLUDE } } } },
        orderBy: { created_at: 'desc' },
      }),
      prisma.goodsReceipt.count(),
    ]);

    const mappedReceipts = receipts.map((r) => ({
      id: r.id,
      receiptNumber: r.receipt_number,
      supplierId: r.supplier_id,
      supplier: r.supplier,
      receiptType: r.receipt_type,
      referenceNo: r.reference_no,
      receivedDate: r.received_date,
      notes: r.notes,
      createdById: r.created_by_id,
      createdBy: r.created_by ? { id: r.created_by.id, fullName: r.created_by.full_name } : null,
      createdAt: r.created_at,
      items: r.items.map((i) => ({
        id: i.id,
        itemId: i.item_id,
        item: this.mapItemToCamelCase(i.item),
        quantity: Number(i.quantity),
        unitCost: Number(i.unit_cost),
      })),
    }));

    return {
      receipts: mappedReceipts,
      pagination: { page, limit, totalRecords: total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createReceipt(data: any, createdById: number) {
    return prisma.$transaction(async (tx) => {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const count = await tx.goodsReceipt.count({
        where: { receipt_number: { startsWith: `GR-${dateStr}` } },
      });
      const receiptNumber = `GR-${dateStr}-${String(count + 1).padStart(3, '0')}`;

      const receipt = await tx.goodsReceipt.create({
        data: {
          receipt_number: receiptNumber,
          supplier_id: data.supplierId,
          receipt_type: data.receiptType,
          reference_no: data.referenceNo,
          received_date: new Date(data.receivedDate),
          notes: data.notes,
          created_by_id: createdById,
        },
      });

      for (const reqItem of data.items) {
        const inventoryItem = await tx.inventoryItem.findUnique({ where: { id: reqItem.itemId } });
        if (!inventoryItem) throw new Error(`Không tìm thấy vật tư ID ${reqItem.itemId}`);

        await tx.goodsReceiptItem.create({
          data: {
            receipt_id: receipt.id,
            item_id: reqItem.itemId,
            quantity: reqItem.quantity,
            unit_cost: reqItem.unitCost,
          },
        });

        // on_hand là Int (theo log_2) → số lượng nhập phải là số nguyên
        const currentOnHand = inventoryItem.on_hand;
        const currentAverageCost = Number(inventoryItem.average_cost);
        const receivedQty = Math.trunc(Number(reqItem.quantity));
        const receivedCost = Number(reqItem.unitCost);

        const newOnHand = currentOnHand + receivedQty;
        // Moving Weighted Average (MWA)
        let newAverageCost = 0;
        if (newOnHand > 0) {
          newAverageCost = (currentOnHand * currentAverageCost + receivedQty * receivedCost) / newOnHand;
        }

        await tx.inventoryItem.update({
          where: { id: reqItem.itemId },
          data: { on_hand: newOnHand, average_cost: newAverageCost },
        });

        await tx.stockMovement.create({
          data: {
            item_id: reqItem.itemId,
            movement_type: data.receiptType === 'OPENING_STOCK' ? MovementType.OPENING : MovementType.RECEIPT,
            reference_type: ReferenceType.GOODS_RECEIPT,
            reference_id: receipt.id,
            quantity: receivedQty,
            unit_cost: receivedCost,
            balance_after: newOnHand,
            notes: data.notes,
            created_by_id: createdById,
          },
        });
      }

      return receipt;
    });
  }

  async getSuppliers() {
    return prisma.supplier.findMany({ where: { is_active: true } });
  }

  // ==========================================
  // HELPERS
  // ==========================================
  private async assertCategoryExists(id: number) {
    const category = await prisma.partCategory.findUnique({ where: { id } });
    if (!category) throw new Error('Không tìm thấy danh mục phụ tùng');
  }

  private async assertBrandExists(id: number) {
    const brand = await prisma.systemCatalog.findFirst({ where: { id, catalog_type: CatalogType.BRAND } });
    if (!brand) throw new Error('Không tìm thấy thương hiệu');
  }

  private mapCategoryToCamelCase(category: any) {
    if (!category) return null;
    return {
      id: category.id,
      code: category.code,
      name: category.name,
      itemType: category.item_type,
      uomId: category.uom_id,
      uom: category.uom,
      description: category.description,
      isActive: category.is_active,
      variantCount: category._count?.inventory_items,
      createdAt: category.created_at,
    };
  }

  private mapItemToCamelCase(item: any) {
    if (!item) return null;
    const category = item.part_category;
    const brandName = item.brand?.name;
    return {
      id: item.id,
      sku: item.sku,
      // Tên hiển thị suy ra từ Category + Brand, giữ tương thích với client cũ
      name: category ? (brandName ? `${category.name} - ${brandName}` : category.name) : item.sku,
      partCategoryId: item.part_category_id,
      partCategory: category
        ? { id: category.id, code: category.code, name: category.name, itemType: category.item_type }
        : null,
      brandId: item.brand_id,
      brand: item.brand ? { id: item.brand.id, name: item.brand.name } : null,
      itemType: category?.item_type,
      uomId: category?.uom_id,
      uom: category?.uom,
      sellingPrice: Number(item.selling_price),
      averageCost: Number(item.average_cost),
      onHand: item.on_hand,
      reorderLevel: item.reorder_level,
      isActive: item.is_active,
      createdAt: item.created_at,
    };
  }
}

export const inventoryService = new InventoryService();
