import { RetrievedKnowledge } from './rag-retriever.service';

export interface WorkOrderContextInput {
  workOrderNumber: string;
  vehicle: {
    make: string;
    model: string;
    year?: number | null;
    size: string;
    licensePlate: string;
    mileage?: number | null;
    fuelLevel?: string | null;
  };
  customerComplaint?: string | null;
  exteriorCondition?: string | null;
  existingServices?: Array<{
    id: number;
    name: string;
    category?: string;
    status: string;
    existingJobs?: Array<{ id: number; name: string }>;
  }>;
  requestedServices?: Array<{ name: string; category?: string }>;
  findings: Array<{
    id: number;
    marker_type: string;
    part_name?: string | null;
    severity: string;
    description: string;
    recommendation?: string | null;
  }>;
  targetService?: {
    id: number;
    name: string;
    category?: string;
    status: string;
    existingJobs?: Array<{ id: number; name: string }>;
  } | null;
}

export class RagPromptBuilder {
  /**
   * Tạo System Prompt đóng vai trò Master Automotive Service Director
   */
  buildSystemPrompt(): string {
    return `Bạn là Giám đốc Dịch vụ Kỹ thuật Ô tô (Chief Automotive Service Director) chuyên nghiệp tại Car Service Center.
Nhiệm vụ của bạn là phân tích thông tin xe, CÁC HẠNG MỤC DỊCH VỤ ĐÃ CÓ TRÊN PHIẾU, YÊU CẦU DỊCH VỤ CỦA KHÁCH HÀNG, tình trạng ngoại quan và danh sách các vết hư hỏng khi kiểm tra xe (Findings) để thiết lập danh sách các CÔNG VIỆC CON (Jobs) cho các Hạng mục:

QUY TẮC BẮT BUỘC (GROUNDING RULES):
0. YÊU CẦU ĐẶC BIỆT KHI CÓ HẠNG MỤC MỤC TIÊU (TARGET SERVICE): Nếu trong yêu cầu có chỉ định [HẠNG MỤC DỊCH VỤ MỤC TIÊU DUY NHẤT], bạn BẮT BUỘC CHỈ ĐỀ XUẤT các công việc con (jobs) cho RIÊNG hạng mục đó. Trong suggested_services chỉ trả về đúng 1 phần tử với service_id và service_name của hạng mục được chỉ định. TUYỆT ĐỐI KHÔNG đề xuất thêm hạng mục nào khác!

1. CHỈ ĐỀ XUẤT CHO HẠNG MỤC Ở TRẠNG THÁI "CHỜ XỬ LÝ" (PENDING ONLY):
   - Bạn CHỈ ĐƯỢC PHÉP đề xuất công việc con cho các hạng mục dịch vụ đang ở trạng thái "Chờ xử lý" (PENDING).
   - TUYỆT ĐỐI KHÔNG sinh công việc cho các hạng mục đã ở trạng thái "Đang thực hiện" (IN_PROGRESS) hoặc "Đã hoàn thành" (COMPLETED) vì các hạng mục này đã được triển khai trên thực tế.

2. ĐÁNH GIÁ SỰ PHÙ HỢP & ĐẦY ĐỦ CỦA CÔNG VIỆC (STOP GENERATING IF SUITABLE & SUFFICIENT - CỰC KỲ QUAN TRỌNG):
   - Với mỗi hạng mục, bạn PHẢI phân tích kỹ danh sách các công việc đã có sẵn trong hạng mục đó.
   - NẾU các công việc đã có ĐÃ ĐẦY ĐỦ, HỢP LÝ và PHÙ HỢP với quy trình kỹ thuật sửa chữa/bảo dưỡng cho hạng mục này (ví dụ: đã có đủ bước kiểm tra/chẩn đoán, tháo lắp thay thế linh kiện, căn chỉnh hoặc kiểm tra hoàn thiện cần thiết), HOẶC không còn bước kỹ thuật trọng yếu nào bị thiếu:
     => BẠN BẮT BUỘC TRẢ VỀ mảng "jobs": [] (MẢNG RỖNG) cho hạng mục đó!
     => TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ Ý BỊA THÊM các công việc dư thừa, thao tác phụ, kiểm tra vu vơ không cần thiết!
     => Trong phần "summary", nêu rõ: "Các công việc hiện tại của hạng mục đã phù hợp và đầy đủ theo quy chuẩn kỹ thuật, không cần bổ sung thêm."
   - CHỈ đề xuất thêm công việc MỚI khi và chỉ khi quy trình kỹ thuật đang THỰC SỰ THIẾU một bước cốt lõi chưa từng xuất hiện.

3. NGUYÊN TẮC CHỐNG TRÙNG LẶP / CHỒNG CHÉO CÔNG VIỆC (ANTI-DUPLICATION RULES):
   a) TUYỆT ĐỐI KHÔNG ĐỀ XUẤT LẠI bất kỳ công việc nào ĐÃ CÓ trong danh sách công việc hiện có của hạng mục đó.
   b) Không đề xuất 2 công việc có tên hoặc nội dung kỹ thuật tương tự/trùng lặp nhau trong cùng một danh sách.
   c) Giữ nguyên "service_id" và chính xác "service_name" của hạng mục đã có trên phiếu.

4. HẠNG MỤC SỬA CHỮA LỖI (Repair Category): Chỉ tạo Hạng mục sửa chữa mới cho một lỗi (Finding) nếu lỗi đó CHƯA ĐƯỢC GIẢI QUYẾT bởi các Hạng mục đã có. Mỗi lỗi cần giải quyết sẽ là một hạng mục (ví dụ: "Khắc phục lỗi: [Tên lỗi]"), gán đúng finding_id. Bên trong là danh sách công việc con kỹ thuật chuẩn xác.
5. TUYỆT ĐỐI CẤM TỰ Ý BỊA RA GÓI "Bảo dưỡng định kỳ" nếu khách hàng KHÔNG yêu cầu bảo dưỡng! Chỉ được tạo hạng mục bảo dưỡng định kỳ nếu trong [DỊCH VỤ KHÁCH HÀNG YÊU CẦU] hoặc [Triệu chứng khách khai] có ghi rõ yêu cầu bảo dưỡng.
6. CHỈ ĐƯỢC CHỌN \`job_type_id\` từ danh mục [DANH MỤC JOB TYPE HỢP LỆ]. Tuyệt đối không tự bịa ID ngoài danh sách.
7. Liên kết Finding: Nếu Job giải quyết lỗi nào, phải có \`matched_finding_ids\` chứa ID của Finding đó.
8. Thời gian ước tính (\`estimated_hours\`): Phải thực tế theo định mức sửa chữa xe (từ 0.2 giờ đến 4.0 giờ cho mỗi đầu việc).
9. Gợi ý phụ tùng: Chỉ gợi ý các phụ tùng có trong [DANH MỤC PHỤ TÙNG CÓ SẴN TRONG KHO].
10. TỰ ĐỘNG PHÂN CÔNG KỸ THUẬT VIÊN (INTELLIGENT TECHNICIAN DISPATCHING):
   Với MỖI công việc con (Job), bạn BẮT BUỘC chỉ định một kỹ thuật viên tối ưu nhất từ [DANH SÁCH KỸ THUẬT VIÊN & TẢI VIỆC HIỆN TẠI] dựa theo 4 nguyên tắc vận hành:
   a) Phù hợp chuyên môn (Skill Match): Kỹ năng của KTV phải khớp với loại công việc (ví dụ: Job Gò hàn/Sơn -> Thợ Đồng Sơn; Job Phanh/Gầm/Máy -> Thợ Gầm Máy; Bảo dưỡng -> Thợ Bảo dưỡng nhanh).
   b) Cân bằng tải & Công bằng (Workload Balancing): Ưu tiên KTV có tổng giờ làm hôm nay (today_assigned_hours) và số job đang làm thấp hơn để khối lượng công việc được chia đều.
   c) Tránh chồng chéo (Availability): Không giao thêm việc nặng cho KTV đang OVERLOADED hoặc có quá nhiều việc đang chạy.
   d) Tính liên tục: Các công việc trên cùng một chiếc xe nên ưu tiên gom cho cùng 1 KTV nếu người đó có đủ chuyên môn và còn thời gian khả dụng.
   Điền đầy đủ: assigned_technician_id (bắt buộc đúng ID), assigned_technician_name, assignment_reason (lý do phân công súc tích), match_score (điểm phù hợp từ 70 đến 100).
11. Trả về đúng định dạng JSON Schema được chỉ định.`;
  }

  /**
   * Tổng hợp User Prompt kết hợp RAG Knowledge
   */
  buildUserPrompt(context: WorkOrderContextInput, knowledge: RetrievedKnowledge): string {
    // Phân loại các hạng mục PENDING và NON-PENDING
    const pendingServices = (context.existingServices || []).filter((s) => s.status === 'PENDING');
    const nonPendingServices = (context.existingServices || []).filter((s) => s.status !== 'PENDING');

    const pendingServicesStr =
      pendingServices.length > 0
        ? pendingServices
            .map((s) => {
              const jobsInfo =
                s.existingJobs && s.existingJobs.length > 0
                  ? `\n  + Các việc đã có sẵn (${s.existingJobs.length} việc): ${s.existingJobs.map((j) => `"${j.name}"`).join(', ')}`
                  : '\n  + Hiện chưa có công việc con nào.';
              return `- [Service ID: ${s.id}] "${s.name}"${s.category ? ` (Nhóm: ${s.category})` : ''} [Trạng thái: Chờ xử lý]${jobsInfo}`;
            })
            .join('\n')
        : 'Không có hạng mục nào ở trạng thái Chờ xử lý.';

    const nonPendingServicesStr =
      nonPendingServices.length > 0
        ? nonPendingServices
            .map((s) => {
              const statusLabel =
                s.status === 'IN_PROGRESS'
                  ? 'Đang thực hiện'
                  : s.status === 'COMPLETED'
                  ? 'Đã hoàn thành'
                  : s.status;
              return `- [Service ID: ${s.id}] "${s.name}" [Trạng thái: ${statusLabel}] (CẤM SINH JOB MỚI CHO HẠNG MỤC NÀY)`;
            })
            .join('\n')
        : '';

    const requestedServicesStr =
      context.requestedServices && context.requestedServices.length > 0
        ? context.requestedServices
            .map((s) => `- ${s.name}${s.category ? ` (Danh mục: ${s.category})` : ''}`)
            .join('\n')
        : 'Khách hàng không yêu cầu gói dịch vụ trước, chủ yếu kiểm tra và xử lý theo tình trạng thực tế.';

    const findingsStr =
      context.findings.length > 0
        ? context.findings
            .map(
              (f) =>
                `- [Finding ID: ${f.id}] Loại: ${f.marker_type} | Vị trí: ${f.part_name || 'Bộ phận xe'} | Mức độ: ${f.severity} | Mô tả: "${f.description}" | Kiến nghị: "${f.recommendation || 'Kiểm tra xử lý'}"`
            )
            .join('\n')
        : 'Không có finding nào được ghi nhận từ kiểm tra xe.';

    const jobTypesStr = knowledge.jobTypes
      .map((jt) => `- ID ${jt.id}: ${jt.name}`)
      .join('\n');

    const jobTemplatesStr = knowledge.jobTemplates
      .slice(0, 15)
      .map((jt) => `- [JobType ${jt.job_type_id}] ${jt.name} (Định mức: ${jt.estimated_hours || 1}h)`)
      .join('\n');

    const partsStr =
      knowledge.matchingPartCategories.length > 0
        ? knowledge.matchingPartCategories
            .map(
              (p) =>
                `- [PartCategory ID: ${p.id}] ${p.name} (ĐVT: ${p.uom}) - Các hãng có sẵn: ${p.variants.map((v) => `${v.brand_name || 'OEM'} (Tồn: ${v.on_hand})`).join(', ') || 'Đang cập nhật'}`
            )
            .join('\n')
        : 'Không tìm thấy phụ tùng tồn kho khớp từ khóa.';

    const historicalStr =
      knowledge.historicalCases.length > 0
        ? knowledge.historicalCases
            .map(
              (h, i) =>
                `Ca #${i + 1} (${h.work_order_number}):\n  Khách báo: "${h.complaint || 'Bảo dưỡng'}"\n  Lỗi: ${h.findings.join('; ') || 'Không có'}\n  Công việc đã làm: ${h.jobs.join('; ')}`
            )
            .join('\n\n')
        : 'Chưa có tiền lệ tương tự.';

    const techniciansStr =
      knowledge.technicians && knowledge.technicians.length > 0
        ? knowledge.technicians
            .map(
              (t) =>
                `- [KTV ID: ${t.id}] Họ tên: "${t.full_name}" | Kỹ năng: [${t.skills.join(', ') || 'Kỹ thuật tổng hợp'}] | Tải việc hôm nay: ${t.today_assigned_hours}h | Job đang làm: ${t.active_jobs_count} | Trạng thái: ${t.status}`
            )
            .join('\n')
        : 'Hiện không có thông tin kỹ thuật viên khả dụng.';

    const targetExistingJobsStr =
      context.targetService?.existingJobs && context.targetService.existingJobs.length > 0
        ? context.targetService.existingJobs.map((j, idx) => `  ${idx + 1}. "${j.name}"`).join('\n')
        : '  (Hạng mục này hiện chưa có công việc con nào)';

    const targetServiceBlock = context.targetService
      ? `\n### *** [YÊU CẦU ĐẶC BIỆT: CHỈ ĐỀ XUẤT CHO DUY NHẤT 1 HẠNG MỤC NÀY] ***
Bạn ĐANG ĐƯỢC YÊU CẦU ĐÁNH GIÁ VÀ ĐỀ XUẤT CÔNG VIỆC CHO RIÊNG HẠNG MỤC SAU:
- ID Hạng mục (service_id): ${context.targetService.id}
- Tên Hạng mục (service_name): "${context.targetService.name}"
- Trạng thái: ${context.targetService.status === 'PENDING' ? 'Chờ xử lý (PENDING)' : context.targetService.status}
${context.targetService.category ? `- Danh mục liên quan: "${context.targetService.category}"` : ''}

- DANH SÁCH CÁC CÔNG VIỆC ĐÃ CÓ SẴN TRONG HẠNG MỤC NÀY:
${targetExistingJobsStr}

=> QUY TẮC ĐÁNH GIÁ VÀ DỪNG ĐỀ XUẤT (COMPLETION & SUITABILITY EVALUATION - BẮT BUỘC):
1. Hãy phân tích kỹ các công việc đã có sẵn ở trên:
   - NẾU các công việc đã có ĐÃ PHÙ HỢP và ĐÃ ĐỦ để hoàn thành dịch vụ "${context.targetService.name}" (ví dụ: đã có đủ công việc chẩn đoán lỗi, tháo lắp thay thế linh kiện hỏng, hoặc bảo dưỡng các chi tiết chính):
     => BẠN BẮT BUỘC TRẢ VỀ "jobs": [] (MẢNG RỖNG trong suggested_services)!
     => TUYỆT ĐỐI KHÔNG CỐ TÌNH BỊA THÊM bất kỳ công việc nào nữa!
     => Trong "summary", ghi rõ: "Các công việc hiện tại của hạng mục '${context.targetService.name}' đã đầy đủ và phù hợp với tiêu chuẩn kỹ thuật, không cần bổ sung thêm."
2. CHỈ KHI NÀO quy trình kỹ thuật đang THỰC SỰ THIẾU bước then chốt bắt buộc chưa ai làm, bạn mới đề xuất thêm bước còn thiếu đó.
3. TUYỆT ĐỐI KHÔNG đề xuất lại bất kỳ công việc nào có tên trùng hoặc nội dung tương tự với các việc đã có ở trên.
4. Mảng "suggested_services" BẮT BUỘC CHỈ CHỨA DUY NHẤT 1 PHẦN TỬ với "service_id": ${context.targetService.id} và "service_name": "${context.targetService.name}". TUYỆT ĐỐI KHÔNG TẠO THÊM HẠNG MỤC NÀO KHÁC.\n`
      : '';

    return `### THÔNG TIN XE & TIẾP NHẬN HIỆN TẠI:
- Số phiếu: ${context.workOrderNumber}
- Xe: ${context.vehicle.make} ${context.vehicle.model} (${context.vehicle.year || 'N/A'}) | Phân khúc: ${context.vehicle.size} | Biển số: ${context.vehicle.licensePlate}
- ODO (Số km): ${context.vehicle.mileage ? `${context.vehicle.mileage} km` : 'Không xác định'} | Nhiên liệu: ${context.vehicle.fuelLevel || 'Không rõ'}
- Triệu chứng khách khai: "${context.customerComplaint || 'Không có yêu cầu đặc biệt'}"
- Ghi chú ngoại quan của Cố vấn: "${context.exteriorCondition || 'Bình thường'}"
${targetServiceBlock}
### [DANH SÁCH HẠNG MỤC Ở TRẠNG THÁI 'CHỜ XỬ LÝ' (PENDING) - ĐỐI TƯỢNG ĐỀ XUẤT]:
${pendingServicesStr}
*(CHÚ Ý QUAN TRỌNG: Bạn chỉ được phép đề xuất công việc con vào các Hạng mục ở trạng thái Chờ xử lý ở trên. NẾU một hạng mục đã có sẵn các công việc phù hợp và đầy đủ, bạn BẮT BUỘC trả về mảng "jobs": [] cho hạng mục đó, TUYỆT ĐỐI KHÔNG cố tình sinh thêm việc!)*

${nonPendingServicesStr ? `### [CÁC HẠNG MỤC ĐANG THỰC HIỆN HOẶC ĐÃ HOÀN THÀNH - CHỈ ĐỂ THAM KHẢO]:\n${nonPendingServicesStr}\n*(CẤM SINH BẤT KỲ CÔNG VIỆC NÀO CHO CÁC HẠNG MỤC NÀY!)*\n` : ''}
### [ƯU TIÊN] DỊCH VỤ KHÁCH HÀNG YÊU CẦU LÚC TIẾP NHẬN XE:
${requestedServicesStr}

### [ƯU TIÊN] CÁC LỖI PHÁT HIỆN TẠI XE (FINDINGS):
${findingsStr}

### [RAG KNOWLEDGE 1] DANH MỤC JOB TYPE HỢP LỆ (BẮT BUỘC DÙNG ID NÀY):
${jobTypesStr}

### [RAG KNOWLEDGE 2] MẪU CÔNG VIỆC THAM KHẢO CỦA XƯỞNG:
${jobTemplatesStr}

### [RAG KNOWLEDGE 3] DANH MỤC PHỤ TÙNG CÓ SẴN TRONG KHO:
${partsStr}

### [RAG KNOWLEDGE 4] TIỀN LỆ SỬA CHỮA TƯƠNG TỰ TRONG QUÁ KHỨ:
${historicalStr}

### [RAG KNOWLEDGE 5] DANH SÁCH KỸ THUẬT VIÊN & TẢI CÔNG VIỆC HIỆN TẠI (ĐỂ PHÂN CÔNG):
${techniciansStr}

Hãy phân tích và trả về kế hoạch công việc dưới dạng JSON gồm:
- summary: Tóm tắt tình trạng và nhận xét về tính đầy đủ của các hạng mục công việc
- risk_assessment: Đánh giá rủi ro an toàn vận hành
- suggested_services: Mảng các Hạng mục dịch vụ & sửa chữa (chỉ thuộc trạng thái PENDING hoặc sửa chữa Finding mới).
  Mỗi hạng mục gồm:
  + service_id: ID của dịch vụ PENDING đã có trên phiếu, hoặc null nếu là hạng mục mới tạo riêng cho Finding
  + service_name: Tên hạng mục (nếu có service_id thì PHẢI GIỮ NGUYÊN chính xác tên của dịch vụ đã có đó)
  + category_type: Loại hạng mục ("REPAIR" nếu dùng để giải quyết 1 lỗi Finding mới, "OTHER" nếu là dịch vụ có sẵn hoặc dịch vụ theo yêu cầu của khách, "MAINTENANCE" nếu là bảo dưỡng)
  + finding_id: ID của Finding nếu là hạng mục sửa chữa lỗi đó (hoặc null nếu là dịch vụ có sẵn)
  + jobs: Mảng các công việc con mới cần bổ sung (TRẢ VỀ MẢNG RỖNG [] NẾU HẠNG MỤC ĐÃ ĐẦY ĐỦ CÔNG VIỆC PHÙ HỢP). Mỗi job gồm:
    * name: Tên công việc con cụ thể (ví dụ: "Kiểm tra bố thắng và đĩa phanh 4 bánh")
    * description: Thao tác kỹ thuật chi tiết
    * job_type_id: ID loại công việc (phải có trong RAG Knowledge 1)
    * estimated_hours: Giờ công định mức (số thực, ví dụ: 0.8, 1.2)
    * severity: Mức độ ưu tiên ("LOW" | "MEDIUM" | "HIGH" | "CRITICAL")
    * matched_finding_ids: Mảng chứa ID Finding mà job này giải quyết
    * suggested_part_category_ids: Mảng chứa các PartCategory ID cần dùng
    * assigned_technician_id: ID của kỹ thuật viên được chọn (phải lấy từ [RAG KNOWLEDGE 5], tối ưu theo kỹ năng và tải việc)
    * assigned_technician_name: Họ tên kỹ thuật viên được phân công
    * assignment_reason: Lý do ngắn gọn phân công cho KTV này
    * match_score: Điểm phù hợp (từ 70 đến 100)`;
  }
}
