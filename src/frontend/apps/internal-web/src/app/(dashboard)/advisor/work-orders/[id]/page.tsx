'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

export default function WorkOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [workOrder, setWorkOrder] = useState<any>(null);
  
  // Edit state
  const [notes, setNotes] = useState('');
  const [odometer, setOdometer] = useState<number | ''>('');
  
  useEffect(() => {
    if (id) {
      fetchWorkOrder();
    }
  }, [id]);
  
  const fetchWorkOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/work-orders/${id}`);
      const wo = res.data.data;
      setWorkOrder(wo);
      setNotes(wo.intake_record?.notes || '');
      setOdometer(wo.check_in?.mileage || '');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi tải chi tiết phiếu công việc');
      router.push('/advisor/intake-inspection');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveInfo = async () => {
    try {
      // Assuming we have an endpoint to update Work Order
      await api.put(`/api/work-orders/${id}`, {
        notes,
        current_km: odometer === '' ? null : Number(odometer)
      });
      toast.success('Cập nhật thông tin thành công');
      fetchWorkOrder();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật thông tin');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <span className="material-symbols-outlined animate-spin text-[48px] text-primary">progress_activity</span>
      </div>
    );
  }
  
  if (!workOrder) return null;

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/advisor/intake-inspection')}
            className="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-headline-md font-bold text-on-surface">Chi tiết phiếu công việc: {workOrder.wo_number}</h1>
            <p className="text-body-md text-secondary">
              Khách hàng: {workOrder.customer?.full_name} - Biển số: <span className="font-bold text-on-surface">{workOrder.vehicle?.license_plate}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-primary/10 text-primary font-semibold rounded-full text-label-md">
            Trạng thái: {workOrder.status}
          </span>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm"
            onClick={() => toast.success('Sẽ mở màn hình Ghi nhận tình trạng xe 2D (UC-30) ở bản cập nhật sau')}
          >
            <span className="material-symbols-outlined text-[20px]">directions_car</span>
            Ghi nhận tình trạng xe (2D)
          </button>
        </div>
      </div>
      
      {/* General Info Edit */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
        <h2 className="text-title-lg font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">edit_note</span>
          Cập nhật thông tin chung
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-label-md font-semibold text-on-surface">Số Km hiện tại (ODO)</label>
            <input 
              type="number"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value ? Number(e.target.value) : '')}
              className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
              placeholder="Ví dụ: 15000"
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-label-md font-semibold text-on-surface">Ghi chú / Phàn nàn của khách hàng</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full p-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container resize-none"
              placeholder="Nhập ghi chú hoặc yêu cầu của khách hàng..."
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleSaveInfo}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-low border border-outline-variant text-on-surface rounded-lg font-semibold hover:bg-surface-container transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
