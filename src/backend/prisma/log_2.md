# Kế hoạch Chuyển đổi Database: Kiến trúc Phụ tùng Cha - Con (Master - Variant)

Dựa trên yêu cầu tái cấu trúc, chúng ta sẽ áp dụng mô hình **Sản phẩm cha (Master) - Sản phẩm con (Variant)**. 
- Bảng danh mục hiện tại đóng vai trò là "Nhóm/Loại phụ tùng chung" (Category/Master). Ví dụ: "Lọc gió động cơ".
- Bảng mới sẽ lưu thông tin thực tế nhập kho theo từng Hãng/Thương hiệu (Variant). Ví dụ: "Lọc gió Denso", "Lọc gió Bosch".

Vui lòng cập nhật `schema.prisma` như sau:

### 1. Bổ sung giá trị cho Enum `CatalogType` (nếu dùng chung bảng SystemCatalog)
Thêm `BRAND` để quản lý các Thương hiệu:
```prisma
enum CatalogType {
  // ... các giá trị cũ
  BRAND // Thương hiệu phụ tùng (Vd: Bosch, Denso, Toyota OEM...)
}
```

### 2. Đổi tên bảng hiện tại thành `PartCategory` (Danh mục Phụ tùng Chung)
Bảng `InventoryItem` cũ nay đổi vai trò thành "Danh mục/Loại phụ tùng chung".
```prisma
model PartCategory {
  id               Int      @id @default(autoincrement())
  code             String   @unique @db.VarChar(50)  // Ví dụ: LOC-GIO
  name             String   @db.VarChar(255)         // Ví dụ: Lọc gió động cơ
  item_type        ItemType // PART, MATERIAL, v.v.
  uom_id           Int
  description      String?  @db.Text
  is_active        Boolean  @default(true)
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt

  uom              SystemCatalog @relation("UomToPartCategory", fields: [uom_id], references: [id])
  
  // Liên kết tới các phụ tùng thực tế theo hãng
  inventory_items  InventoryItem[] 

  @@map("part_categories")
}
```

### 3. Tạo bảng MỚI mang tên `InventoryItem` (Kho hàng thực tế)
Đây mới chính là bảng lưu trữ số lượng tồn kho và liên kết với Hãng sản xuất.
```prisma
model InventoryItem {
  id               Int      @id @default(autoincrement())
  part_category_id   Int      // Liên kết về chủng loại chung
  sku              String   @unique @db.VarChar(50) // Ví dụ: LOC-GIO-DENSO-001
  brand_id         Int?     // Liên kết tới SystemCatalog (loại BRAND)
  
  // Thông tin kho và giá
  selling_price    Decimal  @db.Decimal(15, 2)
  average_cost     Decimal  @default(0) @db.Decimal(15, 2)
  on_hand          Int      @default(0)
  reorder_level    Int      @default(0)
  
  is_active        Boolean  @default(true)
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt

  // Quan hệ (Relations)
  part_category      PartCategory     @relation(fields: [part_category_id], references: [id])
  brand            SystemCatalog? @relation("BrandToInventory", fields: [brand_id], references: [id])
  
  // ... Các relation khác như stock_movements, goods_receipt_items, v.v. trỏ về đây

  @@map("inventory_items")
}
```

### 4. Cập nhật Model `SystemCatalog`
```prisma
model SystemCatalog {
  // ... các trường hiện tại
  
  // Relations
  part_categories     PartCategory[]    @relation("UomToPartCategory")
  brand_items      InventoryItem[] @relation("BrandToInventory")
}
```

**Ưu điểm của thiết kế này:**
- **Rất linh hoạt:** Quản lý được một cấu trúc cây. Khách hàng bảo thay "Lọc gió", cố vấn dịch vụ (SA) chỉ cần chọn `PartCategory` là "Lọc gió". Cố vấn kho sẽ gợi ý các biến thể (Variants): Hãng Bosch (giá X), Hãng Denso (giá Y) để xuất kho.
- **Thống kê kho chuẩn xác:** Quản lý được giá vốn trung bình và số lượng tồn kho (on_hand) rạch ròi cho từng hãng, tránh việc giá vốn bị tính gộp chung sai lệch.
