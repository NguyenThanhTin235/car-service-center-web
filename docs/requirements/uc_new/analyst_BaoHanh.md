Dựa trên kiến trúc cốt lõi của đồ án: **lấy Work Order làm hồ sơ trung tâm**, tuân thủ nghiêm ngặt **chuỗi truy vết bất biến** (`Finding → Job → Part/Labour → Quotation → QC → Invoice/Payment → Release`) và mô hình máy trạng thái hữu hạn (FSM), phân tích chi tiết cho phân hệ **Nghiệp vụ Bảo hành (Warranty Module)** gồm: Use Case đề xuất, thiết kế Database và Flow vận hành.

---

### 1. Phân tích Bản chất Nghiệp vụ Bảo hành (Business Logic)

* **Nguyên tắc tài chính & kho vận:**
* **Chi phí đối với Khách hàng:** Hoàn toàn **0 VNĐ** (miễn phí tiền công và tiền phụ tùng lỗi).


* **Chi phí nội bộ của Trung tâm:** Vẫn phát sinh chi phí thực tế. Phụ tùng thay thế phải xuất kho thực tế, làm giảm tồn kho (`on_hand`), ghi nhận theo phương pháp **Giá vốn bình quân gia quyền di động (Moving Weighted Average - MWA)** để hạch toán chi phí rủi ro/chất lượng của xưởng. Giờ công của kỹ thuật viên vẫn được ghi nhận để đánh giá hiệu suất.




* **Điều kiện tiên quyết để được bảo hành:**
* Xe phải có lịch sử sửa chữa trong hệ thống: Work Order (WO) trước đó phải ở trạng thái `RELEASED` hoặc `CLOSED`.


* Hạng mục yêu cầu bảo hành (Dịch vụ hoặc Phụ tùng) phải nằm trong thời hạn bảo hành (theo số tháng hoặc số km ODO tiếp nhận so với ODO tại WO cũ).




* **Cách tiếp cận kỹ thuật:** **Không đập đi xây lại**, mà **kế thừa toàn bộ vòng đời FSM của Work Order**. Lập một WO mới có phân loại là `WARRANTY`, liên kết tới `parent_work_order_id`. Mọi cửa kiểm soát chất lượng (`QC Gate`), xuất kho (`BR-EXE-01`), và cổng bàn giao (`Release Gate`) vẫn giữ nguyên giá trị kiểm soát.



---

### 2. Đề xuất Danh sách Use Case Mới (Warranty Use Cases)

Để không làm xáo trộn cấu trúc 78 UCs hiện tại, 03 Use Case bảo hành được chuẩn hóa bổ sung:

| Mã UC | Tên Use Case | Actor | Loại / Ưu tiên | Mô tả cốt lõi |
| --- | --- | --- | --- | --- |
| **UC-W01** | **Tra cứu điều kiện bảo hành (Check Warranty Eligibility)** | Lễ tân (Front Desk) / Cố vấn (SA)

 | Tra cứu / Must | Nhập biển số xe/SĐT, hệ thống quét các WO cũ (`RELEASED`/`CLOSED`), đối chiếu hạn bảo hành của từng phụ tùng/dịch vụ với ngày hiện tại và ODO tiếp nhận.

 |
| **UC-W02** | **Khởi tạo Lệnh bảo hành (Create Warranty Work Order)** | Cố vấn dịch vụ (SA)

 | Lưu trữ / Must | Khởi tạo một WO mới từ hạng mục bảo hành hợp lệ, tự động gán `order_type = WARRANTY` và liên kết `parent_work_order_id` với WO gốc.

 |
| **UC-W03** | **Xử lý Báo giá & Hóa đơn 0đ (Process Warranty Invoice & Clearance)** | Cố vấn dịch vụ / Lễ tân

 | Xử lý / Must | Tự động áp dụng đơn giá bán 0đ cho Part và Giờ công bảo hành; khi xuất hóa đơn 0đ, hệ thống kích hoạt tự động `FINANCIAL_CLEARED` để xe vượt qua `Release Gate`.

 |

---

### 3. Thiết kế Cơ sở Dữ liệu (Database Architecture)

Cấu trúc được mở rộng trực tiếp trên file `schema.prisma` hiện tại mà không làm vỡ các mối quan hệ cũ:

```prisma
// ==========================================
// 1. CẬP NHẬT ENUM
// ==========================================
enum WorkOrderType {
  NORMAL        // Sửa chữa, bảo dưỡng, detailing thông thường
  WARRANTY      // Lệnh sửa chữa bảo hành
}

// ==========================================
// 2. MỞ RỘNG BẢNG WORK ORDER (work_orders)
// ==========================================
model WorkOrder {
  id                    String         @id @default(uuid())
  orderNumber           String         @unique @map("order_number")
  status                String         // DRAFT, IN_PLANNING, APPROVED, IN_PROGRESS, BILLING_REQUESTED, FINANCIAL_CLEARED, RELEASED, CLOSED...
  
  // Phân loại đơn hàng
  orderType             WorkOrderType  @default(NORMAL) @map("order_type")
  
  // Quan hệ tự tham chiếu (Self-relation) để truy vết nguồn gốc bảo hành
  parentWorkOrderId     String?        @map("parent_work_order_id")
  parentWorkOrder       WorkOrder?     @relation("WarrantyHierarchy", fields: [parentWorkOrderId], references: [id])
  warrantyOrders        WorkOrder[]    @relation("WarrantyHierarchy")

  // Ghi chú lý do yêu cầu bảo hành
  warrantyReason        String?        @db.Text @map("warranty_reason")

  // Các quan hệ sẵn có giữ nguyên: customer, vehicle, advisor, services, quotations, invoices...
}

// ==========================================
// 3. MỞ RỘNG BẢNG JOBS (jobs)
// ==========================================
model Job {
  id                    String         @id @default(uuid())
  workOrderId           String         @map("work_order_id")
  name                  String
  status                String         // PLANNED, IN_PROGRESS, COMPLETED, PASSED, REWORK...
  
  // Đánh dấu công việc thuộc diện bảo hành
  isWarranty            Boolean        @default(false) @map("is_warranty")
  
  // Quan hệ cũ: jobLabours, jobParts, jobFindings...
}

// ==========================================
// 4. MỞ RỘNG MASTER DATA (Cấu hình hạn bảo hành)
// ==========================================
model Service {
  id                    String         @id @default(uuid())
  name                  String
  // Thời hạn bảo hành dịch vụ mặc định (tháng)
  warrantyMonths        Int            @default(0) @map("warranty_months")
  // ... các trường cũ
}

model InventoryItem {
  id                    String         @id @default(uuid())
  sku                   String         @unique
  sellingPrice          Decimal        @db.Decimal(12, 2) @map("selling_price")
  averageCost           Decimal        @db.Decimal(12, 2) @map("average_cost")
  
  // Thời hạn bảo hành của phụ tùng (tháng)
  warrantyMonths        Int            @default(0) @map("warranty_months")
  // ... các trường cũ
}

```

---

### 4. Giải thích Luồng Hoạt động Chi tiết (Flow E2E)

Luồng hoạt động bám sát chuỗi FSM sẵn có và bổ sung các điểm xử lý giá 0đ cùng Financial Clearance tự động:

```
[BƯỚC 1: TIẾP NHẬN & TRA CỨU]
Khách đem xe đến phản ánh sự cố cũ (Walk-in / Đặt lịch)
       │
       ▼
Front Desk / SA nhập biển số xe → Mở popup "Lịch sử dịch vụ & Bảo hành"
Hệ thống truy vấn:
  - Các WO cũ có status = RELEASED / CLOSED
  - Đối chiếu: (Ngày hiện tại - Ngày hoàn tất WO cũ) <= warranty_months
  - (Tùy chọn) Đối chiếu chênh lệch ODO
       │
       ├── KHÔNG HỢP LỆ: Chuyển sang tạo WO dạng NORMAL (sửa chữa tính phí)
       └── HỢP LỆ: SA bấm [Tạo Lệnh Bảo Hành]
       │
       ▼
[BƯỚC 2: KHỞI TẠO WO BẢO HÀNH]
Hệ thống tạo bản ghi Work Order:
  - order_type = WARRANTY
  - parent_work_order_id = [ID của WO trước]
  - Sao chép thông tin Khách hàng & Phương tiện
  - Ghi nhận Check-in ODO, xăng, ảnh chụp hiện trạng (BR-WO-02)
       │
       ▼
[BƯỚC 3: KHÁM XE, TẠO FINDING & JOB]
SA mở sơ đồ 2D khám xe → Đặt marker lỗi → Tạo Finding
SA bấm [+ New Job] từ Finding → Bật cờ is_warranty = true
Khai báo thợ kỹ thuật phụ trách & Danh mục phụ tùng cần xuất thay thế
       │
       ▼
[BƯỚC 4: BÁO GIÁ ĐẶC TẢ 0 ĐỒNG (Freeze Snapshot)]
Hệ thống tạo Quotation:
  - Part Selling Price = 0 VNĐ (nhưng hệ thống vẫn giữ nguyên giá gốc tham chiếu)
  - Labour Rate = 0 VNĐ
  - Grand Total = 0 VNĐ
Cố vấn dịch vụ xác nhận chuyển Quotation sang APPROVED (Đóng băng snapshot)
       │
       ▼
[BƯỚC 5: XUẤT KHO PHỤ TÙNG & THỰC HIỆN JOB]
Quản lý kho xuất phụ tùng cho Job (BR-EXE-01, BR-INV-ITEM-06):
  - Số lượng on_hand giảm thực tế trong kho
  - Thẻ kho (Stock Movement) ghi nhận xuất dùng, ghi nhận chi phí theo average_cost
Kỹ thuật viên thực hiện sửa chữa → Hoàn tất (Job COMPLETED)
       │
       ▼
[BƯỚC 6: KIỂM ĐỊNH CHẤT LƯỢNG (QC Gate)]
Cố vấn / KCS kiểm tra checklist bảo hành:
  - Nếu QC Fail: Tạo Rework Job (BR-QC-03)
  - Nếu QC Pass: Đánh dấu đủ điều kiện chuyển thanh toán (BR-QC-02)
       │
       ▼
[BƯỚC 7: XỬ LÝ HÓA ĐƠN & BÀN GIAO XE (Release Gate)]
SA gửi Billing Request sang quầy Lễ tân
Lễ tân tạo Hóa đơn (Invoice):
  - Do Invoice Total = 0 VNĐ, hệ thống tự động:
    1. Cập nhật Invoice status = PAID
    2. Kích hoạt WO status = FINANCIAL_CLEARED
Release Gate được thỏa mãn: Job Completed + QC Pass + FINANCIAL_CLEARED
SA bàn giao xe cho khách (WO chuyển RELEASED → CLOSED)

```



---

### 5. Chi tiết 02 Kịch bản Kiểm thử Quan trọng (Test Scenarios)

Tuân thủ phương pháp thiết kế kịch bản đã dùng trong đồ án (BVA, STT, Business Rules):

* **Kịch bản 1: Kiểm tra tính toán chi phí và thẻ kho khi xử lý bảo hành (Business Rule Verification)**
* **Tiền điều kiện:** Phụ tùng Bugi có `on_hand = 10`, `average_cost = 50.000 VNĐ`, `selling_price = 120.000 VNĐ`, `warranty_months = 6`. WO gốc hoàn tất cách đây 2 tháng.


* **Thao tác:** Tạo WO Bảo hành, lập Job thay Bugi mới, duyệt Báo giá và thực hiện xuất kho phụ tùng.


* **Kết quả kỳ vọng:**
* Báo giá và Hóa đơn gửi khách hiển thị đơn giá `0 VNĐ`, tổng tiền thanh toán `0 VNĐ`.


* Kho giảm tồn `on_hand = 9`. Thẻ kho `StockMovement` ghi nhận loại xuất cho Job với giá vốn trừ vào chi phí bảo hành nội bộ là `50.000 VNĐ`.






* **Kịch bản 2: Vượt qua cổng bàn giao tự động (Release Gate State Transition)**
* **Tiền điều kiện:** WO bảo hành có Job đã `COMPLETED`, `QC Passed`.


* **Thao tác:** Lễ tân nhấn phát hành Hóa đơn 0 VNĐ.


* **Kết quả kỳ vọng:** Hóa đơn lập tức mang trạng thái `PAID`. WO tự động chuyển sang `FINANCIAL_CLEARED` mà không cần nhập phiếu thu tiền. Nút **Bàn giao xe (Release)** sáng lên cho phép Cố vấn hoàn tất giao xe.