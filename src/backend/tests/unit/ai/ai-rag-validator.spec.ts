import { describe, it, expect } from 'vitest';
import {
  cleanJobName,
  RagValidatorService,
  RawAIPlanResponse,
} from '../../../src/services/ai-rag/rag-validator.service';
import { RetrievedTechnician } from '../../../src/services/ai-rag/rag-retriever.service';

describe('AI RAG Validator & Anti-Duplication Guardrail (SPEC-AI-01)', () => {
  const validator = new RagValidatorService();

  const validJobTypeIds = [1, 2, 3]; // 1: Cơ khí, 2: Điện, 3: Sơn
  const validFindingIds = [10, 20];
  const validPartCategoryIds = [100, 200];

  const mockTechnicians: RetrievedTechnician[] = [
    {
      id: 5,
      full_name: 'Trương Minh Hoàng',
      skills: ['Điện', 'OBD-II'],
      today_assigned_hours: 4.0,
      active_jobs_count: 2, // load metric = 4.0 + 4 = 8.0
      status: 'AVAILABLE',
    },
    {
      id: 8,
      full_name: 'Hồ Văn Lâm',
      skills: ['Động cơ', 'Cơ khí'],
      today_assigned_hours: 1.5,
      active_jobs_count: 1, // load metric = 1.5 + 2 = 3.5 (ít tải nhất)
      status: 'AVAILABLE',
    },
  ];

  describe('cleanJobName() Normalization', () => {
    it('AI-NORM-01: Chuẩn hóa bỏ dấu tiếng Việt, ký tự đặc biệt và khoảng trắng', () => {
      expect(cleanJobName('Tháo và thay bugi')).toBe('thaovathaybugi');
      expect(cleanJobName('Chẩn đoán lỗi OBD-II')).toBe('chandoanloiobdii');
      expect(cleanJobName('  Thay bugi (Bộ 4 cái) - OEM!  ')).toBe('thaybugibo4caioem');
    });

    it('AI-NORM-02: Xử lý an toàn với chuỗi rỗng hoặc undefined', () => {
      expect(cleanJobName('')).toBe('');
      expect(cleanJobName(null as any)).toBe('');
      expect(cleanJobName(undefined as any)).toBe('');
    });
  });

  describe('RagValidatorService.validateAndSanitize()', () => {
    it('AI-VAL-01: Lọc bỏ triệt để các Job bị trùng tên trong cùng một nhóm dịch vụ', () => {
      const raw: RawAIPlanResponse = {
        summary: 'Đề xuất xử lý bỏ máy động cơ',
        suggested_services: [
          {
            service_id: 89,
            service_name: 'Sửa chữa động cơ bỏ máy',
            category_type: 'REPAIR',
            finding_id: 10,
            jobs: [
              {
                name: 'Chẩn đoán lỗi OBD-II',
                description: 'Đọc mã lỗi',
                job_type_id: 2,
                estimated_hours: 1.0,
                severity: 'HIGH',
              },
              // Trùng lặp khác cách viết hoa / ký tự
              {
                name: 'Chẩn đoán lỗi OBD-II (Kiểm tra lại)',
                description: 'Đọc mã lỗi lần 2',
                job_type_id: 2,
                estimated_hours: 1.0,
                severity: 'HIGH',
              },
              // Trùng lặp y nguyên
              {
                name: 'Chẩn đoán lỗi OBD-II',
                description: 'Trùng lặp 100%',
                job_type_id: 2,
                estimated_hours: 1.0,
                severity: 'HIGH',
              },
              // Job hoàn toàn khác
              {
                name: 'Tháo và thay thế bugi',
                description: 'Thay cụm 4 bugi',
                job_type_id: 1,
                estimated_hours: 1.0,
                severity: 'MEDIUM',
              },
            ],
          },
        ],
      };

      const result = validator.validateAndSanitize(
        raw,
        validJobTypeIds,
        validFindingIds,
        validPartCategoryIds,
        mockTechnicians
      );

      const service = result.suggested_services[0];
      // Ban đầu có 2 job tên 'Chẩn đoán lỗi OBD-II' (1 trùng 100%, 1 có thêm ngoặc), chỉ được giữ job đầu tiên không trùng
      const jobNames = service.jobs.map((j) => cleanJobName(j.name));
      const uniqueNames = new Set(jobNames);

      expect(jobNames.length).toBe(uniqueNames.size);
      expect(service.jobs.filter((j) => j.name === 'Chẩn đoán lỗi OBD-II')).toHaveLength(1);
      expect(service.jobs.some((j) => j.name === 'Tháo và thay thế bugi')).toBe(true);
    });

    it('AI-VAL-02: Giới hạn định mức giờ công (estimated_hours) an toàn', () => {
      const raw: RawAIPlanResponse = {
        summary: 'Kiểm tra giờ công',
        suggested_services: [
          {
            service_name: 'Dịch vụ test',
            category_type: 'MAINTENANCE',
            jobs: [
              { name: 'Job âm giờ', description: '', job_type_id: 1, estimated_hours: -2.5, severity: 'LOW' },
              { name: 'Job quá tải', description: '', job_type_id: 1, estimated_hours: 24.0, severity: 'LOW' },
              { name: 'Job số thập phân dài', description: '', job_type_id: 1, estimated_hours: 1.3333333, severity: 'LOW' },
            ],
          },
        ],
      };

      const result = validator.validateAndSanitize(
        raw,
        validJobTypeIds,
        validFindingIds,
        validPartCategoryIds,
        mockTechnicians
      );

      const jobs = result.suggested_services[0].jobs;
      expect(jobs[0].estimated_hours).toBe(1.0); // Âm hoặc <= 0 -> fallback 1.0
      expect(jobs[1].estimated_hours).toBe(8.0); // Vượt 12h -> cap 8.0h
      expect(jobs[2].estimated_hours).toBe(1.3); // Làm tròn 1 chữ số thập phân
    });

    it('AI-VAL-03: Fallback Job Type ID không hợp lệ về mã mặc định đầu tiên', () => {
      const raw: RawAIPlanResponse = {
        summary: 'Kiểm tra job type',
        suggested_services: [
          {
            service_name: 'Dịch vụ',
            category_type: 'OTHER',
            jobs: [
              { name: 'Job lạ', description: '', job_type_id: 9999, estimated_hours: 1.0, severity: 'LOW' },
            ],
          },
        ],
      };

      const result = validator.validateAndSanitize(
        raw,
        validJobTypeIds, // [1, 2, 3]
        validFindingIds,
        validPartCategoryIds,
        mockTechnicians
      );

      expect(result.suggested_services[0].jobs[0].job_type_id).toBe(1); // fallback validJobTypeIds[0]
    });

    it('AI-VAL-04: Phân công Kỹ thuật viên thông minh dựa trên tải việc (Load Balancing)', () => {
      const raw: RawAIPlanResponse = {
        summary: 'Kiểm tra phân công thợ',
        suggested_services: [
          {
            service_name: 'Dịch vụ phân công tự động',
            category_type: 'REPAIR',
            jobs: [
              // Không truyền assigned_technician_id -> Hệ thống phải tự chọn KTV ít tải nhất
              { name: 'Job tự phân công', description: '', job_type_id: 1, estimated_hours: 1.0, severity: 'MEDIUM' },
            ],
          },
        ],
      };

      const result = validator.validateAndSanitize(
        raw,
        validJobTypeIds,
        validFindingIds,
        validPartCategoryIds,
        mockTechnicians
      );

      const job = result.suggested_services[0].jobs[0];
      // KTV Hồ Văn Lâm (id: 8) có tải 3.5 thấp hơn Trương Minh Hoàng (id: 5) tải 8.0
      expect(job.assigned_technician_id).toBe(8);
      expect(job.assigned_technician_name).toBe('Hồ Văn Lâm');
      expect(job.assignment_reason).toContain('Tự động phân công');
    });

    it('AI-VAL-05: Giữ nguyên KTV được yêu cầu nếu KTV đó hợp lệ', () => {
      const raw: RawAIPlanResponse = {
        summary: 'Yêu cầu thợ cụ thể',
        suggested_services: [
          {
            service_name: 'Dịch vụ chỉ định thợ',
            category_type: 'REPAIR',
            jobs: [
              {
                name: 'Job chuyên sâu điện',
                description: '',
                job_type_id: 2,
                estimated_hours: 1.5,
                severity: 'HIGH',
                assigned_technician_id: 5, // Trương Minh Hoàng
              },
            ],
          },
        ],
      };

      const result = validator.validateAndSanitize(
        raw,
        validJobTypeIds,
        validFindingIds,
        validPartCategoryIds,
        mockTechnicians
      );

      const job = result.suggested_services[0].jobs[0];
      expect(job.assigned_technician_id).toBe(5);
      expect(job.assigned_technician_name).toBe('Trương Minh Hoàng');
    });
  });
});

