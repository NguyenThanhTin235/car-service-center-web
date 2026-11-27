import { describe, it, expect, vi, beforeEach } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  vehicle: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
}));

const notificationMock = vi.hoisted(() => ({
  sendInApp: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/utils/prisma', () => ({
  default: prismaMock,
}));

vi.mock('../../../src/services/notification.service', () => ({
  notificationService: notificationMock,
}));

import { VehicleService } from '../../../src/services/vehicle.service';

describe('VehicleService — createVehicle notification', () => {
  const service = new VehicleService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates vehicle and sends in-app notification to the customer', async () => {
    prismaMock.vehicle.findUnique.mockResolvedValue(null);
    prismaMock.vehicle.create.mockResolvedValue({
      id: 42,
      customer_id: 10,
      license_plate: '51A-999.99',
      make: 'Honda',
      model: 'CR-V',
      year: 2023,
      color: 'Trắng',
      vehicle_size: 'LARGE',
      status: 'ACTIVE',
      created_at: new Date('2026-11-26T14:00:00Z'),
    });

    const result = await service.createVehicle(10, {
      licensePlate: '51A-999.99',
      make: 'Honda',
      model: 'CR-V',
      year: 2023,
      color: 'Trắng',
      vehicleSize: 'LARGE',
    });

    expect(result.id).toBe(42);
    expect(result.licensePlate).toBe('51A-999.99');
    expect(notificationMock.sendInApp).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 10,
        type: 'SYSTEM_ALERT',
        entityType: 'VEHICLE',
        entityId: 42,
      })
    );
  });
});
