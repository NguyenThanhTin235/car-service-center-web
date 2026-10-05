import { PrismaClient, Prisma, ItemType, ReceiptType, MovementType, ReferenceType } from '@prisma/client';
const prisma = new PrismaClient();

export class InventoryService {
  async getItems(search?: string, itemType?: ItemType, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const where: Prisma.InventoryItemWhereInput = {};
    if (search) {
      where.OR = [
        { sku: { contains: search } },
        { name: { contains: search } }
      ];
    }
    if (itemType) {
      where.item_type = itemType;
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip,
        take: limit,
        include: { uom: true },
        orderBy: { created_at: 'desc' }
      }),
      prisma.inventoryItem.count({ where })
    ]);

    return {
      items: items.map(this.mapItemToCamelCase),
      pagination: {
        page,
        limit,
        totalRecords: total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getItemById(id: number) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: { uom: true }
    });
    if (!item) throw new Error('Không tìm thấy phụ tùng');
    return this.mapItemToCamelCase(item);
  }

  async createItem(data: any) {
    const existing = await prisma.inventoryItem.findUnique({ where: { sku: data.sku } });
    if (existing) throw new Error('Mã SKU đã tồn tại');

    const item = await prisma.inventoryItem.create({
      data: {
        sku: data.sku,
        name: data.name,
        item_type: data.itemType,
        uom_id: data.uomId,
        selling_price: data.sellingPrice,
        reorder_level: data.reorderLevel || 0,
      },
      include: { uom: true }
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

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        sku: data.sku,
        name: data.name,
        item_type: data.itemType,
        uom_id: data.uomId,
        selling_price: data.sellingPrice,
        reorder_level: data.reorderLevel,
        is_active: data.isActive,
      },
      include: { uom: true }
    });
    return this.mapItemToCamelCase(updated);
  }

  async toggleItem(id: number) {
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new Error('Không tìm thấy phụ tùng');

    // Check if item is used in JobPart or GoodsReceiptItem
    const jobPartsCount = await prisma.jobPart.count({ where: { item_id: id } });
    const receiptItemsCount = await prisma.goodsReceiptItem.count({ where: { item_id: id } });

    if (jobPartsCount > 0 || receiptItemsCount > 0) {
      // Soft delete
      const updated = await prisma.inventoryItem.update({
        where: { id },
        data: { is_active: !item.is_active },
        include: { uom: true }
      });
      return { deactivated: true, item: this.mapItemToCamelCase(updated) };
    } else {
      // Hard delete
      await prisma.inventoryItem.delete({ where: { id } });
      return { deleted: true };
    }
  }

  // GOOD RECEIPT LOGIC
  async getReceipts(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [receipts, total] = await Promise.all([
      prisma.goodsReceipt.findMany({
        skip,
        take: limit,
        include: { supplier: true, created_by: true, items: { include: { item: true } } },
        orderBy: { created_at: 'desc' }
      }),
      prisma.goodsReceipt.count()
    ]);

    const mappedReceipts = receipts.map(r => ({
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
      items: r.items.map(i => ({
        id: i.id,
        itemId: i.item_id,
        item: this.mapItemToCamelCase(i.item),
        quantity: Number(i.quantity),
        unitCost: Number(i.unit_cost)
      }))
    }));

    return {
      receipts: mappedReceipts,
      pagination: {
        page, limit, totalRecords: total, totalPages: Math.ceil(total / limit)
      }
    };
  }

  async createReceipt(data: any, createdById: number) {
    return prisma.$transaction(async (tx) => {
      // Generate receipt number
      const today = new Date();
      const dateStr = today.toISOString().slice(0,10).replace(/-/g, '');
      const count = await tx.goodsReceipt.count({
        where: { receipt_number: { startsWith: `GR-${dateStr}` } }
      });
      const receiptNumber = `GR-${dateStr}-${String(count + 1).padStart(3, '0')}`;

      // Create Receipt
      const receipt = await tx.goodsReceipt.create({
        data: {
          receipt_number: receiptNumber,
          supplier_id: data.supplierId,
          receipt_type: data.receiptType,
          reference_no: data.referenceNo,
          received_date: new Date(data.receivedDate),
          notes: data.notes,
          created_by_id: createdById,
        }
      });

      // Process Items
      for (const reqItem of data.items) {
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { id: reqItem.itemId }
        });
        if (!inventoryItem) throw new Error(`Không tìm thấy vật tư ID ${reqItem.itemId}`);

        // Create Receipt Item
        await tx.goodsReceiptItem.create({
          data: {
            receipt_id: receipt.id,
            item_id: reqItem.itemId,
            quantity: reqItem.quantity,
            unit_cost: reqItem.unitCost
          }
        });

        const currentOnHand = Number(inventoryItem.on_hand);
        const currentAverageCost = Number(inventoryItem.average_cost);
        const receivedQty = Number(reqItem.quantity);
        const receivedCost = Number(reqItem.unitCost);

        const newOnHand = currentOnHand + receivedQty;
        // Moving Weighted Average (MWA)
        let newAverageCost = 0;
        if (newOnHand > 0) {
          newAverageCost = ((currentOnHand * currentAverageCost) + (receivedQty * receivedCost)) / newOnHand;
        }

        // Update Inventory Item
        await tx.inventoryItem.update({
          where: { id: reqItem.itemId },
          data: {
            on_hand: newOnHand,
            average_cost: newAverageCost
          }
        });

        // Create Stock Movement
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
            created_by_id: createdById
          }
        });
      }

      return receipt;
    });
  }

  async getSuppliers() {
    return prisma.supplier.findMany({ where: { is_active: true } });
  }

  private mapItemToCamelCase(item: any) {
    if (!item) return null;
    return {
      id: item.id,
      sku: item.sku,
      name: item.name,
      itemType: item.item_type,
      uomId: item.uom_id,
      uom: item.uom,
      sellingPrice: Number(item.selling_price),
      averageCost: Number(item.average_cost),
      onHand: Number(item.on_hand),
      reorderLevel: Number(item.reorder_level),
      isActive: item.is_active,
      createdAt: item.created_at
    };
  }
}

export const inventoryService = new InventoryService();
