import { Request, Response } from 'express';
import { AppointmentService } from '../services/appointment.service';
import { createAppointmentSchema, updateAppointmentSchema, cancelAppointmentSchema } from '../dtos/appointment.dto';
import { AppointmentStatus } from '@prisma/client';

const appointmentService = new AppointmentService();

export const getAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, startDate, endDate, status, page, limit } = req.query;
    const pageNumber = page ? parseInt(page as string) : 1;
    const limitNumber = limit ? parseInt(limit as string) : 50;

    const result = await appointmentService.getAppointments(
      search as string,
      pageNumber,
      limitNumber,
      startDate as string,
      endDate as string,
      status as string
    );

    res.json({
      status: 'success',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getAppointmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const appointment = await appointmentService.getAppointmentById(Number(id));
    
    res.json({
      status: 'success',
      data: appointment
    });
  } catch (error: any) {
    res.status(404).json({
      status: 'error',
      message: error.message || 'Không tìm thấy lịch hẹn',
    });
  }
};

export const createAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = createAppointmentSchema.validate(req.body);
    if (error) {
      res.status(400).json({ status: 'error', message: error.details[0].message });
      return;
    }

    // Assume user is attached to req by auth middleware, for now mock user ID 1
    const createdById = (req as any).user?.id || 1;

    const newAppointment = await appointmentService.createAppointment(value, createdById);
    
    res.status(201).json({
      status: 'success',
      message: 'Tạo lịch hẹn thành công',
      data: newAppointment,
    });
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'Lỗi khi tạo lịch hẹn',
    });
  }
};

export const updateAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error, value } = updateAppointmentSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({ status: 'error', message: error.details[0].message });
      return;
    }

    const updatedAppointment = await appointmentService.updateAppointment(Number(id), value);
    
    res.json({
      status: 'success',
      message: 'Cập nhật lịch hẹn thành công',
      data: updatedAppointment,
    });
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'Lỗi khi cập nhật lịch hẹn',
    });
  }
};

export const confirmAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const confirmedAppointment = await appointmentService.confirmAppointment(Number(id));
    
    res.json({
      status: 'success',
      message: 'Xác nhận lịch hẹn thành công',
      data: confirmedAppointment,
    });
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'Lỗi khi xác nhận lịch hẹn',
    });
  }
};

export const cancelAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error, value } = cancelAppointmentSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({ status: 'error', message: error.details[0].message });
      return;
    }

    const cancelledAppointment = await appointmentService.cancelAppointment(Number(id), value.cancel_reason);
    
    res.json({
      status: 'success',
      message: 'Hủy lịch hẹn thành công',
      data: cancelledAppointment,
    });
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'Lỗi khi hủy lịch hẹn',
    });
  }
};

export const arriveAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const createdById = req.user?.id;
    const result = await appointmentService.arriveAppointment(Number(id), createdById);
    
    res.json({
      success: true,
      code: 200,
      message: 'Tiếp nhận xe thành công',
      data: result,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      code: 400,
      message: error.message || 'Lỗi khi tiếp nhận xe',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};
