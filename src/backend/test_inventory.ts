import { inventoryService } from './src/services/inventory.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTest() {
  console.log('--- Bắt đầu test Inventory ---');
  
  try {
    // 1. Lấy danh sách UOM để tạo Part
    const uom = await prisma.systemCatalog.findFirst({ where: { catalog_type: 'UOM' } });
    if (!uom) {
       console.log('Không có UOM nào trong DB, tạo UOM giả định...');
       await prisma.systemCatalog.create({
         data: { catalog_type: 'UOM', name: 'Cái' }
       });
    }
    const currentUom = await prisma.systemCatalog.findFirst({ where: { catalog_type: 'UOM' } });

    // Clean up trước nếu có
    const existing = await prisma.inventoryItem.findFirst({ where: { sku: 'TEST-SKU-001' } });
    if (existing) {
       // Delete related tables manually for test cleanup
       await prisma.stockMovement.deleteMany({ where: { item_id: existing.id } });
       await prisma.goodsReceiptItem.deleteMany({ where: { item_id: existing.id } });
       await prisma.inventoryItem.delete({ where: { id: existing.id } });
    }

    // 2. Tạo mới Inventory Item (UC-44)
    console.log('1. Đang tạo phụ tùng mới...');
    const newItem = await inventoryService.createItem({
      sku: 'TEST-SKU-001',
      name: 'Lọc gió Test',
      itemType: 'PART',
      uomId: currentUom!.id,
      sellingPrice: 150000,
      reorderLevel: 5
    });
    console.log('=> Đã tạo thành công:', newItem!.sku);

    // 3. Sửa phụ tùng (UC-46)
    console.log('2. Đang cập nhật phụ tùng...');
    const updatedItem = await inventoryService.updateItem(newItem!.id, {
      sellingPrice: 160000
    });
    console.log('=> Đã cập nhật giá bán thành:', updatedItem!.sellingPrice);

    // 4. Lấy danh sách phụ tùng (UC-45)
    console.log('3. Lấy danh sách phụ tùng...');
    const list = await inventoryService.getItems('TEST-SKU');
    console.log('=> Tổng số tìm thấy:', list.pagination.totalRecords);

    // 5. Lấy Supplier
    const supplier = await prisma.supplier.findFirst();
    let supplierId = supplier?.id || null;
    
    // 6. Nhập kho lần 1 (UC-48)
    console.log('4. Tiến hành nhập kho lần 1 (10 cái, giá 100k)...');
    const receipt1 = await inventoryService.createReceipt({
      supplierId: supplierId,
      receiptType: 'PURCHASE',
      receivedDate: new Date().toISOString(),
      items: [
        {
          itemId: newItem!.id,
          quantity: 10,
          unitCost: 100000
        }
      ],
      notes: 'Test nhập kho lần 1'
    }, 1);
    
    console.log('=> Nhập kho thành công. Số phiếu:', receipt1.receipt_number);

    let afterReceipt1 = await inventoryService.getItemById(newItem!.id);
    console.log(`=> Tồn kho sau nhập lần 1: ${afterReceipt1!.onHand} | Giá vốn: ${afterReceipt1!.averageCost}`);

    // Nhập kho lần 2 để test Moving Average Cost (10 cái, giá 120k)
    // Tổng onHand sẽ là 20. Tổng value = 10*100k + 10*120k = 2.2tr => Avg = 110k
    console.log('5. Tiến hành nhập kho lần 2 (10 cái, giá 120k để test MAC)...');
    await inventoryService.createReceipt({
      supplierId: supplierId,
      receiptType: 'PURCHASE',
      receivedDate: new Date().toISOString(),
      items: [
        {
          itemId: newItem!.id,
          quantity: 10,
          unitCost: 120000
        }
      ]
    }, 1);

    let afterReceipt2 = await inventoryService.getItemById(newItem!.id);
    console.log(`=> Tồn kho sau nhập lần 2: ${afterReceipt2!.onHand} | Giá vốn: ${afterReceipt2!.averageCost}`);

    if (afterReceipt2!.averageCost === 110000) {
      console.log('=> [PASSED] Công thức giá vốn bình quân di động TÍNH ĐÚNG!');
    } else {
      console.log('=> [FAILED] Giá vốn chưa chính xác.');
    }

    // 8. Tạm ngưng (UC-47)
    console.log('6. Tạm ngưng (Soft Delete) do phụ tùng đã phát sinh giao dịch...');
    const toggle = await inventoryService.toggleItem(newItem!.id);
    console.log('=> Kết quả toggle (isActive):', toggle.item?.isActive);
    
    console.log('--- TEST HOÀN TẤT VÀ THÀNH CÔNG ---');
  } catch (error) {
    console.error('--- LỖI KHI TEST ---', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
