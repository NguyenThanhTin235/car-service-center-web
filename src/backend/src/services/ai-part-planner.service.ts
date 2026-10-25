import prisma from '../utils/prisma';
import { executeWithGeminiFailover } from '../utils/ai-client.util';

export interface AIPartSuggestionItem {
  item_id: number;
  sku: string;
  part_name: string;
  brand_name?: string | null;
  category_name?: string | null;
  suggested_quantity: number;
  uom: string;
  unit_price: number;
  on_hand: number;
  is_in_stock: boolean;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
}

export interface AIPartSuggestionResponseData {
  work_order_id: number;
  work_order_number: string;
  job_id: number;
  job_name: string;
  service_name: string;
  vehicle_summary: string;
  technical_advice: string;
  suggestions: AIPartSuggestionItem[];
}

interface RawPartSuggestionJSON {
  technical_advice?: string;
  suggestions?: Array<{
    item_id?: number;
    sku?: string;
    part_name?: string;
    suggested_quantity?: number;
    confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
    reason?: string;
  }>;
}

// Bộ nhớ đệm In-Memory Cache (TTL: 15 phút) để phản hồi siêu tốc (< 2ms) cho các lượt truy vấn lặp lại
interface CachedPartSuggestion {
  data: AIPartSuggestionResponseData;
  expiresAt: number;
}
const partSuggestionsCache = new Map<string, CachedPartSuggestion>();

export class AiPartPlannerService {
  /**
   * Sinh danh sách phụ tùng đề xuất cho một công việc cụ thể bằng RAG
   * @param forceRefresh Ép buộc bỏ qua cache và tạo lại gợi ý mới
   */
  async suggestPartsForJob(workOrderId: number, jobId: number, forceRefresh = false): Promise<AIPartSuggestionResponseData> {
    const cacheKey = `${workOrderId}:${jobId}`;

    // 0. Kiểm tra Cache để trả lời ngay lập tức (1ms)
    if (!forceRefresh && partSuggestionsCache.has(cacheKey)) {
      const cached = partSuggestionsCache.get(cacheKey)!;
      if (Date.now() < cached.expiresAt) {
        return cached.data;
      }
      partSuggestionsCache.delete(cacheKey);
    }

    // 1. Truy vấn Work Order, Vehicle, CheckIn, Inspections
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        vehicle: true,
        check_in: true,
        inspections: {
          include: {
            findings: true,
          },
        },
        services: {
          include: {
            service: true,
            jobs: {
              include: {
                job_type: true,
                job_template: true,
                findings: {
                  include: {
                    finding: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!workOrder) {
      throw new Error(`Không tìm thấy phiếu công việc với ID: ${workOrderId}`);
    }

    // Tìm Job mục tiêu
    let targetJob: any = null;
    let targetService: any = null;

    for (const service of workOrder.services) {
      const foundJob = service.jobs.find((j) => j.id === jobId);
      if (foundJob) {
        targetJob = foundJob;
        targetService = service;
        break;
      }
    }

    if (!targetJob) {
      throw new Error(`Không tìm thấy công việc với ID: ${jobId} trong phiếu công việc ${workOrder.wo_number}`);
    }

    const vehicleInfo = `${workOrder.vehicle.make} ${workOrder.vehicle.model} (${workOrder.vehicle.year || 'N/A'}), Phân khúc: ${workOrder.vehicle.vehicle_size}`;

    // 2. Thu thập Findings liên quan tới Job này
    const linkedFindings = (targetJob.findings || []).map((jf: any) => jf.finding).filter(Boolean);
    const allFindings = workOrder.inspections.flatMap((insp) => insp.findings);

    // 3. Truy xuất RAG Nguồn 1: Định mức chuẩn của Xưởng (JobTemplatePart)
    let templateParts: any[] = [];
    if (targetJob.job_template_id) {
      const templateRecord = await prisma.jobTemplate.findUnique({
        where: { id: targetJob.job_template_id },
        include: {
          parts: {
            include: {
              item: {
                include: {
                  part_category: { include: { uom: true } },
                  brand: true,
                },
              },
            },
          },
        },
      });

      if (templateRecord && templateRecord.parts.length > 0) {
        templateParts = templateRecord.parts.map((p) => ({
          item_id: p.item.id,
          sku: p.item.sku,
          name: p.item.part_category?.name || p.item.sku,
          brand: p.item.brand?.name || 'OEM',
          uom: p.item.part_category?.uom?.name || 'Cái',
          default_quantity: Number(p.default_quantity) || 1,
          selling_price: Number(p.item.selling_price) || 0,
          on_hand: p.item.on_hand ?? 0,
        }));
      }
    }

    // FAST-PATH: Nếu xưởng đã cấu hình sẵn định mức chuẩn (JobTemplatePart) cho công việc này
    // => Trả về kết quả ngay trong 10ms mà không cần gọi LLM
    if (templateParts.length > 0) {
      const fastResult: AIPartSuggestionResponseData = {
        work_order_id: workOrder.id,
        work_order_number: workOrder.wo_number,
        job_id: targetJob.id,
        job_name: targetJob.name,
        service_name: targetService?.name || 'Dịch vụ',
        vehicle_summary: vehicleInfo,
        technical_advice: `Áp dụng định mức phụ tùng chuẩn của gara cấu hình cho mẫu công việc "${targetJob.name}".`,
        suggestions: templateParts.map((tp) => ({
          item_id: tp.item_id,
          sku: tp.sku,
          part_name: tp.name,
          brand_name: tp.brand,
          category_name: tp.name,
          suggested_quantity: tp.default_quantity,
          uom: tp.uom,
          unit_price: tp.selling_price,
          on_hand: tp.on_hand,
          is_in_stock: tp.on_hand >= tp.default_quantity,
          confidence: 'HIGH',
          reason: `Định mức kỹ thuật chuẩn của gara cho ${targetJob.name}`,
        })),
      };

      partSuggestionsCache.set(cacheKey, {
        data: fastResult,
        expiresAt: Date.now() + 15 * 60 * 1000,
      });

      return fastResult;
    }

    // 4. Trích xuất từ khóa tìm kiếm (Keywords Extraction) gọn gàng
    const textPool = [
      targetJob.name,
      targetJob.description || '',
      targetService?.name || '',
      ...linkedFindings.map((f: any) => `${f.part_name || ''} ${f.description || ''}`),
    ];
    const keywords = this.extractTechnicalKeywords(textPool);

    // 5. Truy xuất RAG Nguồn 2: Danh mục Kho Khả dụng Thực tế (Active Inventory Items)
    const searchConditions = keywords.map((kw) => ({
      OR: [
        { name: { contains: kw } },
        { description: { contains: kw } },
      ],
    }));

    const matchingCategories = await prisma.partCategory.findMany({
      where: {
        is_active: true,
        ...(searchConditions.length > 0 ? { OR: searchConditions } : {}),
      },
      include: {
        uom: true,
        inventory_items: {
          where: { is_active: true },
          include: { brand: true },
          take: 4,
        },
      },
      take: 12,
    });

    // Gom danh sách các Inventory Items khả dụng để gửi cho LLM
    const candidateInventoryMap = new Map<number, any>();

    // Đưa template parts vào candidate list trước
    templateParts.forEach((tp) => {
      candidateInventoryMap.set(tp.item_id, {
        id: tp.item_id,
        sku: tp.sku,
        name: tp.name,
        brand: tp.brand,
        uom: tp.uom,
        selling_price: tp.selling_price,
        on_hand: tp.on_hand,
        is_standard_template: true,
        default_quantity: tp.default_quantity,
      });
    });

    // Thêm các items từ matching categories
    matchingCategories.forEach((cat) => {
      cat.inventory_items.forEach((item) => {
        if (!candidateInventoryMap.has(item.id)) {
          candidateInventoryMap.set(item.id, {
            id: item.id,
            sku: item.sku,
            name: cat.name,
            brand: item.brand?.name || 'OEM',
            uom: cat.uom?.name || 'Cái',
            selling_price: Number(item.selling_price) || 0,
            on_hand: item.on_hand ?? 0,
            is_standard_template: false,
          });
        }
      });
    });

    // Nếu số candidate còn ít, lấy thêm top 15 items phổ biến trong kho
    if (candidateInventoryMap.size < 5) {
      const topItems = await prisma.inventoryItem.findMany({
        where: { is_active: true },
        include: {
          part_category: { include: { uom: true } },
          brand: true,
        },
        take: 15,
        orderBy: { on_hand: 'desc' },
      });

      topItems.forEach((item) => {
        if (!candidateInventoryMap.has(item.id)) {
          candidateInventoryMap.set(item.id, {
            id: item.id,
            sku: item.sku,
            name: item.part_category?.name || item.sku,
            brand: item.brand?.name || 'OEM',
            uom: item.part_category?.uom?.name || 'Cái',
            selling_price: Number(item.selling_price) || 0,
            on_hand: item.on_hand ?? 0,
            is_standard_template: false,
          });
        }
      });
    }

    const candidateInventoryList = Array.from(candidateInventoryMap.values());

    // 6. Truy xuất RAG Nguồn 3: Tiền lệ Lịch sử (Past JobParts)
    const historicalParts = await prisma.jobPart.findMany({
      where: {
        job: {
          name: { contains: targetJob.name.slice(0, 15) },
          wo_service: {
            work_order: {
              status: { in: ['CLOSED', 'RELEASED', 'FINANCIAL_CLEARED'] },
            },
          },
        },
      },
      include: {
        item: {
          include: {
            part_category: true,
            brand: true,
          },
        },
        job: {
          select: { name: true },
        },
      },
      take: 4,
    });

    const historicalSummary = historicalParts.map((hp) => ({
      job_name: hp.job.name,
      part_name: hp.item.part_category?.name || hp.item.sku,
      sku: hp.item.sku,
      brand: hp.item.brand?.name || 'OEM',
      quantity: Number(hp.planned_quantity) || 1,
    }));

    // 7. Xây dựng System & User Prompt
    const mileageStr = workOrder.check_in?.mileage ? `${workOrder.check_in.mileage.toLocaleString('vi-VN')} km` : 'Không xác định';

    const systemPrompt = `Bạn là Chuyên gia Kỹ thuật và Phụ tùng Ô tô (Automotive Parts Specialist) chuyên nghiệp tại Car Service Center.
Nhiệm vụ của bạn là phân tích thông tin xe, công việc sửa chữa/bảo dưỡng cụ thể và kết quả kiểm tra để đề xuất danh sách phụ tùng, linh kiện và vật tư tiêu hao cần thiết.

QUY TẮC BẮT BUỘC (GROUNDING RULES):
1. BẮT BUỘC ƯU TIÊN chọn các phụ tùng có trong [DANH MỤC PHỤ TÙNG KHO CÓ THỂ PHÙ HỢP]. Điền đúng "item_id" và "sku" từ danh mục kho được cung cấp. Tuyệt đối không tự bịa ID ngoài danh mục nếu trong danh mục đã có món hàng tương ứng.
2. Nếu công việc có trong [ĐỊNH MỨC XƯỞNG CẤU HÌNH SẴN], bạn BẮT BUỘC sử dụng phụ tùng và số lượng định mức này làm chuẩn.
3. TÍNH TOÁN ĐỊNH MỨC SỐ LƯỢNG CHUẨN XÁC THEO XE:
   - Dầu nhớt động cơ: Dựa vào phân khúc và dòng xe (Ví dụ: xe sedan 1.2L-1.5L như Vios, Accent, City thường cần 3.2L - 3.8L nhớt; xe 2.0L-2.5L như Camry, CX-5 thường cần 4.2L - 4.8L; xe bán tải/SUV máy dầu cần 6L - 8L).
   - Nếu trong kho có can 4L hoặc lon 1L, hãy đề xuất số lượng can/lon tương ứng cho đủ dung tích.
   - Lọc nhớt: thường thay 1 cái mỗi lần thay nhớt hoặc mỗi 10.000km.
   - Má phanh: tính theo bộ 1 cái (hoặc 1 bộ) cho cặp bánh trước hoặc sau.
   - Đơn vị tính và số lượng phải hợp lý theo quy cách đóng gói.
4. NẾU CÔNG VIỆC THUẦN NHÂN CÔNG:
   - Nếu công việc chỉ là thao tác kỹ thuật thuần túy không cần thay linh kiện (ví dụ: siết ốc gầm, đọc lỗi máy chẩn đoán ECU, vệ sinh họng hút bằng gió nén, cân chỉnh thước lái), mảng "suggestions" BẮT BUỘC trả về rỗng [] và ghi rõ trong "technical_advice": "Công việc thuần thao tác kỹ thuật, không yêu cầu thay thế phụ tùng định mức."
5. LÝ DO ĐỀ XUẤT (reason): Nêu rõ căn cứ kỹ thuật (định mức km, dung tích động cơ, hoặc triệu chứng hư hỏng).
6. Trả về đúng định dạng JSON thuần không bọc markdown.`;

    const userPrompt = `### THÔNG TIN XE:
- Xe: ${vehicleInfo}
- Biển số: ${workOrder.vehicle.license_plate}
- Số km thực tế (ODO): ${mileageStr}
- Yêu cầu khách khai: "${workOrder.check_in?.complaint || 'Không có yêu cầu đặc biệt'}"

### CÔNG VIỆC CẦN KHAI BÁO PHỤ TÙNG:
- Tên công việc: "${targetJob.name}"
- Mô tả công việc: "${targetJob.description || 'Không có mô tả'}"
- Loại công việc: ${targetJob.job_type?.name || 'Kỹ thuật'}
- Thuộc Hạng mục dịch vụ: "${targetService?.name || 'Dịch vụ'}"
${
  linkedFindings.length > 0
    ? `\n### DẤU VẾT HƯ HỎNG LIÊN KẾT VỚI CÔNG VIỆC (FINDINGS):\n` +
      linkedFindings
        .map((f: any) => `- [Finding #${f.id}] Vị trí: ${f.part_name || 'Bộ phận xe'} | Mức độ: ${f.severity} | Mô tả: "${f.description}"`)
        .join('\n')
    : ''
}
### [RAG NGUỒN 1] ĐỊNH MỨC XƯỞNG CẤU HÌNH SẴN CHO MẪU CÔNG VIỆC NÀY:
${
  templateParts.length > 0
    ? templateParts
        .map((tp) => `- [Item ID: ${tp.item_id}] ${tp.sku} | ${tp.name} | Hãng: ${tp.brand} | ĐVT: ${tp.uom} | Định mức mặc định: ${tp.default_quantity} | Tồn kho: ${tp.on_hand}`)
        .join('\n')
    : 'Không có mẫu định mức cấu hình sẵn.'
}

### [RAG NGUỒN 2] DANH MỤC PHỤ TÙNG KHO CÓ THỂ PHÙ HỢP:
${
  candidateInventoryList.length > 0
    ? candidateInventoryList
        .map((it) => `- [Item ID: ${it.id}] SKU: ${it.sku} | ${it.name} | Hãng: ${it.brand} | ĐVT: ${it.uom} | Đơn giá: ${it.selling_price.toLocaleString('vi-VN')} đ | Tồn kho: ${it.on_hand}`)
        .join('\n')
    : 'Kho hiện chưa có phụ tùng phù hợp.'
}

### [RAG NGUỒN 3] TIỀN LỆ SỬA CHỮA TƯƠNG TỰ TRONG QUÁ KHỨ:
${
  historicalSummary.length > 0
    ? historicalSummary
        .map((hs) => `- Job: "${hs.job_name}" -> Đã dùng: ${hs.part_name} (${hs.sku}, ${hs.brand}) - Số lượng: ${hs.quantity}`)
        .join('\n')
    : 'Chưa có tiền lệ tương tự trong hệ thống.'
}

Hãy phân tích và trả về JSON:
{
  "technical_advice": "Lời khuyên kỹ thuật tổng quan về phụ tùng cho công việc này trên dòng xe này",
  "suggestions": [
    {
      "item_id": 108,
      "sku": "SKU-MA-HANG",
      "part_name": "Tên phụ tùng",
      "suggested_quantity": 1,
      "confidence": "HIGH",
      "reason": "Lý do đề xuất và căn cứ định mức"
    }
  ]
}`;

    // 8. Gọi Gemini Failover
    const rawResultText = await executeWithGeminiFailover(async (ai, _, model) => {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
      return response.text;
    });

    // 9. Parse & Sanitize kết quả
    let parsed: RawPartSuggestionJSON = {};
    try {
      parsed = JSON.parse(rawResultText || '{}');
    } catch (e) {
      console.error('[AiPartPlannerService] Failed to parse JSON from Gemini:', rawResultText);
      throw new Error('AI trả về định dạng phản hồi không hợp lệ');
    }

    const technicalAdvice = parsed.technical_advice || 'Đề xuất phụ tùng dựa trên thông số kỹ thuật xe và tồn kho thực tế.';
    const rawSuggestions = parsed.suggestions || [];

    // 10. Khớp ID với Inventory thật trong kho để đảm bảo dữ liệu chuẩn 100%
    const finalSuggestions: AIPartSuggestionItem[] = [];

    for (const s of rawSuggestions) {
      let matchedItem: any = null;

      // Thử tìm theo item_id trước
      if (s.item_id && candidateInventoryMap.has(s.item_id)) {
        matchedItem = candidateInventoryMap.get(s.item_id);
      } else if (s.sku) {
        // Thử tìm theo sku trong candidate map
        matchedItem = candidateInventoryList.find(
          (c) => c.sku.toLowerCase() === (s.sku || '').toLowerCase()
        );
      }

      // Nếu vẫn chưa tìm thấy trong candidate, tra cứu trực tiếp DB
      if (!matchedItem && s.item_id) {
        matchedItem = await prisma.inventoryItem.findUnique({
          where: { id: s.item_id },
          include: { part_category: { include: { uom: true } }, brand: true },
        });
        if (matchedItem) {
          matchedItem = {
            id: matchedItem.id,
            sku: matchedItem.sku,
            name: matchedItem.part_category?.name || matchedItem.sku,
            brand: matchedItem.brand?.name || 'OEM',
            uom: matchedItem.part_category?.uom?.name || 'Cái',
            selling_price: Number(matchedItem.selling_price) || 0,
            on_hand: matchedItem.on_hand ?? 0,
          };
        }
      }

      if (matchedItem) {
        const qty = Math.max(0.1, Number(s.suggested_quantity) || 1);
        finalSuggestions.push({
          item_id: matchedItem.id,
          sku: matchedItem.sku,
          part_name: matchedItem.name,
          brand_name: matchedItem.brand,
          category_name: matchedItem.name,
          suggested_quantity: qty,
          uom: matchedItem.uom,
          unit_price: matchedItem.selling_price,
          on_hand: matchedItem.on_hand,
          is_in_stock: matchedItem.on_hand >= qty,
          confidence: s.confidence || 'HIGH',
          reason: s.reason || `Phụ tùng định mức cho công việc ${targetJob.name}`,
        });
      }
    }

    const finalResult: AIPartSuggestionResponseData = {
      work_order_id: workOrder.id,
      work_order_number: workOrder.wo_number,
      job_id: targetJob.id,
      job_name: targetJob.name,
      service_name: targetService?.name || 'Dịch vụ',
      vehicle_summary: vehicleInfo,
      technical_advice: technicalAdvice,
      suggestions: finalSuggestions,
    };

    // Lưu vào In-Memory Cache (TTL: 15 phút)
    partSuggestionsCache.set(cacheKey, {
      data: finalResult,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    return finalResult;
  }

  /**
   * Helper trích xuất từ khóa kỹ thuật từ chuỗi văn bản
   */
  private extractTechnicalKeywords(texts: string[]): string[] {
    const commonCarKeywords = [
      'nhớt', 'dầu nhớt', 'dầu máy', 'lọc nhớt', 'lọc dầu',
      'lọc gió', 'lọc điều hòa', 'lọc cabin', 'lọc xăng', 'lọc nhiên liệu',
      'phanh', 'má phanh', 'bố thắng', 'đĩa phanh', 'dầu phanh', 'heo thắng',
      'bugi', 'bô bin', 'ắc quy', 'bình điện', 'máy phát', 'củ đề',
      'nước mát', 'dung dịch làm mát', 'két nước', 'quạt làm mát', 'van hằng nhiệt',
      'dây curoa', 'tăng đơ', 'puly',
      'phuộc', 'giảm xóc', 'lò xo', 'bát bèo', 'rotuyn', 'thước lái', 'cao su càng',
      'gạt mưa', 'chổi gạt', 'nước rửa kính',
      'dầu hộp số', 'nhớt hộp số', 'lọc hộp số',
      'sơn', 'bả', 'matit', 'sơn lót', 'bóng', 'dầu bóng',
      'gioăng', 'phớt', 'ron nắp dàn cò', 'chảy dầu', 'rò rỉ',
      'lốp', 'vỏ xe', 'cân mâm', 'bơm lốp',
      'chốt', 'ốc', 'long đen', 'vòng đệm', 'vật tư phụ'
    ];

    const joinedText = texts.join(' ').toLowerCase();
    const foundKeywords = commonCarKeywords.filter((kw) => joinedText.includes(kw));

    // Thêm các từ đơn lẻ có độ dài >= 3 ký tự từ tên job
    const jobWords = (texts[0] || '').toLowerCase().split(/[\s,\-_/]+/).filter((w) => w.length >= 3);
    for (const word of jobWords) {
      if (!foundKeywords.includes(word) && foundKeywords.length < 15) {
        foundKeywords.push(word);
      }
    }

    return foundKeywords;
  }
}
