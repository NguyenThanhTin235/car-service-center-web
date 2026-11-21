import React from 'react';
import { IntakeRecord } from '@/store/slices/intakeSlice';

interface Props {
  record: IntakeRecord;
  onArrive?: () => void;
  onCancel?: () => void;
}

export default function IntakeQueueCard({ record, onArrive, onCancel }: Props) {
  const isWalkIn = record.intake_type === 'WALK_IN';

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isWalkIn
                  ? 'bg-blue-50 text-[#0050cd] border border-blue-200/70'
                  : 'bg-rose-50 text-rose-700 border border-rose-200/70'
              }`}
            >
              {isWalkIn ? 'Khách vãng lai' : 'Xe cứu hộ'}
            </span>
            <span className="text-xs font-mono tabular-nums font-bold text-slate-500">
              {new Date(record.arrived_at).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          {record.status === 'QUEUED' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
              Đang chờ
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1 mb-4">
          <h3 className="font-mono tabular-nums text-xl font-extrabold text-slate-900 tracking-wider">
            {record.vehicle.license_plate}
          </h3>
          <p className="text-xs font-semibold text-slate-600">
            {record.vehicle.make} {record.vehicle.model}
          </p>
        </div>

        <div className="space-y-2.5 mb-4 text-xs">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-slate-400 mt-0.5">person</span>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900">{record.customer.full_name}</span>
              <span className="font-mono text-slate-600 tabular-nums">{record.customer.phone}</span>
            </div>
          </div>
          
          {!isWalkIn && record.tow_company && (
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-amber-600 mt-0.5">local_shipping</span>
              <span className="text-slate-700">Đơn vị kéo: <strong>{record.tow_company}</strong></span>
            </div>
          )}

          {record.notes && (
            <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="material-symbols-outlined text-[16px] text-slate-400 mt-0.5">notes</span>
              <span className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">{record.notes}</span>
            </div>
          )}
        </div>
      </div>

      {record.status === 'QUEUED' && (
        <div className="pt-3.5 border-t border-slate-100 flex gap-2 items-center">
          {onArrive && (
            <button
              onClick={onArrive}
              className="flex-1 h-9 bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[16px]">assignment_add</span>
              <span>Tạo lệnh sửa chữa</span>
            </button>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="h-9 px-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold transition-all flex items-center justify-center cursor-pointer"
              title="Hủy tiếp nhận này"
            >
              <span>Hủy</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
