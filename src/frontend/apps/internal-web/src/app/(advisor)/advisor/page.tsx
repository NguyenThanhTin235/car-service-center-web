'use client';
import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SADashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = [
    { label: 'Xe chờ tiếp nhận', value: 3, icon: 'time_auto', color: 'bg-error-container text-error', border: 'border-error/20' },
    { label: 'RO đang thực hiện', value: 12, icon: 'build_circle', color: 'bg-primary-container text-on-primary-container', border: 'border-primary/20' },
    { label: 'Chờ duyệt báo giá', value: 4, icon: 'pending_actions', color: 'bg-tertiary-container text-on-tertiary-container', border: 'border-tertiary/20' },
    { label: 'Sẵn sàng bàn giao', value: 2, icon: 'key', color: 'bg-[#C4EED0] text-[#0F5223]', border: 'border-[#0F5223]/20' }
  ];

  const priorityTasks = [
    { id: '1', ro: 'RO-2309-001', customer: 'Nguyễn Văn A', plate: '30G-123.45', status: 'Chờ duyệt báo giá', time: '10 phút trước', urgent: true },
    { id: '2', ro: 'RO-2309-004', customer: 'Trần Thị B', plate: '51H-987.65', status: 'Đã hoàn thành QC', time: '1 giờ trước', urgent: false },
    { id: '3', ro: 'RO-2309-007', customer: 'Lê Văn C', plate: '29D-444.55', status: 'Chờ phụ tùng', time: '2 giờ trước', urgent: false },
    { id: '4', ro: 'RO-2309-012', customer: 'Phạm D', plate: '15A-111.22', status: 'Yêu cầu kiểm tra thêm', time: '3 giờ trước', urgent: true },
  ];

  const appointments = [
    { time: '14:00', customer: 'Hoàng Văn E', service: 'Bảo dưỡng 10,000km', plate: '30F-999.99' },
    { time: '15:30', customer: 'Đỗ Thị F', service: 'Kiểm tra gầm, phanh', plate: '51G-888.88' },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1440px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">
            Chào buổi chiều, {mounted ? (user?.fullName || 'Cố vấn dịch vụ') : 'Cố vấn dịch vụ'}! 👋
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Dưới đây là tổng quan công việc và các ưu tiên cần xử lý trong ngày hôm nay.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/advisor/intake-queue" className="flex items-center gap-2 px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg font-semibold transition-colors border border-outline-variant">
            <span className="material-symbols-outlined text-[20px]">inbox</span>
            Xem hàng đợi
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Tạo Lệnh SC
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className={`p-5 rounded-xl border ${stat.border} bg-surface-container-lowest shadow-sm flex items-center gap-4 hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${stat.color}`}>
              <span className="material-symbols-outlined text-[28px]">{stat.icon}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-display-sm font-bold text-on-surface leading-tight">{stat.value}</span>
              <span className="text-label-md font-semibold text-on-surface-variant mt-1">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* Left Col (Task list) */}
        <div className="col-span-2 flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-lowest">
            <h2 className="text-title-md font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">priority_high</span>
              Cần xử lý ngay
            </h2>
            <button className="text-label-sm font-bold text-primary hover:underline">Xem tất cả</button>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-5 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/60">Lệnh SC (RO)</th>
                  <th className="px-5 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/60">Khách hàng & Xe</th>
                  <th className="px-5 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/60">Trạng thái</th>
                  <th className="px-5 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/60 text-right">Cập nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {priorityTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-surface-container-low/50 transition-colors cursor-pointer group" onClick={() => router.push(`/advisor/work-orders/${task.id}`)}>
                    <td className="px-5 py-4">
                      <span className="font-mono text-primary font-bold text-label-md group-hover:underline">{task.ro}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-on-surface">{task.customer}</div>
                      <div className="text-label-sm text-on-surface-variant uppercase tracking-wider mt-0.5">{task.plate}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded text-label-sm font-bold inline-flex items-center gap-1.5 ${
                        task.urgent ? 'bg-error-container text-error' : 'bg-secondary-container text-on-secondary-container'
                      }`}>
                        {task.urgent && <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>}
                        {task.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-body-sm text-on-surface-variant italic">{task.time}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col (Appointments) */}
        <div className="col-span-1 flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm p-5">
          <h2 className="text-title-md font-bold text-on-surface flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-tertiary">calendar_clock</span>
            Lịch hẹn sắp tới
          </h2>
          
          <div className="flex flex-col gap-3">
            {appointments.map((apt, idx) => (
              <div key={idx} className="flex gap-4 p-3 rounded-lg border border-outline-variant/50 hover:border-primary/30 transition-colors hover:shadow-sm">
                <div className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-lg w-12 h-12 shrink-0">
                  <span className="font-bold text-title-sm">{apt.time.split(':')[0]}</span>
                  <span className="text-[10px] font-bold leading-none">{apt.time.split(':')[1]}</span>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="font-bold text-on-surface text-label-md">{apt.customer} <span className="text-outline mx-1">•</span> <span className="uppercase text-on-surface-variant font-mono">{apt.plate}</span></div>
                  <div className="text-body-sm text-on-surface-variant mt-0.5 line-clamp-1">{apt.service}</div>
                </div>
              </div>
            ))}
            
            <button className="mt-3 w-full py-2.5 border border-dashed border-outline-variant rounded-lg text-label-md font-bold text-primary hover:bg-primary/5 transition-colors">
              + Thêm lịch hẹn mới
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
