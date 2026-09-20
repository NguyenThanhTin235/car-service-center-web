# Thiết kế Sequence Diagram - UC-13 (Quản lý Hồ sơ Khách hàng)

Sơ đồ trình tự (Sequence Diagram) mô tả luồng tương tác giữa Người dùng (Desk Staff), Giao diện Frontend, Backend API và Cơ sở dữ liệu cho 2 tác vụ chính: **Tìm kiếm khách hàng** và **Thêm mới/Cập nhật khách hàng**.

## 1. Tìm kiếm và Xem danh sách Khách hàng

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Desk Staff
    participant UI as Frontend (Next.js)
    participant API as Backend (Express)
    participant Service as CustomerService
    participant DB as Prisma (MySQL)

    Staff->>UI: Truy cập trang "/staff/customers" hoặc gõ tìm kiếm (Debounce 500ms)
    UI->>API: GET /api/customers?search={keyword}
    API->>Service: Gọi hàm getCustomers(search)
    Service->>DB: Truy vấn bảng users, vehicles (WHERE full_name, phone, license_plate...)
    DB-->>Service: Trả về danh sách users (kèm vehicles)
    Service->>Service: Tính toán Mock Stats (Total Spent, Last Visit)
    Service-->>API: Trả về mảng DTO Khách hàng
    API-->>UI: HTTP 200 OK + JSON Data
    UI-->>Staff: Render bảng dữ liệu danh sách khách hàng
```

## 2. Thêm mới Khách hàng & Phương tiện (Tạo mới)

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Desk Staff
    participant UI as Frontend (Next.js)
    participant API as Backend (Express)
    participant Service as CustomerService
    participant DB as Prisma (MySQL)

    Staff->>UI: Bấm nút "Thêm mới"
    UI-->>Staff: Hiển thị Modal `CustomerFormModal`
    Staff->>UI: Nhập thông tin Khách (Tên, SĐT, Email) & Xe (Biển số...) và bấm Lưu
    UI->>API: POST /api/customers (payload: Customer + Vehicle data)
    
    API->>Service: Gọi hàm createCustomer(data)
    Service->>DB: Kiểm tra trùng lặp SĐT/Email (findFirst)
    DB-->>Service: Kết quả (null / exist)
    
    alt SĐT hoặc Email đã tồn tại
        Service-->>API: Throw Error "Số điện thoại / Email đã tồn tại"
        API-->>UI: HTTP 400 Bad Request + Error Message
        UI-->>Staff: Hiển thị thông báo lỗi trên UI
    else Thông tin hợp lệ
        Service->>DB: Bắt đầu Transaction
        Note over DB: Transaction Start
        Service->>DB: Tạo User (password hash, CUSTOMER role)
        DB-->>Service: Trả về User ID mới
        
        opt Có nhập thông tin xe
            Service->>DB: Kiểm tra biển số xe tồn tại chưa
            DB-->>Service: Kết quả
            alt Biển số bị trùng
                Service-->>API: Throw Error "Biển số xe đã tồn tại"
                Note over DB: Transaction Rollback
                API-->>UI: HTTP 400 + Lỗi biển số
                UI-->>Staff: Hiển thị lỗi biển số
            else Biển số hợp lệ
                Service->>DB: Tạo Vehicle gán với User ID
            end
        end
        Note over DB: Transaction Commit
        
        DB-->>Service: Xác nhận lưu thành công
        Service-->>API: Trả về User Data
        API-->>UI: HTTP 201 Created + Success Message
        UI->>UI: Đóng Modal
        UI->>API: Trigger GET /api/customers (Fetch lại dữ liệu)
        UI-->>Staff: Hiển thị thông báo thành công & Bảng cập nhật
    end
```

## 3. Chỉnh sửa thông tin Khách hàng

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Desk Staff
    participant UI as Frontend (Next.js)
    participant API as Backend (Express)
    participant Service as CustomerService
    participant DB as Prisma (MySQL)

    Staff->>UI: Bấm biểu tượng "Chỉnh sửa" trên dòng Khách hàng
    UI-->>Staff: Bật Modal với dữ liệu (initialData) đã điền sẵn
    Staff->>UI: Sửa thông tin (Tên, Email...) và bấm Lưu
    UI->>API: PUT /api/customers/:id (payload)
    
    API->>Service: Gọi updateCustomer(id, data)
    Service->>DB: Kiểm tra trùng lặp thông tin nếu có sửa (SĐT/Email)
    
    alt Bị trùng thông tin
        Service-->>API: Throw Error "Email/SĐT đã tồn tại"
        API-->>UI: HTTP 400 Bad Request
        UI-->>Staff: Hiển thị lỗi
    else Hợp lệ
        Service->>DB: Update thông tin bảng `users`
        DB-->>Service: Xác nhận Update thành công
        Service-->>API: Trả về Updated Data
        API-->>UI: HTTP 200 OK + Success Message
        UI->>UI: Đóng Modal
        UI->>API: Trigger GET /api/customers
        UI-->>Staff: Bảng dữ liệu được làm mới
    end
```
