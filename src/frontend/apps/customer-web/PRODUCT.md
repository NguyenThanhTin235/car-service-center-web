# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Chủ xe ô tô tại Việt Nam (Khách hàng cá nhân & doanh nghiệp nhỏ):** Mang xe đến bảo dưỡng định kỳ, sửa chữa sự cố, hoặc chăm sóc ngoại thất/nội thất tại trung tâm dịch vụ kỹ thuật ô tô.
- **Tình huống sử dụng thực tế:** Kiểm tra tiến độ sửa xe từ xa trên điện thoại khi đang làm việc, xem ảnh chụp hiện trạng xe/phụ tùng, phê duyệt báo giá bằng thao tác một chạm, quét mã hoặc sao chép thông tin chuyển khoản VietQR, và xem/in hóa đơn A4 trên máy tính để lưu trữ hoặc thanh toán doanh nghiệp.

## Product Purpose

Cung cấp cổng thông tin khách hàng minh bạch, chuẩn mực và dễ sử dụng giúp chủ xe đặt lịch hẹn, quản lý hồ sơ phương tiện, theo dõi trực tiếp từng công đoạn sửa chữa tại xưởng, duyệt báo giá điện tử và thanh toán hóa đơn tức thời. Thành công được đo bằng sự an tâm của chủ xe, không còn mơ hồ về chi phí hay thời gian giao xe.

## Positioning

Minh bạch quy trình kỹ thuật theo thời gian thực ngay trên thiết bị của chủ xe: dòng thời gian 6 công đoạn có mốc giờ thực tế, ảnh chụp đối chiếu tại khâu tiếp nhận và kiểm định QC, bảng báo giá chi tiết từng hạng mục phụ tùng/nhân công, đối soát chuyển khoản VietQR tự động qua SePay, kèm biên bản bàn giao và hóa đơn PDF chuẩn mực.

## Operating Context

- **Di động (390px – 430px):** Môi trường sử dụng chính trong lúc xe nằm xưởng; yêu cầu đọc quét nhanh, nút bấm đủ lớn cho ngón cái, xem ảnh kiểm tra, và thao tác chuyển khoản ngân hàng không bị gián đoạn.
- **Máy tính bảng & Máy tính bàn (768px – 1440px):** Đặt lịch đa bước, quản lý nhiều xe cùng lúc, đối chiếu lịch sử bảo dưỡng dài hạn và in hóa đơn khổ A4 (`@media print`).
- **Ngôn ngữ & Bản địa hóa:** 100% tiếng Việt chuẩn xác, sử dụng tiền tệ VND (`1.450.000 ₫`) và định dạng ngày/giờ Việt Nam.

## Capabilities and Constraints

- **Nền tảng kỹ thuật:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Redux Toolkit, Socket.IO (`useNotificationSocket`) cho thông báo thời gian thực.
- **Luồng nghiệp vụ hiện hữu cần bảo toàn:** Toàn bộ hợp đồng REST API (`/api/public/*`, `/api/auth/*`, `/api/customer/*`, `/api/work-orders/*`, `/api/invoices/*`, `/api/payments/sepay/*`, `/api/notifications/*`), Redux slices, `CustomerAuthGuard`, `SessionWatcher`, SePay VietQR polling/return URL (`/customer/invoices?status=success`), tải PDF hóa đơn & biên bản bàn giao, và định dạng in A4.
- **Tương thích ngược điều hướng:** Bảo toàn khả năng chuyển hướng từ các URL cũ dạng `/customer/profile?tab=...`.

## Brand Commitments

- **Tên thương hiệu:** AutoCare Pro — Trung tâm Dịch vụ Kỹ thuật Ô tô (`Car Service Center`).
- **Giọng văn (Voice):** Concierge kỹ thuật tận tâm, minh bạch, tôn trọng thời gian của khách hàng; giải thích dễ hiểu, không lạm dụng thuật ngữ xưởng gây bối rối và không dùng ngôn từ quảng cáo phô trương.

## Evidence on Hand

- Danh mục dịch vụ và bảng giá thực từ `/api/public/categories` và `/api/public/services`.
- Dữ liệu thật từ hồ sơ khách hàng, danh sách xe, lịch hẹn, lệnh sửa chữa (Work Order), ảnh check-in/QC, báo giá, hóa đơn và giao dịch SePay.
- **Không bịa đặt số liệu marketing:** Không tự ý thêm số lượng khách hàng, tỷ lệ hài lòng hay chứng nhận không có nguồn xác thực từ API hoặc tài liệu sản phẩm.

## Product Principles

1. **Minh bạch thay vì phô trương:** Mọi con số tài chính, biển số xe, mã lệnh sửa chữa và mốc thời gian đều phải rõ ràng, thẳng hàng (`tabular-nums`) và dễ kiểm chứng.
2. **Ưu tiên thao tác một tay trên di động:** Các tác vụ cốt lõi (xem tiến độ, duyệt báo giá, quét/copy VietQR, đặt lịch) phải nằm trong tầm ngón cái và hoàn thành gọn trên màn hình nhỏ.
3. **An tâm trong lúc chờ đợi:** Giao diện điềm tĩnh, phân cấp thông tin rõ ràng giúp giảm lo âu của chủ xe khi giao tài sản có giá trị cao cho xưởng.
4. **Tính liên tục đa thiết bị:** Một trải nghiệm thống nhất từ điện thoại ngoài đường đến máy tính văn phòng và bản in giấy A4.

## Accessibility & Inclusion

- Độ tương phản nội dung văn bản đạt tối thiểu WCAG AA (`≥ 4.5:1` cho chữ thường, `≥ 3:1` cho tiêu đề lớn).
- Kích thước vùng chạm tối thiểu `44×44px` cho mọi nút bấm và mục điều hướng trên màn hình cảm ứng.
- Hỗ trợ bàn phím đầy đủ (`:focus-visible`) và tôn trọng thiết lập giảm chuyển động (`prefers-reduced-motion`).
