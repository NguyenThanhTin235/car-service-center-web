import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCustomerDto {
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  vehicles?: Array<{
    id?: number;
    licensePlate: string;
    make: string;
    model: string;
    year?: number;
    color?: string;
    vehicleSize: any; // Using string/enum
  }>;
}

export interface UpdateCustomerDto {
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  vehicles?: Array<{
    id?: number;
    licensePlate: string;
    make: string;
    model: string;
    year?: number;
    color?: string;
    vehicleSize: any;
  }>;
}

export class CustomerService {
  /**
   * Lấy danh sách khách hàng (tìm kiếm theo tên, sđt, biển số)
   */
  async getCustomers(searchQuery?: string, page: number = 1, limit: number = 10) {
    let whereClause: Prisma.UserWhereInput = {
      roles: {
        some: {
          role: {
            name: 'CUSTOMER',
          },
        },
      },
    };

    if (searchQuery) {
      whereClause = {
        ...whereClause,
        OR: [
          { full_name: { contains: searchQuery } },
          { phone: { contains: searchQuery } },
          { email: { contains: searchQuery } },
          {
            vehicles: {
              some: {
                license_plate: { contains: searchQuery },
              },
            },
          },
        ],
      };
    }

    const skip = (page - 1) * limit;

    const [totalRecords, customers] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        include: {
          vehicles: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      })
    ]);

    // Mock data for Total Spent, and Last Visit
    const data = customers.map((c) => {
      // Mock logic based on ID to have stable mock data
      const mockVisits = (c.id * 3) % 15; // 0 to 14
      const mockSpent = (c.id * 5000000) % 150000000;
      
      return {
        id: c.id,
        fullName: c.full_name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        isActive: c.is_active,
        vehicles: c.vehicles.map((v) => ({
          id: v.id,
          licensePlate: v.license_plate,
          make: v.make,
          model: v.model,
          color: v.color,
          vehicleSize: v.vehicle_size,
        })),
        stats: {
          totalVisits: mockVisits,
          totalSpent: mockSpent,
          lastVisitDate: mockVisits > 0 ? new Date(Date.now() - mockVisits * 86400000 * 5) : null,
          lastService: mockVisits > 0 ? 'Bảo dưỡng định kỳ' : null,
        },
      };
    });

    return {
      data,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        limit
      }
    };
  }

  /**
   * Thêm khách hàng mới
   */
  async createCustomer(data: CreateCustomerDto) {
    // 1. Kiểm tra SĐT hoặc Email đã tồn tại chưa
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: data.phone },
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.phone === data.phone) {
        throw new Error('Số điện thoại đã tồn tại trong hệ thống.');
      }
      if (existingUser.email === data.email) {
        throw new Error('Email đã tồn tại trong hệ thống.');
      }
    }

    // Default password for customer
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(data.phone || '123456', 10);

    const newUser = await prisma.$transaction(async (tx) => {
      // Create user with CUSTOMER role
      const user = await tx.user.create({
        data: {
          full_name: data.fullName,
          phone: data.phone,
          email: data.email || `${data.phone}@placeholder.com`, // Email is unique, needs fallback
          password_hash: hashedPassword,
          address: data.address,
          roles: {
            create: {
              role: {
                connect: { name: 'CUSTOMER' },
              },
            },
          },
        },
      });

      // Create vehicles
      if (data.vehicles && data.vehicles.length > 0) {
        for (const v of data.vehicles) {
          if (!v.licensePlate) continue;
          
          // Check if license plate exists
          const existingVehicle = await tx.vehicle.findUnique({
            where: { license_plate: v.licensePlate },
          });

          if (existingVehicle) {
            throw new Error(`Biển số xe ${v.licensePlate} đã tồn tại.`);
          }

          await tx.vehicle.create({
            data: {
              customer_id: user.id,
              license_plate: v.licensePlate,
              make: v.make,
              model: v.model,
              year: v.year,
              color: v.color,
              vehicle_size: v.vehicleSize || 'MEDIUM',
            },
          });
        }
      }

      return user;
    });

    return newUser;
  }

  /**
   * Cập nhật thông tin khách hàng
   */
  async updateCustomer(id: number, data: UpdateCustomerDto) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Không tìm thấy khách hàng.');

    // Check unique constraints if phone/email are changed
    if (data.phone && data.phone !== user.phone) {
      const existPhone = await prisma.user.findUnique({ where: { phone: data.phone } });
      if (existPhone) throw new Error('Số điện thoại đã tồn tại.');
    }
    
    if (data.email && data.email !== user.email) {
      const existEmail = await prisma.user.findUnique({ where: { email: data.email } });
      if (existEmail) throw new Error('Email đã tồn tại.');
    }

    return prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          full_name: data.fullName !== undefined ? data.fullName : undefined,
          phone: data.phone !== undefined ? data.phone : undefined,
          email: data.email !== undefined ? data.email : undefined,
          address: data.address !== undefined ? data.address : undefined,
        },
      });

      // Handle vehicles if provided
      if (data.vehicles) {
        // Find existing vehicles to handle deletion
        const existingVehicles = await tx.vehicle.findMany({ where: { customer_id: id } });
        const existingVehicleIds = existingVehicles.map(v => v.id);
        const incomingVehicleIds = data.vehicles.map(v => v.id).filter(vId => vId !== undefined) as number[];
        
        const vehiclesToDelete = existingVehicleIds.filter(vId => !incomingVehicleIds.includes(vId));
        if (vehiclesToDelete.length > 0) {
          await tx.vehicle.deleteMany({
            where: { id: { in: vehiclesToDelete } }
          });
        }

        for (const v of data.vehicles) {
          if (!v.licensePlate) continue;
          
          if (v.id) {
            // Update existing vehicle
            await tx.vehicle.update({
              where: { id: v.id },
              data: {
                make: v.make,
                model: v.model,
                color: v.color,
                // license_plate updates usually restricted, but if needed we can add it
              },
            });
          } else {
            // Check uniqueness before create
            const existingVehicle = await tx.vehicle.findUnique({
              where: { license_plate: v.licensePlate },
            });
            if (existingVehicle) {
              throw new Error(`Biển số xe ${v.licensePlate} đã tồn tại.`);
            }

            // Add new vehicle for existing customer
            await tx.vehicle.create({
              data: {
                customer_id: id,
                license_plate: v.licensePlate,
                make: v.make,
                model: v.model,
                year: v.year,
                color: v.color,
                vehicle_size: v.vehicleSize || 'MEDIUM',
              },
            });
          }
        }
      }

      return updatedUser;
    });
  }
}
