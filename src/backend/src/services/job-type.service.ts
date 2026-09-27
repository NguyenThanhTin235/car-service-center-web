import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateJobTypeDto {
  name: string;
  description?: string;
  hourlyRate: number;
}

export interface UpdateJobTypeDto {
  name?: string;
  description?: string;
  hourlyRate?: number;
  isActive?: boolean;
}

export class JobTypeService {
  /**
   * UC-63: Lấy danh sách loại công việc
   */
  async getJobTypes(search?: string, page = 1, limit = 10) {
    const where: any = {};
    if (search) where.name = { contains: search };

    const skip = (page - 1) * limit;
    const [totalRecords, jobTypes] = await Promise.all([
      prisma.jobType.count({ where }),
      prisma.jobType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'asc' },
      }),
    ]);

    const data = jobTypes.map((j) => ({
      id: j.id,
      name: j.name,
      description: j.description,
      hourlyRate: j.hourly_rate,
      isActive: j.is_active,
    }));

    return {
      data,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        limit,
      },
    };
  }

  /**
   * UC-62: Tạo loại công việc
   */
  async createJobType(data: CreateJobTypeDto) {
    const existing = await prisma.jobType.findFirst({ where: { name: data.name } });
    if (existing) throw new Error('Tên loại công việc đã tồn tại.');

    return prisma.jobType.create({
      data: {
        name: data.name,
        description: data.description,
        hourly_rate: data.hourlyRate,
      },
    });
  }

  /**
   * UC-64: Cập nhật loại công việc
   */
  async updateJobType(id: number, data: UpdateJobTypeDto) {
    const existing = await prisma.jobType.findUnique({ where: { id } });
    if (!existing) throw new Error('Không tìm thấy loại công việc.');

    if (data.name && data.name !== existing.name) {
      const dup = await prisma.jobType.findFirst({ where: { name: data.name } });
      if (dup) throw new Error('Tên loại công việc đã tồn tại.');
    }

    return prisma.jobType.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        hourly_rate: data.hourlyRate,
        is_active: data.isActive,
      },
    });
  }

  /**
   * UC-65: Toggle active/inactive loại công việc
   */
  async toggleJobType(id: number) {
    const existing = await prisma.jobType.findUnique({ where: { id } });
    if (!existing) throw new Error('Không tìm thấy loại công việc.');

    await prisma.jobType.update({
      where: { id },
      data: { is_active: !existing.is_active },
    });
    return { isActive: !existing.is_active };
  }
}
