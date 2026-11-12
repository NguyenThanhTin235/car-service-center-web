import { Prisma, ItemType, MovementType, ReferenceType, CatalogType, GoodsReceiptStatus, ReceiptType } from '@prisma/client';
import prisma from '../utils/prisma';

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
    const category = await this.assertCategoryExists(data.partCategoryId);
    if (data.brandId) await this.assertBrandExists(data.brandId);

    let sku = data.sku?.trim();
    if (!sku) {
      const baseCode = category.code.startsWith('PC-')
        ? category.code.replace(/^PC-/, 'VT-')
        : `VT-${String(category.id).padStart(3, '0')}`;
      const existingCount = await prisma.inventoryItem.count({
        where: { part_category_id: data.partCategoryId },
      });
      let idx = existingCount;
      while (true) {
        const suffix = idx < 26 ? String.fromCharCode(65 + idx) : String(idx + 1);
        const candidate = `${baseCode}-${suffix}`;
        const conflict = await prisma.inventoryItem.findUnique({ where: { sku: candidate } });
        if (!conflict) {
          sku = candidate;
          break;
        }
        idx++;
      }
    } else {
      const existing = await prisma.inventoryItem.findUnique({ where: { sku } });
      if (existing) throw new Error('Mã SKU đã tồn tại');
    }

    const item = await prisma.inventoryItem.create({
      data: {
        sku,
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
  async getReceipts(
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string;
      supplierId?: number;
      receiptType?: ReceiptType;
      status?: GoodsReceiptStatus;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.GoodsReceiptWhereInput = {};

    if (filters?.search) {
      const q = filters.search.trim();
      where.OR = [
        { receipt_number: { contains: q } },
        { reference_no: { contains: q } },
        { notes: { contains: q } },
        { supplier: { name: { contains: q } } },
      ];
    }
    if (filters?.supplierId) where.supplier_id = filters.supplierId;
    if (filters?.receiptType) where.receipt_type = filters.receiptType;
    if (filters?.status) where.status = filters.status;
    if (filters?.fromDate || filters?.toDate) {
      where.received_date = {};
      if (filters.fromDate) where.received_date.gte = new Date(filters.fromDate);
      if (filters.toDate) where.received_date.lte = new Date(filters.toDate);
    }

    const [receipts, total, allSummary] = await Promise.all([
      prisma.goodsReceipt.findMany({
        where,
        skip,
        take: limit,
        include: {
          supplier: true,
          created_by: true,
          items: { include: { item: { include: ITEM_INCLUDE } } },
        },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      }),
      prisma.goodsReceipt.count({ where }),
      prisma.goodsReceipt.findMany({
        select: { status: true, grand_total: true, items: { select: { quantity: true, unit_cost: true, line_total: true } } },
      }),
    ]);

    let postedCount = 0;
    let draftCount = 0;
    let cancelledCount = 0;
    let totalPostedValue = 0;

    for (const r of allSummary) {
      const calcTotal = Number(r.grand_total) > 0
        ? Number(r.grand_total)
        : r.items.reduce((sum: number, i: { line_total: Prisma.Decimal | number; quantity: Prisma.Decimal | number; unit_cost: Prisma.Decimal | number }) => sum + (Number(i.line_total) > 0 ? Number(i.line_total) : Number(i.quantity) * Number(i.unit_cost)), 0);
      if (r.status === 'POSTED') {
        postedCount++;
        totalPostedValue += calcTotal;
      } else if (r.status === 'DRAFT') {
        draftCount++;
      } else if (r.status === 'CANCELLED') {
        cancelledCount++;
      }
    }

    return {
      receipts: receipts.map((r) => this.mapReceiptToCamelCase(r)),
      stats: {
        totalReceipts: allSummary.length,
        postedCount,
        draftCount,
        cancelledCount,
        totalPostedValue,
      },
      pagination: { page, limit, totalRecords: total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getReceiptById(id: number) {
    const receipt = await prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        supplier: true,
        created_by: true,
        items: { include: { item: { include: ITEM_INCLUDE } } },
      },
    });
    if (!receipt) throw new Error('Không tìm thấy phiếu nhập kho');
    return this.mapReceiptToCamelCase(receipt);
  }

  async createReceipt(data: any, createdById: number) {
    if (data.receiptType === 'PURCHASE' && !data.supplierId) {
      throw new Error('Vui lòng chọn Nhà cung cấp đối với phiếu Nhập mua hàng');
    }

    // Gộp các dòng trùng itemId trong cùng 1 phiếu nhập
    const mergedMap = new Map<number, {
      itemId: number;
      quantity: number;
      unitCost: number;
      discountRate: number;
      updateSellingPrice?: number | null;
    }>();

    for (const rawLine of data.items) {
      const itemId = Number(rawLine.itemId);
      const qty = Math.trunc(Number(rawLine.quantity));
      const unitCost = Number(rawLine.unitCost);
      const discountRate = Number(rawLine.discountRate || 0);
      if (qty <= 0) throw new Error('Số lượng nhập phải là số nguyên dương');
      if (unitCost < 0) throw new Error('Đơn giá nhập không được âm');

      const existing = mergedMap.get(itemId);
      if (existing) {
        const totalQty = existing.quantity + qty;
        const weightedCost = (existing.quantity * existing.unitCost + qty * unitCost) / totalQty;
        existing.quantity = totalQty;
        existing.unitCost = weightedCost;
        if (rawLine.updateSellingPrice) existing.updateSellingPrice = Number(rawLine.updateSellingPrice);
      } else {
        mergedMap.set(itemId, {
          itemId,
          quantity: qty,
          unitCost,
          discountRate,
          updateSellingPrice: rawLine.updateSellingPrice ? Number(rawLine.updateSellingPrice) : null,
        });
      }
    }

    const mergedLines = Array.from(mergedMap.values());
    const targetStatus: GoodsReceiptStatus = data.status === 'DRAFT' ? GoodsReceiptStatus.DRAFT : GoodsReceiptStatus.POSTED;
    const taxRate = Number(data.taxRate || 0);

    let subtotal = 0;
    let discountAmount = 0;
    for (const l of mergedLines) {
      const gross = l.quantity * l.unitCost;
      const disc = gross * (l.discountRate / 100);
      subtotal += gross;
      discountAmount += disc;
    }
    const netSubtotal = subtotal - discountAmount;
    const taxAmount = Math.round(netSubtotal * (taxRate / 100));
    const grandTotal = Math.round(netSubtotal + taxAmount);

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
          supplier_id: data.supplierId || null,
          receipt_type: data.receiptType,
          status: targetStatus,
          reference_no: data.referenceNo || null,
          received_date: new Date(data.receivedDate),
          subtotal,
          discount_amount: discountAmount,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          grand_total: grandTotal,
          notes: data.notes || null,
          created_by_id: createdById,
        },
      });

      for (const reqItem of mergedLines) {
        const inventoryItem = await tx.inventoryItem.findUnique({ where: { id: reqItem.itemId } });
        if (!inventoryItem) throw new Error(`Không tìm thấy vật tư ID ${reqItem.itemId}`);

        const currentOnHand = inventoryItem.on_hand;
        const currentAverageCost = Number(inventoryItem.average_cost);
        const receivedQty = reqItem.quantity;
        const netUnitCost = reqItem.unitCost * (1 - reqItem.discountRate / 100);
        const lineTotal = receivedQty * netUnitCost;

        const newOnHand = currentOnHand + receivedQty;
        let newAverageCost = currentAverageCost;
        if (newOnHand > 0) {
          newAverageCost = (currentOnHand * currentAverageCost + receivedQty * netUnitCost) / newOnHand;
        }

        await tx.goodsReceiptItem.create({
          data: {
            receipt_id: receipt.id,
            item_id: reqItem.itemId,
            quantity: receivedQty,
            unit_cost: reqItem.unitCost,
            discount_rate: reqItem.discountRate,
            line_total: lineTotal,
            old_on_hand: currentOnHand,
            old_average_cost: currentAverageCost,
            new_average_cost: newAverageCost,
          },
        });

        if (targetStatus === GoodsReceiptStatus.POSTED) {
          const updateData: Prisma.InventoryItemUpdateInput = {
            on_hand: newOnHand,
            average_cost: newAverageCost,
          };
          if (reqItem.updateSellingPrice && reqItem.updateSellingPrice > 0) {
            updateData.selling_price = reqItem.updateSellingPrice;
          }

          await tx.inventoryItem.update({
            where: { id: reqItem.itemId },
            data: updateData,
          });

          await tx.stockMovement.create({
            data: {
              item_id: reqItem.itemId,
              movement_type: data.receiptType === 'OPENING_STOCK' ? MovementType.OPENING : MovementType.RECEIPT,
              reference_type: ReferenceType.GOODS_RECEIPT,
              reference_id: receipt.id,
              quantity: receivedQty,
              unit_cost: netUnitCost,
              balance_after: newOnHand,
              notes: data.notes || `Nhập kho theo phiếu ${receiptNumber}`,
              created_by_id: createdById,
            },
          });
        }
      }

      const fullReceipt = await tx.goodsReceipt.findUnique({
        where: { id: receipt.id },
        include: {
          supplier: true,
          created_by: true,
          items: { include: { item: { include: ITEM_INCLUDE } } },
        },
      });
      return this.mapReceiptToCamelCase(fullReceipt);
    });
  }

  async postDraftReceipt(id: number, userId: number) {
    return prisma.$transaction(async (tx) => {
      const receipt = await tx.goodsReceipt.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!receipt) throw new Error('Không tìm thấy phiếu nhập kho');
      if (receipt.status !== GoodsReceiptStatus.DRAFT) {
        throw new Error('Chỉ có thể ghi sổ đối với phiếu nhập đang ở trạng thái Nháp (DRAFT)');
      }

      for (const line of receipt.items) {
        const inventoryItem = await tx.inventoryItem.findUnique({ where: { id: line.item_id } });
        if (!inventoryItem) throw new Error(`Không tìm thấy vật tư ID ${line.item_id}`);

        const currentOnHand = inventoryItem.on_hand;
        const currentAverageCost = Number(inventoryItem.average_cost);
        const receivedQty = Math.trunc(Number(line.quantity));
        const unitCost = Number(line.unit_cost);
        const discountRate = Number(line.discount_rate || 0);
        const netUnitCost = unitCost * (1 - discountRate / 100);

        const newOnHand = currentOnHand + receivedQty;
        let newAverageCost = currentAverageCost;
        if (newOnHand > 0) {
          newAverageCost = (currentOnHand * currentAverageCost + receivedQty * netUnitCost) / newOnHand;
        }

        await tx.goodsReceiptItem.update({
          where: { id: line.id },
          data: {
            old_on_hand: currentOnHand,
            old_average_cost: currentAverageCost,
            new_average_cost: newAverageCost,
          },
        });

        await tx.inventoryItem.update({
          where: { id: line.item_id },
          data: { on_hand: newOnHand, average_cost: newAverageCost },
        });

        await tx.stockMovement.create({
          data: {
            item_id: line.item_id,
            movement_type: receipt.receipt_type === 'OPENING_STOCK' ? MovementType.OPENING : MovementType.RECEIPT,
            reference_type: ReferenceType.GOODS_RECEIPT,
            reference_id: receipt.id,
            quantity: receivedQty,
            unit_cost: netUnitCost,
            balance_after: newOnHand,
            notes: receipt.notes || `Ghi sổ phiếu nhập ${receipt.receipt_number}`,
            created_by_id: userId,
          },
        });
      }

      const updated = await tx.goodsReceipt.update({
        where: { id },
        data: { status: GoodsReceiptStatus.POSTED },
        include: {
          supplier: true,
          created_by: true,
          items: { include: { item: { include: ITEM_INCLUDE } } },
        },
      });
      return this.mapReceiptToCamelCase(updated);
    });
  }

  async cancelReceipt(id: number, cancelReason: string, userId: number) {
    return prisma.$transaction(async (tx) => {
      const receipt = await tx.goodsReceipt.findUnique({
        where: { id },
        include: { items: { include: { item: true } } },
      });
      if (!receipt) throw new Error('Không tìm thấy phiếu nhập kho');
      if (receipt.status === GoodsReceiptStatus.CANCELLED) {
        throw new Error('Phiếu nhập kho này đã bị hủy trước đó');
      }

      if (receipt.status === GoodsReceiptStatus.POSTED) {
        // Kiểm tra điều kiện an toàn tồn kho trước khi đảo bút toán
        for (const line of receipt.items) {
          const currentItem = await tx.inventoryItem.findUnique({ where: { id: line.item_id } });
          if (!currentItem) throw new Error(`Không tìm thấy vật tư ID ${line.item_id}`);

          const receivedQty = Math.trunc(Number(line.quantity));
          if (currentItem.on_hand < receivedQty) {
            throw new Error(
              `Không thể hủy phiếu: Mã [${currentItem.sku}] hiện chỉ còn tồn ${currentItem.on_hand}, nhỏ hơn số lượng cần hoàn (${receivedQty}) do hàng đã được xuất dùng.`,
            );
          }
        }

        // Thực hiện trừ ngược tồn kho & khôi phục giá vốn bình quân
        for (const line of receipt.items) {
          const currentItem = await tx.inventoryItem.findUnique({ where: { id: line.item_id } });
          if (!currentItem) continue;

          const currentOnHand = currentItem.on_hand;
          const currentAverageCost = Number(currentItem.average_cost);
          const receivedQty = Math.trunc(Number(line.quantity));
          const unitCost = Number(line.unit_cost);
          const discountRate = Number(line.discount_rate || 0);
          const netUnitCost = unitCost * (1 - discountRate / 100);

          const newOnHand = currentOnHand - receivedQty;
          let restoredAvgCost = line.old_average_cost !== null ? Number(line.old_average_cost) : currentAverageCost;

          if (newOnHand > 0) {
            const reversedCost = (currentOnHand * currentAverageCost - receivedQty * netUnitCost) / newOnHand;
            restoredAvgCost = reversedCost >= 0 ? reversedCost : restoredAvgCost;
          }

          await tx.inventoryItem.update({
            where: { id: line.item_id },
            data: { on_hand: newOnHand, average_cost: restoredAvgCost },
          });

          await tx.stockMovement.create({
            data: {
              item_id: line.item_id,
              movement_type: MovementType.ADJUSTMENT,
              reference_type: ReferenceType.GOODS_RECEIPT,
              reference_id: receipt.id,
              quantity: -receivedQty,
              unit_cost: netUnitCost,
              balance_after: newOnHand,
              notes: `Hủy phiếu nhập ${receipt.receipt_number}: ${cancelReason}`,
              created_by_id: userId,
            },
          });
        }
      }

      const updated = await tx.goodsReceipt.update({
        where: { id },
        data: {
          status: GoodsReceiptStatus.CANCELLED,
          cancel_reason: cancelReason,
          cancelled_at: new Date(),
        },
        include: {
          supplier: true,
          created_by: true,
          items: { include: { item: { include: ITEM_INCLUDE } } },
        },
      });
      return this.mapReceiptToCamelCase(updated);
    });
  }

  // ==========================================
  // STOCK CARD (THẺ KHO THEO SKU)
  // ==========================================
  async getItemMovements(itemId: number, page: number = 1, limit: number = 15) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
      include: ITEM_INCLUDE,
    });
    if (!item) throw new Error('Không tìm thấy phụ tùng');

    const skip = (page - 1) * limit;
    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { item_id: itemId },
        skip,
        take: limit,
        include: {
          created_by: { select: { id: true, full_name: true } },
          job: {
            select: {
              id: true,
              name: true,
              wo_service: {
                select: {
                  work_order: { select: { id: true, wo_number: true } },
                },
              },
            },
          },
        },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      }),
      prisma.stockMovement.count({ where: { item_id: itemId } }),
    ]);

    // Tra cứu mã phiếu nhập cho các dòng tham chiếu GOODS_RECEIPT
    const receiptIds = movements
      .filter((m) => m.reference_type === ReferenceType.GOODS_RECEIPT)
      .map((m) => m.reference_id);

    const receiptsMap = new Map<number, string>();
    if (receiptIds.length > 0) {
      const receipts = await prisma.goodsReceipt.findMany({
        where: { id: { in: receiptIds } },
        select: { id: true, receipt_number: true },
      });
      for (const r of receipts) receiptsMap.set(r.id, r.receipt_number);
    }

    // Tra cứu thông tin Job / WorkOrder nếu dòng ISSUE chưa tải đủ quan hệ job
    const jobIds = movements
      .filter((m) => m.reference_type === ReferenceType.JOB && !m.job?.wo_service?.work_order?.wo_number)
      .map((m) => m.reference_id);

    const jobsMap = new Map<number, { woNumber: string; jobName: string }>();
    if (jobIds.length > 0) {
      const jobs = await prisma.job.findMany({
        where: { id: { in: jobIds } },
        select: {
          id: true,
          name: true,
          wo_service: {
            select: {
              work_order: { select: { id: true, wo_number: true } },
            },
          },
        },
      });
      for (const j of jobs) {
        if (j.wo_service?.work_order?.wo_number) {
          jobsMap.set(j.id, { woNumber: j.wo_service.work_order.wo_number, jobName: j.name });
        }
      }
    }

    const mappedMovements = movements.map((m) => {
      let referenceCode = `#${m.reference_id}`;
      if (m.reference_type === ReferenceType.GOODS_RECEIPT) {
        referenceCode = receiptsMap.get(m.reference_id) || `GR-#${m.reference_id}`;
      } else if (m.job?.wo_service?.work_order?.wo_number) {
        referenceCode = m.job.wo_service.work_order.wo_number;
      } else if (jobsMap.has(m.reference_id)) {
        referenceCode = jobsMap.get(m.reference_id)!.woNumber;
      }

      let notes = m.notes;
      if (!notes && m.movement_type === MovementType.ISSUE) {
        const jobName = m.job?.name || jobsMap.get(m.reference_id)?.jobName;
        notes = jobName ? `Xuất cho công việc: ${jobName}` : `Xuất phụ tùng sửa chữa`;
      }

      return {
        id: m.id,
        itemId: m.item_id,
        movementType: m.movement_type,
        referenceType: m.reference_type,
        referenceId: m.reference_id,
        referenceCode,
        quantity: Number(m.quantity),
        unitCost: Number(m.unit_cost),
        balanceAfter: Number(m.balance_after),
        notes,
        createdBy: m.created_by ? { id: m.created_by.id, fullName: m.created_by.full_name } : null,
        createdAt: m.created_at,
      };
    });

    return {
      item: this.mapItemToCamelCase(item),
      movements: mappedMovements,
      pagination: { page, limit, totalRecords: total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ==========================================
  // SUPPLIERS
  // ==========================================
  async getSuppliers(search?: string, includeInactive: boolean = false) {
    const where: Prisma.SupplierWhereInput = {};
    if (!includeInactive) where.is_active = true;
    if (search) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { code: { contains: q } },
        { tax_code: { contains: q } },
        { phone: { contains: q } },
        { contact_person: { contains: q } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        _count: { select: { receipts: true } },
        receipts: {
          where: { status: GoodsReceiptStatus.POSTED },
          select: { grand_total: true, items: { select: { quantity: true, unit_cost: true, line_total: true } } },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return suppliers.map((s) => {
      const totalPurchaseValue = s.receipts.reduce((sum: number, r) => {
        const val = Number(r.grand_total) > 0
          ? Number(r.grand_total)
          : r.items.reduce((acc: number, i) => acc + (Number(i.line_total) > 0 ? Number(i.line_total) : Number(i.quantity) * Number(i.unit_cost)), 0);
        return sum + val;
      }, 0);

      return {
        id: s.id,
        code: s.code || `NCC-${String(s.id).padStart(3, '0')}`,
        name: s.name,
        taxCode: s.tax_code,
        contactPerson: s.contact_person,
        phone: s.phone,
        email: s.email,
        address: s.address,
        isActive: s.is_active,
        receiptCount: s._count.receipts,
        totalPurchaseValue,
        createdAt: s.created_at,
      };
    });
  }

  async createSupplier(data: any) {
    let code = data.code?.trim();
    if (!code) {
      const count = await prisma.supplier.count();
      code = `NCC-${String(count + 1).padStart(3, '0')}`;
    } else {
      const existing = await prisma.supplier.findUnique({ where: { code } });
      if (existing) throw new Error('Mã nhà cung cấp đã tồn tại');
    }

    const supplier = await prisma.supplier.create({
      data: {
        code,
        name: data.name.trim(),
        tax_code: data.taxCode?.trim() || null,
        contact_person: data.contactPerson?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
      },
    });
    return {
      id: supplier.id,
      code: supplier.code,
      name: supplier.name,
      taxCode: supplier.tax_code,
      contactPerson: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      isActive: supplier.is_active,
      receiptCount: 0,
      totalPurchaseValue: 0,
      createdAt: supplier.created_at,
    };
  }

  async updateSupplier(id: number, data: any) {
    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) throw new Error('Không tìm thấy nhà cung cấp');

    if (data.code && data.code !== existing.code) {
      const dup = await prisma.supplier.findUnique({ where: { code: data.code } });
      if (dup) throw new Error('Mã nhà cung cấp đã tồn tại');
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        code: data.code !== undefined ? data.code : existing.code,
        name: data.name !== undefined ? data.name : existing.name,
        tax_code: data.taxCode !== undefined ? data.taxCode : existing.tax_code,
        contact_person: data.contactPerson !== undefined ? data.contactPerson : existing.contact_person,
        phone: data.phone !== undefined ? data.phone : existing.phone,
        email: data.email !== undefined ? data.email : existing.email,
        address: data.address !== undefined ? data.address : existing.address,
        is_active: data.isActive !== undefined ? data.isActive : existing.is_active,
      },
    });
    return {
      id: updated.id,
      code: updated.code || `NCC-${String(updated.id).padStart(3, '0')}`,
      name: updated.name,
      taxCode: updated.tax_code,
      contactPerson: updated.contact_person,
      phone: updated.phone,
      email: updated.email,
      address: updated.address,
      isActive: updated.is_active,
      createdAt: updated.created_at,
    };
  }

  private mapReceiptToCamelCase(r: any) {
    if (!r) return null;
    const items = (r.items || []).map((i: any) => {
      const qty = Number(i.quantity);
      const unitCost = Number(i.unit_cost);
      const discountRate = Number(i.discount_rate || 0);
      const lineTotal = Number(i.line_total) > 0
        ? Number(i.line_total)
        : qty * unitCost * (1 - discountRate / 100);
      return {
        id: i.id,
        itemId: i.item_id,
        item: this.mapItemToCamelCase(i.item),
        quantity: qty,
        unitCost,
        discountRate,
        lineTotal,
        oldOnHand: i.old_on_hand !== null && i.old_on_hand !== undefined ? Number(i.old_on_hand) : null,
        oldAverageCost: i.old_average_cost !== null && i.old_average_cost !== undefined ? Number(i.old_average_cost) : null,
        newAverageCost: i.new_average_cost !== null && i.new_average_cost !== undefined ? Number(i.new_average_cost) : null,
      };
    });

    const computedSubtotal = items.reduce((s: number, i: any) => s + i.quantity * i.unitCost, 0);
    const subtotal = Number(r.subtotal) > 0 ? Number(r.subtotal) : computedSubtotal;
    const discountAmount = Number(r.discount_amount || 0);
    const taxRate = Number(r.tax_rate || 0);
    const taxAmount = Number(r.tax_amount || 0);
    const grandTotal = Number(r.grand_total) > 0 ? Number(r.grand_total) : subtotal - discountAmount + taxAmount;

    return {
      id: r.id,
      receiptNumber: r.receipt_number,
      supplierId: r.supplier_id,
      supplier: r.supplier
        ? {
            id: r.supplier.id,
            code: r.supplier.code || `NCC-${String(r.supplier.id).padStart(3, '0')}`,
            name: r.supplier.name,
            taxCode: r.supplier.tax_code,
            contactPerson: r.supplier.contact_person,
            phone: r.supplier.phone,
            email: r.supplier.email,
            address: r.supplier.address,
          }
        : null,
      receiptType: r.receipt_type,
      status: r.status || 'POSTED',
      referenceNo: r.reference_no,
      receivedDate: r.received_date,
      subtotal,
      discountAmount,
      taxRate,
      taxAmount,
      grandTotal,
      notes: r.notes,
      cancelReason: r.cancel_reason,
      cancelledAt: r.cancelled_at,
      createdById: r.created_by_id,
      createdBy: r.created_by ? { id: r.created_by.id, fullName: r.created_by.full_name } : null,
      createdAt: r.created_at,
      items,
    };
  }

  // ==========================================
  // HELPERS
  // ==========================================
  private async assertCategoryExists(id: number) {
    const category = await prisma.partCategory.findUnique({ where: { id } });
    if (!category) throw new Error('Không tìm thấy danh mục phụ tùng');
    return category;
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
