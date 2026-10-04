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
  async getCustomers(searchQuery?: string, page: number = 1, limit: number = 10, status: 'active' | 'deleted' | 'all' = 'active') {
    let whereClause: Prisma.UserWhereInput = {
      roles: {
        some: {
          role: {
            name: 'CUSTOMER',
          },
        },
      },
    };

    if (status === 'active') {
      whereClause.is_active = true;
    } else if (status === 'deleted') {
      whereClause.is_active = false;
    }

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
          email: (data.email !== undefined && data.email !== "") ? data.email : (data.email === "" ? `${data.phone || user.phone}@placeholder.com` : undefined),
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
          // Check for dependencies
          const linkedWorkOrders = await tx.workOrder.count({ where: { vehicle_id: { in: vehiclesToDelete } } });
          const linkedAppointments = await tx.appointment.count({ where: { vehicle_id: { in: vehiclesToDelete } } });
          const linkedIntakes = await tx.intakeRecord.count({ where: { vehicle_id: { in: vehiclesToDelete } } });

          if (linkedWorkOrders > 0 || linkedAppointments > 0 || linkedIntakes > 0) {
            throw new Error('Không thể xóa phương tiện vì đã có lịch hẹn hoặc hồ sơ sửa chữa liên kết. Vui lòng không xóa xe này để đảm bảo toàn vẹn dữ liệu.');
          }

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

  /**
   * Xóa mềm khách hàng (UC-25)
   */
  async softDeleteCustomer(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Không tìm thấy khách hàng.');
    if (!user.is_active) throw new Error('Khách hàng này đã bị xóa hoặc vô hiệu hóa từ trước.');

    // 1. Kiểm tra Work Order chưa hoàn thành
    const activeWO = await prisma.workOrder.findFirst({
      where: {
        customer_id: id,
        status: {
          notIn: ['CLOSED', 'CANCELLED']
        }
      }
    });
    if (activeWO) {
      throw new Error(`Không thể xóa do khách hàng đang có phiếu công việc chưa hoàn thành (Mã: ${activeWO.wo_number}).`);
    }

    // 2. Kiểm tra Invoice chưa thanh toán
    const pendingInvoice = await prisma.invoice.findFirst({
      where: {
        work_order: { customer_id: id },
        status: {
          in: ['DRAFT', 'ISSUED']
        }
      }
    });
    if (pendingInvoice) {
      throw new Error(`Không thể xóa do khách hàng đang có hóa đơn chưa thanh toán (Mã: ${pendingInvoice.invoice_number}).`);
    }

    // 3. Kiểm tra Appointment (Lịch hẹn) đang mở
    const activeAppointment = await prisma.appointment.findFirst({
      where: {
        customer_id: id,
        status: {
          in: ['REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'ARRIVED']
        }
      }
    });
    if (activeAppointment) {
      throw new Error('Không thể xóa do khách hàng đang có lịch hẹn chưa xử lý.');
    }

    // Nếu không vướng ràng buộc, thực hiện xóa mềm (chuyển is_active = false)
    return await prisma.user.update({
      where: { id },
      data: { is_active: false }
    });
  }

  /**
   * Khôi phục khách hàng đã xóa mềm
   */
  async restoreCustomer(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Không tìm thấy khách hàng.');
    if (user.is_active) throw new Error('Khách hàng này đang hoạt động.');

    return await prisma.user.update({
      where: { id },
      data: { is_active: true }
    });
  }

  /**
   * Xóa vĩnh viễn khách hàng (Chỉ dành cho khách hàng chưa có bất kỳ dữ liệu liên kết nào)
   */
  async hardDeleteCustomer(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Không tìm thấy khách hàng.');

    // Xóa vĩnh viễn thì phải xóa Role của user trước, sau đó xóa Vehicle, rồi mới xóa User.
    // Dùng transaction để đảm bảo toàn vẹn.
    return await prisma.$transaction(async (tx) => {
      // Xóa xe của khách hàng
      await tx.vehicle.deleteMany({ where: { customer_id: id } });
      
      // Xóa roles của khách hàng
      await tx.userRole.deleteMany({ where: { user_id: id } });

      // Xóa user
      return await tx.user.delete({ where: { id } });
    }).catch((error) => {
      throw new Error('Không thể xóa vĩnh viễn khách hàng vì có dữ liệu liên quan (hóa đơn, lịch hẹn...).');
    });
  }
}

