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
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isWalkIn
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-tertiary-container text-on-tertiary-container'
              }`}
            >
              {isWalkIn ? 'Walk-In' : 'Tow-In'}
            </span>
            <span className="text-label-sm font-code-mono text-secondary">
              {new Date(record.arrived_at).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          {record.status === 'QUEUED' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-label-sm font-semibold">
              <span className="material-symbols-outlined text-[14px] mr-1">timer</span>
              Đang chờ
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1 mb-4">
          <h3 className="text-headline-md font-headline-md font-bold text-on-surface">
            {record.vehicle.license_plate}
          </h3>
          <p className="text-body-sm text-secondary">
            {record.vehicle.make} {record.vehicle.model}
          </p>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2 text-body-sm">
            <span className="material-symbols-outlined text-[16px] text-outline mt-0.5">person</span>
            <div className="flex flex-col">
              <span className="font-semibold text-on-surface">{record.customer.full_name}</span>
              <span className="text-secondary">{record.customer.phone}</span>
            </div>
          </div>
          
          {!isWalkIn && record.tow_company && (
            <div className="flex items-start gap-2 text-body-sm">
              <span className="material-symbols-outlined text-[16px] text-tertiary mt-0.5">local_shipping</span>
              <span className="text-on-surface">Đơn vị kéo: {record.tow_company}</span>
            </div>
          )}

          {record.notes && (
            <div className="flex items-start gap-2 text-body-sm">
              <span className="material-symbols-outlined text-[16px] text-outline mt-0.5">notes</span>
              <span className="text-secondary line-clamp-2">{record.notes}</span>
            </div>
          )}
        </div>
      </div>

      {record.status === 'QUEUED' && (
        <div className="pt-4 border-t border-outline-variant flex gap-2">
          {onArrive && (
            <button
              onClick={onArrive}
              className="flex-1 py-1.5 bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:bg-primary-container hover:text-on-primary-container transition-colors"
            >
              Lên lệnh sửa chữa
            </button>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1.5 bg-surface-container border border-outline-variant text-error rounded-lg text-label-md font-semibold hover:bg-error-container transition-colors"
            >
              Hủy
            </button>
          )}
        </div>
      )}
    </div>
  );
}
