**Table of Contents**

[**Introduction**](_Toc109387551) [](_Toc109387551)[**3**](_Toc109387551)

[1.1](_Toc109387552) [](_Toc109387552)[Objectives](_Toc109387552) [](_Toc109387552)[3](_Toc109387552)

[1.2](_Toc109387553) [](_Toc109387553)[Team Members](_Toc109387553) [](_Toc109387553)[3](_Toc109387553)

[**2**](_Toc109387554) [](_Toc109387554)[**Scope**](_Toc109387554) [](_Toc109387554)[**3**](_Toc109387554)

[**3**](_Toc109387555) [](_Toc109387555)[**Assumptions / Risks**](_Toc109387555) [](_Toc109387555)[**4**](_Toc109387555)

[3.1](_Toc109387556) [](_Toc109387556)[Assumptions](_Toc109387556) [](_Toc109387556)[4](_Toc109387556)

[3.2](_Toc109387557) [](_Toc109387557)[Risks](_Toc109387557) [](_Toc109387557)[4](_Toc109387557)

[**4**](_Toc109387558) [](_Toc109387558)[**Test Approach**](_Toc109387558) [](_Toc109387558)[**4**](_Toc109387558)

[4.1](_Toc109387559) [](_Toc109387559)[Test Automation](_Toc109387559) [](_Toc109387559)[4](_Toc109387559)

[**5**](_Toc109387560) [](_Toc109387560)[**Test Environment**](_Toc109387560) [](_Toc109387560)[**5**](_Toc109387560)

[**6**](_Toc109387561) [](_Toc109387561)[**Milestones / Deliverables**](_Toc109387561) [](_Toc109387561)[**5**](_Toc109387561)

[6.1](_Toc109387562) [](_Toc109387562)[Test Schedule](_Toc109387562) [](_Toc109387562)[5](_Toc109387562)

[6.2](_Toc109387563) [](_Toc109387563)[Deliverables](_Toc109387563) [](_Toc109387563)[5](_Toc109387563)

  
**Introduction**

## Objectives

Dự án "Xây dựng Website đặt tour du lịch Vietravel" cung cấp nền tảng Web cho phép khách hàng tìm kiếm, xem thông tin và đặt tour du lịch trực tuyến. Hệ thống được xây dựng bằng Java Spring Boot với cơ sở dữ liệu MySQL. Đội ngũ kiểm thử chịu trách nhiệm kiểm tra sản phẩm và đảm bảo hệ thống đáp ứng đúng các yêu cầu đặc tả (Tìm kiếm tour, Booking, Thanh toán VNPay, Quản trị hệ thống). Mục tiêu quan trọng nhất của dự án là đảm bảo các chức năng cốt lõi (must-have) hoạt động chính xác.

## Team Members

|     |     |
| --- | --- |
| **Resource Name** | **Role** |
| Nguyễn Duy Cường | Developer / Tester |
| Lâm Văn Dỉ | Developer / Tester |
| Phan Đình Duẩn | Developer / Tester |
| Trác Ngọc Đăng Khoa | Developer / Tester |
| Nguyễn Thành Tin | Developer / Tester |

**Scope**

Phạm vi kiểm thử của đồ án sẽ bao gồm toàn bộ các yêu cầu chức năng nghiệp vụ trọng tâm đã được định nghĩa trong đặc tả. Khi hoàn thành giai đoạn lập trình, quá trình kiểm thử phải đảm bảo các tác nhân (Khách hàng, Nhân viên, Quản trị viên) thực hiện được các thao tác cốt lõi sau:

Tìm kiếm và xem thông tin chi tiết tour du lịch.

Thực hiện đặt tour (Booking) và hệ thống kiểm tra đúng số chỗ còn trống.

Thanh toán booking qua cổng giả lập VNPay Sandbox.

Gửi yêu cầu hủy tour và nhân viên có thể duyệt yêu cầu hủy.

Quản trị viên có thể quản lý tour, lịch khởi hành, booking, tin tức và người dùng.

Vì đây là một đồ án môn học với quy mô dữ liệu và lượng người dùng truy cập mô phỏng hạn chế, các loại hình kiểm thử phi chức năng phức tạp như kiểm thử chịu tải trọng lớn (Load testing) sẽ không nằm trong phạm vi của dự án này. Ngoài ra, việc phát triển ứng dụng di động hoặc tích hợp các cổng thanh toán thực tế (ngoài VNPay giả lập) cũng nằm ngoài phạm vi của đồ án.

  
**Assumptions / Risks**

## Giả định (Assumptions)

Phần này liệt kê các giả định được đặt ra cụ thể cho dự án này:

Việc bàn giao sản phẩm cho đội ngũ kiểm thử (test team) được định dạng sẵn sàng để triển khai lên môi trường QA.

Cổng thanh toán VNPay Sandbox hoạt động bình thường, không bị bảo trì trong thời gian kiểm thử.

## Risks

Các rủi ro sau đây đã được xác định và sẽ có hành động thích hợp để giảm thiểu tác động của chúng đối với dự án. Mức độ ảnh hưởng (severity) của rủi ro dựa trên việc dự án sẽ bị ảnh hưởng ra sao nếu rủi ro được kích hoạt. Dấu hiệu nhận biết (trigger) là các cột mốc hoặc sự kiện khiến rủi ro trở thành vấn đề cần giải quyết.

|     |     |     |     |     |
| --- | --- | --- | --- | --- |
| **#** | **Rủi ro (Risk)** | **Mức độ (Impact)** | **Dấu hiệu nhận biết (Trigger)** | **Kế hoạch giảm thiểu (Mitigation Plan)** |
| **1** | Phạm vi mở rộng (Scope Creep) – khi làm đồ án, nhóm có xu hướng muốn thêm nhiều tính năng mới ngoài thiết kế ban đầu | **Cao** | **Chậm trễ tiến độ báo cáo đồ án** | **Phạm vi dự án cần được chốt chặt chẽ từ giai đoạn phân tích theo đúng đặc tả của đồ án. Mọi thay đổi đều phải th****ảo luận nhóm và xin ý kiến Giảng viên hướng dẫn.** |
| **2** | **Thay đổi các chức năng ở phút chót làm vô hiệu hóa các bài kiểm thử đã viết** | **Cao – đối với lịch trình và chất lượng** | **Không sử dụng được các test case cũ** | **Hạn chế tối đa việc đổi spec trong giai đoạn code. Nếu bắt buộc có thay đổi, phải cập nhật tài liệu và tes****t case ngay lập tức.** |
| **3** | Môi trường Sandbox của VNPay bảo trì/không ổn định | **Trung bình** | **Tính năng thanh toán trực tuyến không test được** | **Chuẩn bị sẵn kịch bản thanh toán giả lập (mock) hoặc thay đổi trạng t****hái trực tiếp trong CSDL để có thể minh họa khi báo cáo đồ án.** |
| **4** | **Trễ tiến độ code dẫn đến không có đủ thời gian kiểm thử trước ngày nộp đồ án** | **Trung bình** | **Các module code không hoàn thành theo mốc thời gian** | **Phân bổ thời gian dự phòng (buffer). Các thành viên phát triển xong chức năng nào sẽ tiến hành kiểm** **thử chéo ngay chức năng đó.** |

**Test Approach**

Dự án được thực hiện theo mô hình Waterfall, phù hợp với tiến trình thực hiện một đồ án môn học. Do đó, quá trình kiểm thử hệ thống tổng thể sẽ diễn ra sau khi phần lớn các chức năng đã được lập trình xong.

Các thành viên trong nhóm sẽ luân phiên đóng vai trò là tester để tiến hành kiểm tra chéo (Cross-testing) các chức năng do thành viên khác phát triển, nhằm đảm bảo hệ thống đáp ứng đúng yêu cầu của đồ án.

## Manual Test

Hướng tiếp cận kiểm thử thủ công sẽ được thực hiện cụ thể như sau:

Các thành viên sẽ đóng vai trò là người dùng cuối (khách vãng lai, khách hàng) hoặc quản trị viên để thao tác trực tiếp trên giao diện Website (Black-box testing).

Dựa vào danh sách kịch bản kiểm thử (Test Cases) đã được duyệt, Tester sẽ tiến hành thực thi từng bước bằng tay. Quá trình chuẩn bị dữ liệu đầu vào (Input Data) sẽ áp dụng các kỹ thuật như **Phân vùng tương đương (Equivalence partitions****)** và **Phân tích giá trị biên (Boundary values****)** để có bộ dữ liệu tối ưu nhất.

Đánh giá trực tiếp phản hồi của hệ thống trên giao diện (UI), đồng thời kiểm tra trạng thái dữ liệu thay đổi dưới cơ sở dữ liệu (MySQL) để đảm bảo các luồng như Đặt tour (Booking) hay Hủy tour được xử lý chính xác.

So sánh kết quả thực tế (Actual Result) với kết quả mong đợi (Expected Result) và ghi nhận lại mọi điểm bất thường (Bug/Defect) vào báo cáo tổng kết lỗi.

## Kiểm thử hộp trắng (White-box Testing)

Bên cạnh kiểm thử hộp đen (thủ công), nhóm sẽ tiến hành **Kiểm thử hộp trắng** đối với các đơn vị mã nguồn (unit/hàm/phương thức) có logic nghiệp vụ phức tạp. Vì nhóm có 5 thành viên, số lượng đơn vị mã nguồn được chọn để kiểm thử ít nhất là **10 đơn vị** (2 x số sinh viên). Ưu tiên chọn các hàm/phương thức có nhiều nhánh điều kiện để đảm bảo số đường thi hành tuyến tính độc lập cơ bản đủ độ phức tạp (không quá ít). Đối với mỗi đơn vị mã nguồn được chọn, nhóm sẽ thực hiện đầy đủ các bước:

a. **Lập đồ thị dòng điều khiển cơ bản (Control Flow Graph).** 

b. **Tính toán số đường thi hành tuyến tính độc lập** dựa trên độ phức tạp Cyclomatic (Cyclomatic Complexity - V(G)).

c. **Thiết kế test cases** bao phủ cho từng đường thi hành đã xác định.

d. **Lập đồ thị dòng dữ liệu chung (Data Flow Graph).** 

e. **Kiểm thử vòng đời (đời sống) của từng biến** được sử dụng trong đơn vị mã nguồn đó.

  
**Test Environment**

Một máy chủ (server) mới được yêu cầu dành cho máy chủ web, ứng dụng (Java Spring Boot) và cơ sở dữ liệu (MySQL).

**Milestones / Deliverables**

## Test Schedule

The initial test schedule follows……….

|     |     |     |     |     |
| --- | --- | --- | --- | --- |
| **Tên công việc (Task Name)** | **Bắt đầu (Start)** | **Kết t****húc (Finish)** | **Nỗ lực (Effort)** | **Ghi chú (Comments)** |
| Lập kế hoạch kiểm thử (Test Planning) |     |     |     |     |
| &nbsp;  Xem xét tài liệu yêu cầu đồ án (Review Requirements documents) |     |     | 2 d |     |
| &nbsp;  Tạo ước lượng kiểm thử ban đầu (Create initial test estimates) |     |     | 1 d |     |
| Viết kịch bản kiểm thử (Write Test Cases) |     |     |     | Các thành viên chia nhau viết TC |
| Triển khai lên môi trường kiểm thử (Deploy to test environment) |     |     |     | Chạy local hoặc host tạm |
| Kiểm thử chức năng (Functional testing) |     |     |     |     |
| Kiểm thử hệ thống (System testing) |     |     |     |     |
| Sửa lỗi (Defect resolution) |     |     |     |     |
| Kiểm thử hồi quy (Regression testing) |     |     |     | Đảm bảo các lỗi đã được fix |
| Xử lý các lỗi cuối cùng và kiểm thử bản build cuối (Final build testing) |     |     |     |     |
| Đóng gói và viết báo cáo đồ án (Finalize and project reporting) |     |     |     | Chuẩn bị nộp cho Giảng viên |
| Báo cáo đồ án (Project Presentation) |     |     |     |     |

## Deliverables

|     |     |     |
| --- | --- | --- |
| **Sản phẩm bàn giao (Deliverable)** | **Dành cho (For)** | **Ngày / Cột mốc (Date / Milestone)** |
| Kế hoạch kiểm thử (Test Plan) | Project Manager; QA Director; Test Team |     |
| Ma trận truy xuất yêu cầu (Traceability Matrix) | Project Manager; QA Director |     |
| Kết quả kiểm thử (Test Results) | Project Manager |     |
| Báo cáo trạng thái kiểm thử (Test Status report) | QA Manager, QA Director |     |
| Các chỉ số đo lường (Metrics) | All team members |     |