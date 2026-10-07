## UC-44 – Thêm danh mục phụ tùng (Create Part Category)

| **Mã Use case**    | UC-44 |
| ------------------ | ------ |
| **Tên Use case**   | Thêm danh mục phụ tùng (Create Part Category) |
| **Mô tả**          | Quản lý dịch vụ tạo mới dữ liệu danh mục phụ tùng vào hệ thống để lưu trữ và quản lý. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Dữ liệu phụ tùng mới được lưu vào hệ thống và hiển thị trong danh sách.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được thêm. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình quản lý phụ tùng và chọn **Thêm mới**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin phụ tùng.<br>3. Quản lý dịch vụ nhập đầy đủ các thông tin bắt buộc và các thông tin tùy chọn khác.<br>4. Quản lý dịch vụ nhấn **Lưu** hoặc **Xác nhận**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu và đảm bảo không có sự trùng lặp (nếu có yêu cầu).<br>6. Hệ thống lưu dữ liệu danh mục phụ tùng mới, hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản lý dịch vụ chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu dữ liệu không hợp lệ, thiếu thông tin bắt buộc, hoặc vi phạm ràng buộc dữ liệu (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi chi tiết tại các trường tương ứng. Use case quay lại bước 3. |

---

---

## UC-45 – Xem danh mục phụ tùng (View Part Category)

| **Mã Use case**    | UC-45 |
| ------------------ | ------ |
| **Tên Use case**   | Xem danh mục phụ tùng (View Part Category) |
| **Mô tả**          | Quản lý dịch vụ tra cứu, tìm kiếm và xem chi tiết thông tin của danh mục phụ tùng đã có trong hệ thống. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Danh sách và chi tiết phụ tùng được hiển thị chính xác theo yêu cầu.<br>Thất bại: Hệ thống thông báo lỗi nếu không thể tải dữ liệu. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình quản lý phụ tùng.<br>2. Hệ thống tải và hiển thị danh sách phụ tùng hiện có.<br>3. Quản lý dịch vụ có thể nhập từ khóa vào ô tìm kiếm hoặc sử dụng các bộ lọc để thu hẹp kết quả.<br>4. Hệ thống cập nhật danh sách dựa trên tiêu chí tìm kiếm/lọc.<br>5. Quản lý dịch vụ chọn một bản ghi cụ thể trong danh sách.<br>6. Hệ thống hiển thị màn hình chi tiết của bản ghi đó với toàn bộ thông tin liên quan. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2 hoặc 4, nếu không có dữ liệu nào khớp với tiêu chí, hệ thống hiển thị thông báo "Không tìm thấy dữ liệu phù hợp".<br><br>Tại bước 6, nếu bản ghi không tồn tại hoặc quản lý dịch vụ không có quyền xem, hệ thống hiển thị thông báo lỗi từ chối truy cập. |

---

---

## UC-46 – Cập nhật danh mục phụ tùng (Update Part Category)

| **Mã Use case**    | UC-46 |
| ------------------ | ------ |
| **Tên Use case**   | Cập nhật danh mục phụ tùng (Update Part Category) |
| **Mô tả**          | Quản lý dịch vụ chỉnh sửa và cập nhật lại thông tin của danh mục phụ tùng hiện có trong hệ thống để đảm bảo dữ liệu luôn chính xác. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập, có quyền cập nhật và danh mục phụ tùng cần chỉnh sửa đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Thông tin mới của phụ tùng được lưu và cập nhật trong hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu được giữ nguyên trạng thái cũ. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình quản lý và mở chi tiết danh mục phụ tùng cần chỉnh sửa.<br>2. Quản lý dịch vụ chọn **Cập nhật** hoặc **Chỉnh sửa**.<br>3. Hệ thống hiển thị biểu mẫu với các thông tin hiện tại của bản ghi.<br>4. Quản lý dịch vụ thay đổi các trường thông tin cần thiết.<br>5. Quản lý dịch vụ nhấn **Lưu** hoặc **Xác nhận**.<br>6. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.<br>7. Hệ thống lưu thay đổi, hiển thị thông báo cập nhật thành công và hiển thị lại thông tin đã được làm mới. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản lý dịch vụ chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 6, nếu dữ liệu không hợp lệ hoặc vi phạm ràng buộc hệ thống (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi tương ứng và yêu cầu chỉnh sửa lại. Use case quay lại bước 4.<br><br>Tại bước 7, nếu bản ghi đã bị người dùng khác thay đổi (conflict) hoặc xóa trước đó, hệ thống thông báo lỗi đồng bộ dữ liệu. |

---

---

## UC-47 – Xóa danh mục phụ tùng (Delete Part Category)

| **Mã Use case**    | UC-47 |
| ------------------ | ------ |
| **Tên Use case**   | Xóa danh mục phụ tùng (Delete Part Category) |
| **Mô tả**          | Quản lý dịch vụ thực hiện xóa hoặc vô hiệu hóa danh mục phụ tùng khỏi hệ thống khi không còn nhu cầu sử dụng hoặc lưu trữ. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập, có quyền xóa và danh mục phụ tùng cần xử lý đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Bản ghi phụ tùng bị vô hiệu hóa hoặc xóa thành công khỏi hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, bản ghi được giữ nguyên. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình quản lý và chọn danh mục phụ tùng cần xử lý.<br>2. Quản lý dịch vụ chọn hành động **Xóa** hoặc **Hủy**.<br>3. Hệ thống hiển thị hộp thoại cảnh báo và yêu cầu xác nhận thao tác.<br>4. Quản lý dịch vụ nhấn **Xác nhận**.<br>5. Hệ thống kiểm tra các ràng buộc dữ liệu liên quan đến bản ghi (ví dụ: dữ liệu có đang được sử dụng ở chức năng khác không).<br>6. Hệ thống thực hiện xóa mềm (chuyển trạng thái sang Ngừng hoạt động/Đã hủy) hoặc xóa cứng bản ghi tùy theo quy định.<br>7. Hệ thống hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại bước 3, quản lý dịch vụ chọn **Hủy**:<br>3a. Hệ thống đóng hộp thoại cảnh báo và hủy bỏ thao tác xóa, giữ nguyên dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu bản ghi đang có ràng buộc dữ liệu với các nghiệp vụ khác (ví dụ: đã phát sinh giao dịch, hóa đơn), hệ thống từ chối xóa và hiển thị thông báo lỗi giải thích lý do không thể xóa. |

---

---

## UC-48 – Thêm phụ tùng (Create Inventory Item)

| **Mã Use case**    | UC-48 |
| ------------------ | ------ |
| **Tên Use case**   | Thêm phụ tùng (Create Inventory Item) |
| **Mô tả**          | Quản lý dịch vụ tạo mới dữ liệu phụ tùng thực tế (Variant/SKU) theo từng hãng vào hệ thống để theo dõi tồn kho và định giá. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. Danh mục phụ tùng tương ứng phải tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Dữ liệu phụ tùng mới được lưu vào hệ thống và hiển thị trong danh sách.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được thêm. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình kho phụ tùng và chọn hành động **Thêm phụ tùng**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin chi tiết cho phụ tùng.<br>3. Quản lý dịch vụ chọn danh mục phụ tùng, chọn thương hiệu, điền mã SKU, giá bán dự kiến và mức cảnh báo tồn kho an toàn.<br>4. Quản lý dịch vụ nhấn **Lưu lại**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu (không được bỏ trống các trường bắt buộc, mã SKU phải là duy nhất).<br>6. Hệ thống tiến hành lưu dữ liệu, hiển thị thông báo thành công và cập nhật danh sách hiển thị. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản lý dịch vụ chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình danh sách mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu mã SKU đã tồn tại hoặc thiếu các trường thông tin bắt buộc, hệ thống hiển thị thông báo lỗi chi tiết tại các trường tương ứng. Use case quay lại bước 3. |

---

---

## UC-49 – Xem phụ tùng (View Inventory Item)

| **Mã Use case**    | UC-49 |
| ------------------ | ------ |
| **Tên Use case**   | Xem phụ tùng (View Inventory Item) |
| **Mô tả**          | Quản lý dịch vụ tra cứu, tìm kiếm và xem chi tiết thông tin, giá bán, cùng số lượng tồn kho của các mã phụ tùng đã có trong hệ thống. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Danh sách và thông tin chi tiết của phụ tùng được hiển thị chính xác theo yêu cầu.<br>Thất bại: Hệ thống thông báo lỗi nếu không thể tải dữ liệu. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình quản lý kho phụ tùng.<br>2. Hệ thống tải và hiển thị danh sách các mã phụ tùng hiện có.<br>3. Quản lý dịch vụ nhập từ khóa vào ô tìm kiếm hoặc sử dụng các bộ lọc (như phân loại, danh mục, trạng thái tồn kho) để thu hẹp kết quả.<br>4. Hệ thống cập nhật danh sách dựa trên các tiêu chí tìm kiếm/lọc tương ứng.<br>5. Quản lý dịch vụ chọn một bản ghi cụ thể để xem thêm thông tin chi tiết. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2 hoặc 4, nếu không có dữ liệu nào khớp với tiêu chí tìm kiếm, hệ thống hiển thị thông báo "Không có dữ liệu". |

---

---

## UC-50 – Cập nhật phụ tùng (Update Inventory Item)

| **Mã Use case**    | UC-50 |
| ------------------ | ------ |
| **Tên Use case**   | Cập nhật phụ tùng (Update Inventory Item) |
| **Mô tả**          | Quản lý dịch vụ chỉnh sửa và cập nhật lại thông tin của một mã phụ tùng hiện có trong hệ thống (như giá bán, mức tồn kho cảnh báo) để đảm bảo dữ liệu luôn chính xác. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập, có quyền cập nhật và bản ghi phụ tùng cần chỉnh sửa đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Thông tin mới của phụ tùng được cập nhật và lưu trữ trong hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu được giữ nguyên trạng thái cũ. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập danh sách kho phụ tùng và chọn hành động **Chỉnh sửa** trên bản ghi phụ tùng mong muốn.<br>2. Hệ thống hiển thị biểu mẫu cập nhật với các thông tin hiện tại của bản ghi (mã SKU không cho phép chỉnh sửa).<br>3. Quản lý dịch vụ thay đổi các trường thông tin cần thiết như giá bán, thương hiệu, mức cảnh báo tồn kho.<br>4. Quản lý dịch vụ nhấn **Lưu lại**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới nhập.<br>6. Hệ thống tiến hành lưu các thay đổi, hiển thị thông báo cập nhật thành công và làm mới danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản lý dịch vụ chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình danh sách mà không lưu thay đổi. |
| **Luồng ngoại lệ** | Tại bước 5, nếu dữ liệu không hợp lệ hoặc thiếu thông tin bắt buộc, hệ thống hiển thị thông báo lỗi chi tiết. Use case quay lại bước 3.<br><br>Tại bước 6, nếu bản ghi đã bị vô hiệu hóa hoặc thay đổi bởi phiên làm việc khác, hệ thống thông báo lỗi xung đột dữ liệu. |

---

---

## UC-51 – Xóa phụ tùng (Delete/Deactivate Inventory Item)

| **Mã Use case**    | UC-51 |
| ------------------ | ------ |
| **Tên Use case**   | Xóa phụ tùng (Delete/Deactivate Inventory Item) |
| **Mô tả**          | Quản lý dịch vụ thực hiện thay đổi trạng thái hoạt động (ngừng kinh doanh hoặc kích hoạt lại) đối với một bản ghi phụ tùng khi không còn nhu cầu kinh doanh mã hàng này. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập, có quyền xóa/thay đổi trạng thái và bản ghi phụ tùng cần xử lý đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Trạng thái của bản ghi phụ tùng được cập nhật thành công (Ngừng hoạt động hoặc Đang hoạt động).<br>Thất bại: Hệ thống thông báo lỗi, trạng thái bản ghi được giữ nguyên. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập danh sách kho phụ tùng và xác định bản ghi cần xử lý.<br>2. Quản lý dịch vụ chọn hành động **Ngừng kinh doanh** (hoặc Kích hoạt lại).<br>3. Hệ thống hiển thị hộp thoại cảnh báo và yêu cầu xác nhận thao tác.<br>4. Quản lý dịch vụ nhấn **Đồng ý** xác nhận.<br>5. Hệ thống kiểm tra các điều kiện (nếu có) và cập nhật trạng thái hoạt động của mã phụ tùng.<br>6. Hệ thống hiển thị thông báo thao tác thành công và cập nhật lại danh sách hiển thị. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại bước 3, quản lý dịch vụ chọn **Hủy**:<br>Hệ thống đóng hộp thoại cảnh báo và hủy bỏ thao tác, giữ nguyên trạng thái dữ liệu. |
| **Luồng ngoại lệ** | Không có. |

---