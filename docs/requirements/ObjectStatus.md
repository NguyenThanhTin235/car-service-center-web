# TỪ ĐIỂN TRẠNG THÁI VÀ CHUYỂN ĐỔI (OBJECT STATUS & TRANSITION DICTIONARY)

Tài liệu này định nghĩa chi tiết vòng đời (Lifecycle), các trạng thái (Status) và các sự kiện chuyển đổi trạng thái (Status Transition / Trigger) đối với các thực thể cốt lõi trong hệ thống quản lý Trung tâm dịch vụ Ô tô.

---

## 1. Lịch hẹn (Appointment)
Dùng để theo dõi quá trình từ khi khách hàng có nhu cầu đến khi mang xe tới xưởng.

### 1.1. Định nghĩa trạng thái
| Trạng thái | Ý nghĩa |
|:---:|---|
| **REQUESTED** | Khách hàng đã đặt lịch trên App/Web hoặc Lễ tân tạo tạm. Đang chờ xác nhận từ xưởng. |
| **CONFIRMED** | Lễ tân đã gọi điện xác nhận thời gian lịch hẹn và năng lực tiếp nhận của xưởng. |
| **RESCHEDULED** | Khách hàng hoặc Lễ tân thay đổi thời gian so với lịch gốc. |
| **CANCELLED** | Khách hàng chủ động hủy hoặc Lễ tân hủy do khách không đến. |
| **ARRIVED** | Khách đã mang xe đến xưởng. Lịch hẹn hoàn tất sứ mệnh của mình. |

### 1.2. Chuyển đổi trạng thái (Transitions)
| Từ trạng thái | Trạng thái tiếp theo | Trigger (Sự kiện kích hoạt) | Actor thực hiện |
|---|---|---|---|
| *(Khởi tạo)* | **REQUESTED** | Tạo lịch hẹn mới trên hệ thống | Customer / Front Desk |
| **REQUESTED** | **CONFIRMED** | Nhấn xác nhận lịch hẹn sau khi gọi điện | Front Desk |
| **REQUESTED** / **CONFIRMED** | **RESCHEDULED** | Đổi thời gian lịch hẹn | Customer / Front Desk |
| **RESCHEDULED** | **CONFIRMED** | Nhấn xác nhận lại lịch trình mới | Front Desk |
| **REQUESTED** / **CONFIRMED** | **CANCELLED** | Chọn hủy lịch hẹn | Customer / Front Desk |
| **CONFIRMED** | **ARRIVED** | Đánh dấu khách đã đưa xe đến xưởng | Front Desk |

---

## 2. Phiếu công việc (Work Order)
Đây là thực thể trung tâm của hệ thống, quản lý toàn bộ vòng đời của một lần xe vào xưởng (Visit).

### 2.1. Định nghĩa trạng thái
| Trạng thái | Ý nghĩa |
|:---:|---|
| **DRAFT** | Nháp. Đang trong quá trình ghi nhận thông tin xe (ODO, xăng, đồ đạc). |
| **IN_PLANNING** | Đang lập kế hoạch. Đưa xe lên cầu nâng để kiểm tra, đánh dấu Finding, tạo Job, khai báo vật tư. |
| **PENDING_APPROVAL**| Đang chờ phản hồi từ khách hàng về bảng Báo giá. |
| **APPROVED** | Khách đã đồng ý báo giá. Hệ thống cho phép xuất kho và thợ bắt đầu làm việc. |
| **IN_PROGRESS** | Thợ đang sửa chữa. Hoặc đang trong quá trình kiểm định QC (Rework). |
| **BILLING_REQUESTED**| Đã gửi yêu cầu thanh toán sang Quầy dịch vụ để chốt bill. |
| **FINANCIAL_CLEARED**| Đã thanh toán thành công (Clear tài chính). Khóa các thay đổi liên quan đến chi phí. |
| **RELEASED** | Đã bàn giao xe cho khách hàng và rời xưởng. |
| **CLOSED** | Phiếu công việc đã được đóng. Lịch sử dịch vụ được ghi nhận vĩnh viễn. |

### 2.2. Chuyển đổi trạng thái (Transitions)
| Từ trạng thái | Trạng thái tiếp theo | Trigger (Sự kiện kích hoạt) | Actor thực hiện |
|---|---|---|---|
| *(Khởi tạo)* | **DRAFT** | Tạo Work Order (từ Intake Queue, Walk-in, Tow-in) | Service Advisor |
| **DRAFT** | **IN_PLANNING** | Lưu xong thông tin tình trạng xe (Condition) | Service Advisor |
| **IN_PLANNING** | **PENDING_APPROVAL**| Gửi báo giá (Quotation) cho khách hàng | Service Advisor |
| **PENDING_APPROVAL**| **IN_PLANNING** | Khách từ chối báo giá (Rejected) -> Quay lại lập KH | Service Advisor |
| **PENDING_APPROVAL**| **APPROVED** | Đánh dấu khách đồng ý báo giá (Approved) | Service Advisor |
| **APPROVED** | **IN_PROGRESS** | Bắt đầu thao tác Xuất kho vật tư (Issue Part) cho Job đầu tiên | Service Advisor |
| **IN_PROGRESS** | **BILLING_REQUESTED**| Gửi yêu cầu thanh toán (Khi toàn bộ Job Completed & QC Passed) | Service Advisor |
| **BILLING_REQUESTED**| **FINANCIAL_CLEARED**| Trạng thái hóa đơn chuyển thành PAID (Trigger tự động) | Hệ thống (Tự động) |
| **FINANCIAL_CLEARED**| **RELEASED** | Xác nhận bàn giao xe thành công | Service Advisor |
| **RELEASED** | **CLOSED** | Nhấn Đóng phiếu (Chỉ khi thỏa mãn Closure Gate) | Service Advisor |
| *(Tất cả)* | **CANCELLED** | Nhấn Hủy phiếu (Chỉ được phép khi chưa xuất kho) | Service Advisor |

---

## 3. Vấn đề & Công việc (Finding & Job)

### 3.1. Finding (Phát hiện hư hỏng)
| Trạng thái | Ý nghĩa |
|:---:|---|
| **NEW** | Mới phát hiện (Chấm trên sơ đồ xe hoặc tạo ghi chú). |
| **LINKED_TO_JOB** | Đã được ánh xạ (map) vào ít nhất 1 Job để xử lý. |
| **RESOLVED** | Job liên kết với Finding đã hoàn thành và vượt qua QC. |

**Chuyển đổi trạng thái Finding:**
- `(Tạo mới)` -> `NEW` : Khi SA tạo Finding.
- `NEW` -> `LINKED_TO_JOB` : Khi SA tạo/gán Job vào Finding này.
- `LINKED_TO_JOB` -> `RESOLVED` : Tự động kích hoạt khi Job liên kết có trạng thái là `PASSED` (QC Pass).

### 3.2. Job (Công việc sửa chữa)
| Trạng thái | Ý nghĩa |
|:---:|---|
| **PLANNED** | Đã lên kế hoạch (dự trù giờ công, thợ và phụ tùng). |
| **IN_PROGRESS** | Đang thực hiện. |
| **COMPLETED** | Thợ báo xong, SA ghi nhận hoàn thành. |
| **REWORK** | Sửa lại do không vượt qua bài kiểm tra QC. |
| **PASSED** | Đạt kiểm định QC cuối cùng. |

**Chuyển đổi trạng thái Job:**
| Từ trạng thái | Trạng thái tiếp theo | Trigger (Sự kiện kích hoạt) | Actor thực hiện |
|---|---|---|---|
| *(Khởi tạo)* | **PLANNED** | Tạo Job từ Finding / Template / Manual | Service Advisor |
| **PLANNED** | **IN_PROGRESS** | Xuất kho (Issue) phụ tùng cho Job này | Service Advisor |
| **IN_PROGRESS** | **COMPLETED** | Đánh dấu hoàn thành Job, nhập Used Qty | Service Advisor |
| **COMPLETED** | **REWORK** | Đánh giá Fail trong bước Kiểm định QC | Service Advisor |
| **REWORK** | **IN_PROGRESS** | Tự động chuyển lại khi bắt đầu sửa lỗi | Hệ thống |
| **COMPLETED** | **PASSED** | Đánh giá Pass trong bước Kiểm định QC | Service Advisor |

---

## 4. Báo giá (Quotation)
Quản lý sự đồng thuận về chi phí giữa Garage và Khách hàng.

### 4.1. Định nghĩa trạng thái
| Trạng thái | Ý nghĩa |
|:---:|---|
| **DRAFT** | Nháp. Đang soạn, điều chỉnh chiết khấu hoặc kiểm tra lại các dòng Labour/Part. |
| **SENT** | Đã gửi cho khách hàng xem. |
| **APPROVED** | Khách xác nhận làm. Kích hoạt "Freeze Snapshot" (khóa giá vật tư/nhân công). |
| **REJECTED** | Khách không đồng ý. |

### 4.2. Chuyển đổi trạng thái (Transitions)
| Từ trạng thái | Trạng thái tiếp theo | Trigger (Sự kiện kích hoạt) | Actor thực hiện |
|---|---|---|---|
| *(Khởi tạo)* | **DRAFT** | Tính toán chi phí và tạo Báo giá | Service Advisor |
| **DRAFT** | **SENT** | Xuất PDF hoặc gửi qua hệ thống/email | Service Advisor |
| **SENT** | **APPROVED** | Đánh dấu Khách hàng đồng ý báo giá | Service Advisor / Customer |
| **SENT** | **REJECTED** | Đánh dấu Khách hàng từ chối báo giá | Service Advisor / Customer |

---

## 5. Hóa đơn (Invoice)
Quản lý công nợ và quá trình thanh toán.

### 5.1. Định nghĩa trạng thái
| Trạng thái | Ý nghĩa |
|:---:|---|
| **DRAFT_INVOICE** | Nháp. Nhận lệnh xuất bill từ SA, đang kiểm tra trước khi phát hành. |
| **ISSUED** | Hóa đơn chính thức được phát hành, ghi nhận công nợ. |
| **PAID** | Khách đã thanh toán đủ tiền (Amount Due = 0). |
| **CANCELLED** | Hủy hóa đơn do sai sót. |

### 5.2. Chuyển đổi trạng thái (Transitions)
| Từ trạng thái | Trạng thái tiếp theo | Trigger (Sự kiện kích hoạt) | Actor thực hiện |
|---|---|---|---|
| *(Khởi tạo)* | **DRAFT_INVOICE**| Nhận Billing Request từ Work Order | Lễ tân (Front Desk) |
| **DRAFT_INVOICE**| **ISSUED** | Nhấn Phát hành hóa đơn | Lễ tân |
| **ISSUED** | **PAID** | Xác nhận thanh toán đủ tiền (Tiền mặt/Chuyển khoản) | Lễ tân |
| **ISSUED** | **CANCELLED** | Hủy hóa đơn (yêu cầu tạo lại hóa đơn mới) | Lễ tân / Quản lý |

---

## 6. Trạng thái Vật tư trong một Job (Part Allocation Status)
Quản lý số lượng và trạng thái của phụ tùng được sử dụng cho một Job cụ thể.

| Từ trạng thái | Trạng thái tiếp theo | Trigger (Sự kiện kích hoạt) | Actor thực hiện |
|---|---|---|---|
| *(Khởi tạo)* | **PLANNED** | Thêm phụ tùng vào Job (dự trù số lượng) | Service Advisor |
| **PLANNED** | **RESERVED** | Báo giá (chứa Job này) được Duyệt (APPROVED) | Service Advisor |
| **RESERVED** | **ISSUED** | Thực hiện xuất kho vật tư đưa cho kỹ thuật viên | Service Advisor |
| **ISSUED** | **USED** / **RETURNED**| Khi Job Completed: hệ thống ghi nhận số lượng thực dùng (Used) và phần còn dư sẽ được nhập trả lại kho (Returned) | Service Advisor |
