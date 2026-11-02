import { QcResult } from '@prisma/client';

export interface SubmitQcItemDto {
  templateItemId?: number;
  itemName: string;
  result: QcResult; // 'PASS' | 'FAIL'
  notes?: string;
  // Thông tin cấu hình Job Rework nếu Không đạt (FAIL)
  reworkJobName?: string;
  reworkDescription?: string;
  parentJobId?: number;
  assignedEmployeeId?: number;
}

export interface SubmitQcDto {
  woServiceId: number;
  templateId?: number;
  notes?: string;
  items: SubmitQcItemDto[];
}

export interface RequestBillingDto {
  notes?: string;
}

