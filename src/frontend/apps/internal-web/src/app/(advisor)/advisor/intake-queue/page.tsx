'use client';
import React, { useEffect, useState } from 'react';
import IntakeQueueStats from '@/components/advisor/IntakeQueueStats';
import IntakeQueueTable from '@/components/advisor/IntakeQueueTable';
import { IntakeQueueItem, getIntakeQueue } from '@/lib/api/work-order.api';
import toast from 'react-hot-toast';

export default function IntakeQueuePage() {
  const [items, setItems] = useState<IntakeQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'QUEUED' | 'CONVERTED' | 'CANCELLED'>('QUEUED');

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await getIntakeQueue();
      if (res.success) {
        setItems(res.data);
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách chờ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const totalQueue = items.filter(i => i.status === 'QUEUED').length;
  let totalWaitMinutes = 0;
  let urgentCount = 0;
  
  items.filter(i => i.status === 'QUEUED').forEach(item => {
    const diff = Date.now() - new Date(item.arrived_at).getTime();
    const waitMins = Math.floor(diff / 60000);
    totalWaitMinutes += Math.max(0, waitMins);
    if (waitMins > 30) urgentCount++;
  });
  
  const avgWaitMinutes = totalQueue > 0 ? Math.floor(totalWaitMinutes / totalQueue) : 0;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1440px] mx-auto w-full">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">Danh sách xe đang chờ</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Quản lý các xe đã được bộ phận Lễ tân tiếp nhận và đang chờ phân bổ Cố vấn Dịch vụ.
          </p>
        </div>
      </div>
      
      <IntakeQueueStats totalQueue={totalQueue} avgWaitMinutes={avgWaitMinutes} urgentCount={urgentCount} />
      
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 overflow-hidden shadow-sm min-h-[300px] flex flex-col">
        {/* Tabs */}
        <div className="flex items-center gap-2 p-4 border-b border-outline-variant/60">
          {(['QUEUED', 'CONVERTED', 'CANCELLED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold text-body-md border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-t-md'
              }`}
            >
              {tab === 'QUEUED' && 'Chờ xử lý'}
              {tab === 'CONVERTED' && 'Đã chuyển phiếu'}
              {tab === 'CANCELLED' && 'Đã hủy'}
              <span className="ml-2 bg-surface-container-high text-on-surface px-1.5 py-0.5 rounded-full text-label-sm">
                {items.filter(r => r.status === tab).length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
          </div>
        ) : (
          <IntakeQueueTable items={items.filter(i => i.status === activeTab)} onWorkOrderCreated={fetchQueue} />
        )}
      </div>
    </div>
  );
}
