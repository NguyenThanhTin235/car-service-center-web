import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getServices = async (req: Request, res: Response) => {
  try {
    const services = await prisma.serviceTemplate.findMany({
      where: {
        is_active: true
      },
      select: {
        id: true,
        name: true,
        pricing_type: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      status: 'success',
      data: services
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
