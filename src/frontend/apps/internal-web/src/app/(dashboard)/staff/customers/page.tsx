'use client';

import React, { useState, useEffect } from 'react';
import CustomerFormModal from '@/components/customers/CustomerFormModal';
import CustomerDetailModal from '@/components/customers/CustomerDetailModal';
import ConfirmModal from '@/components/shared/ConfirmModal';
import TablePagination from '@/components/shared/TablePagination';
import { formatVND } from '@/lib/utils/formatters';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { useSelector } from 'react-redux';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  const user = useSelector((state: any) => state.auth?.user);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'delete' | 'restore' | 'hard_delete' | null>(null);
  const [customerToProcess, setCustomerToProcess] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null); // Dùng chung cho View & Edit

  const fetchCustomers = async (searchQuery = '', page = 1, tabStatus = activeTab) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/customers', {
        params: { search: searchQuery, page, limit: 5, status: tabStatus },
        withCredentials: true,
      });
      setCustomers(res.data.data);
      if (res.data.pagination) {
        setCurrentPage(res.data.pagination.currentPage);
        setTotalPages(res.data.pagination.totalPages);
        setTotalRecords(res.data.pagination.totalRecords);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu khách hàng', err);
      setError(err?.response?.data?.message || 'Không thể tải danh sách khách hàng. Vui lòng kiểm tra kết nối.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchCustomers(search, 1, activeTab);
    }, 500); // Debounce 500ms
    
    return () => clearTimeout(debounceTimer);
  }, [search, activeTab]);

  const handleSaveCustomer = async (data: any, id?: number) => {
    try {
      if (id) {
        // Edit Mode
        await api.put(`/api/customers/${id}`, data);
        toast.success("Cập nhật hồ sơ khách hàng thành công!");
      } else {
        // Create Mode
        await api.post('/api/customers', data);
        toast.success("Thêm khách hàng thành công!");
      }
      await fetchCustomers(search, currentPage, activeTab); // Refresh sau khi lưu
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu khách hàng');
      throw error;
    }
  };

  const openConfirm = (id: number, action: 'delete' | 'restore' | 'hard_delete') => {
    setCustomerToProcess(id);
    setConfirmAction(action);
    setIsConfirmOpen(true);
  };

  const executeConfirmAction = async () => {
    if (!customerToProcess || !confirmAction) return;
    try {
      if (confirmAction === 'delete') {
        await api.delete(`/api/customers/${customerToProcess}`);
        toast.success("Vô hiệu hóa khách hàng thành công!");
      } else if (confirmAction === 'restore') {
        await api.patch(`/api/customers/${customerToProcess}/restore`);
        toast.success("Khôi phục khách hàng thành công!");
      } else if (confirmAction === 'hard_delete') {
        await api.delete(`/api/customers/${customerToProcess}/hard`);
        toast.success("Đã xóa vĩnh viễn khách hàng!");
      }
      setIsConfirmOpen(false);
      await fetchCustomers(search, currentPage, activeTab);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
      setIsConfirmOpen(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setLoading(true);
      // Fetch all for the report
      const res = await api.get('/api/customers', {
        params: { search, limit: 10000, status: activeTab },
        withCredentials: true,
      });
      const exportData = res.data.data;

      const excelData: any[] = [];
      
      exportData.forEach((c: any) => {
        const baseCustomer = {
          'Mã KH': c.id,
          'Tên khách hàng': c.fullName,
          'Số điện thoại': c.phone,
          'Email': c.email || '',
          'Tổng chi tiêu (VNĐ)': c.stats?.totalSpent || 0,
          'Lượt dịch vụ': c.stats?.totalVisits || 0,
        };

        if (!c.vehicles || c.vehicles.length === 0) {
          excelData.push({
            ...baseCustomer,
            'Biển số xe': '',
            'Hãng xe': '',
            'Dòng xe': '',
            'Cỡ xe': ''
          });
        } else {
          c.vehicles.forEach((v: any) => {
            excelData.push({
              ...baseCustomer,
              'Biển số xe': v.licensePlate || '',
              'Hãng xe': v.make || '',
              'Dòng xe': v.model || '',
              'Cỡ xe': v.vehicleSize ? {
                SMALL: 'Nhỏ',
                MEDIUM: 'Vừa',
                LARGE: 'Lớn',
                EXTRA_LARGE: 'Rất lớn',
                TRUCK: 'Xe tải'
              }[v.vehicleSize as string] || v.vehicleSize : ''
            });
          });
        }
      });

      // Tạo phần Header của báo cáo
      const dateStr = new Date().toLocaleDateString('vi-VN');
      const timeStr = new Date().toLocaleTimeString('vi-VN');
      const exportTime = `${timeStr} ${dateStr}`;
      const exporterName = user?.full_name || user?.username || user?.phone || 'Nhân viên';

      const reportHeader = [
        ["TRUNG TÂM BẢO DƯỠNG & SỬA CHỮA XE Ô TÔ UTE"],
        ["BÁO CÁO DANH SÁCH KHÁCH HÀNG VÀ PHƯƠNG TIỆN"],
        [],
        ["Ngày xuất báo cáo:", exportTime],
        ["Người xuất báo cáo:", exporterName],
        [] // Dòng trống trước bảng
      ];

      // Khởi tạo worksheet từ AoA (Array of Arrays) cho Header (Dynamic import để giảm bundle ban đầu)
      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.aoa_to_sheet(reportHeader);

      // Thêm data dạng JSON vào worksheet, bắt đầu từ dòng thứ 7 (A7)
      XLSX.utils.sheet_add_json(worksheet, excelData, { origin: "A7" });

      // Merge các ô title để đẹp hơn (gộp từ cột A đến J, tương đương index 0-9)
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }, // Dòng 1
        { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }  // Dòng 2
      ];

      // Adjust column widths
      worksheet['!cols'] = [
        { wch: 8 },  // Mã KH
        { wch: 25 }, // Tên KH
        { wch: 15 }, // SĐT
        { wch: 25 }, // Email
        { wch: 20 }, // Tổng chi tiêu
        { wch: 15 }, // Lượt dịch vụ
        { wch: 15 }, // Biển số
        { wch: 15 }, // Hãng
        { wch: 15 }, // Dòng
        { wch: 15 }  // Cỡ xe
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Khách hàng");

      const fileDateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Bao_Cao_Khach_Hang_${fileDateStr}.xlsx`);
    } catch (error) {
      console.error('Lỗi khi xuất báo cáo', error);
      toast.error('Có lỗi xảy ra khi xuất báo cáo!');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setSelectedCustomer(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (customer: any) => {
    setSelectedCustomer(customer);
    setIsFormModalOpen(true);
  };

  const openViewModal = (customer: any) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

  // Aggregates for CRM Bento Header
  const totalCustomers = totalRecords;
  const pageVehicleCount = customers.reduce((acc, c) => acc + (c.vehicles?.length || 0), 0);
  const pageTotalSpent = customers.reduce((acc, c) => acc + (c.stats?.totalSpent || 0), 0);

  return (
    <>
      <ConfirmModal
        isOpen={isConfirmOpen}
        title={
          confirmAction === 'delete'
            ? 'Xác nhận vô hiệu hóa'
            : confirmAction === 'restore'
            ? 'Xác nhận khôi phục'
            : 'Xác nhận xóa vĩnh viễn'
        }
        message={
          confirmAction === 'delete'
            ? 'Bạn có chắc chắn muốn vô hiệu hóa khách hàng này không? Dữ liệu lịch sử giao dịch (phiếu công việc, hóa đơn...) vẫn sẽ được giữ lại.'
            : confirmAction === 'restore'
            ? 'Bạn có muốn khôi phục lại hồ sơ của khách hàng này không?'
            : 'Bạn có chắc chắn muốn xóa vĩnh viễn khách hàng này không? Mọi thông tin phương tiện sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.'
        }
        confirmText={
          confirmAction === 'delete'
            ? 'Vô hiệu hóa'
            : confirmAction === 'restore'
            ? 'Khôi phục'
            : 'Xóa vĩnh viễn'
        }
        cancelText="Hủy"
        isDestructive={confirmAction !== 'restore'}
        onConfirm={executeConfirmAction}
        onCancel={() => setIsConfirmOpen(false)}
      />

      <CustomerFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveCustomer}
        initialData={selectedCustomer}
      />

      <CustomerDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        customerData={selectedCustomer}
      />

      <div className="space-y-6 w-full">
        {/* 1. SaaS Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Khách hàng &amp; Phương tiện
          </h1>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => fetchCustomers(search, currentPage, activeTab)}
              className="h-10 px-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-blue-300 hover:bg-blue-50/40 text-slate-700 hover:text-[#0866ff] text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin text-[#0866ff]' : ''}`}>
                sync
              </span>
              <span>Đồng bộ CRM</span>
            </button>
            <button
              onClick={openAddModal}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0866ff]/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>+ Thêm mới</span>
            </button>
          </div>
        </div>

        {/* 2. Asymmetrical 12-Col CRM Bento Header (5 + 4 + 3) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Hero Card: Tổng khách hàng (5 cols) */}
          <div className="md:col-span-5 rounded-2xl saas-hero-gradient text-white p-5 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute inset-0 saas-subtle-grid pointer-events-none" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-blue-100/90">Tổng khách hàng hệ thống</span>
                <div className="text-3xl font-mono font-extrabold tabular-nums tracking-tight mt-1">
                  {totalCustomers}{' '}
                  <span className="text-sm font-sans font-medium text-blue-100/80">hồ sơ</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-xs">
                <span className="material-symbols-outlined text-[22px] text-white">groups</span>
              </div>
            </div>
            <div className="relative z-10 mt-4 pt-3.5 border-t border-white/15 flex items-center justify-between text-xs text-blue-50">
              <span>Trạng thái danh sách</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/15 font-semibold">
                {activeTab === 'active' ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
              </span>
            </div>
          </div>

          {/* Tile 2: Phương tiện hiển thị (4 cols) */}
          <div className="md:col-span-4 saas-card p-5 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">Phương tiện liên kết</span>
                <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-slate-900 mt-1">
                  {pageVehicleCount}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 text-[#0866ff] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">directions_car</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Trên trang hiện tại</span>
              <span className="text-[#0866ff] font-semibold">Đã định danh biển số</span>
            </div>
          </div>

          {/* Tile 3: Tổng chi tiêu trang hiện tại (3 cols) */}
          <div className="md:col-span-3 saas-card p-5 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">Chi tiêu tích lũy</span>
                <div className="text-xl sm:text-2xl font-mono font-extrabold tabular-nums text-emerald-600 mt-1 truncate">
                  {formatVND(pageTotalSpent)}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">payments</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Giá trị lũy kế</span>
              <span className="text-emerald-700 font-semibold">Khách hàng thân thiết</span>
            </div>
          </div>
        </div>

        {/* 3. Main Table Container Card */}
        <div className="saas-card flex flex-col overflow-hidden">
          {/* Tabs & Filter Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white">
            {/* Segmented Pill Tabs */}
            <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100/90 border border-slate-200/70 rounded-xl self-start max-w-full">
              <button
                onClick={() => {
                  setActiveTab('active');
                  setSearch('');
                  setCurrentPage(1);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'active'
                    ? 'bg-white text-[#0866ff] shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đang hoạt động
              </button>
              <button
                onClick={() => {
                  setActiveTab('deleted');
                  setSearch('');
                  setCurrentPage(1);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'deleted'
                    ? 'bg-white text-rose-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đã vô hiệu hóa
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 flex-1 lg:justify-end">
              <div className="relative min-w-0 sm:min-w-[260px] max-w-sm w-full flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200/80 bg-slate-50/80 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#0866ff] focus:ring-2 focus:ring-[#0866ff]/15 transition-all"
                  placeholder="Tìm theo Tên, SĐT, Biển số..."
                  type="text"
                />
              </div>
              <button
                onClick={handleExportExcel}
                className="h-10 px-3.5 rounded-xl border border-emerald-200/90 bg-emerald-50/80 text-emerald-700 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100/80 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-emerald-600">
                  description
                </span>
                <span>Xuất Excel</span>
              </button>
            </div>
          </div>

          {/* Customer Data Table */}
          <div className="overflow-x-auto w-full min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-2">
                <span className="material-symbols-outlined animate-spin text-[32px] text-[#0866ff]">
                  progress_activity
                </span>
                <span className="text-xs">Đang tải danh sách khách hàng...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-12 gap-3 text-center">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">error</span>
                </div>
                <p className="text-xs font-semibold text-rose-800 max-w-md">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchCustomers(search, currentPage, activeTab)}
                  className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  <span>Thử lại</span>
                </button>
              </div>
            ) : customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <span className="material-symbols-outlined text-[44px] opacity-40 mb-2">
                  group_off
                </span>
                <p className="text-xs font-semibold text-slate-600">
                  {search ? `Không tìm thấy khách hàng nào khớp với "${search}"` : 'Chưa có hồ sơ khách hàng nào trong danh sách'}
                </p>
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="mt-2 text-xs text-[#0866ff] hover:underline font-semibold cursor-pointer"
                  >
                    Xóa bộ lọc tìm kiếm
                  </button>
                ) : activeTab === 'active' ? (
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="mt-3 h-10 px-4 rounded-xl bg-[#0866ff] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                    <span>+ Thêm mới</span>
                  </button>
                ) : null}
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="px-5 py-3.5">Khách hàng</th>
                    <th className="px-5 py-3.5">Số điện thoại</th>
                    <th className="px-5 py-3.5">Phương tiện &amp; Biển số</th>
                    <th className="px-5 py-3.5 text-right">Tổng chi tiêu</th>
                    <th className="px-5 py-3.5 text-center w-32">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 text-sm">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-blue-50/25 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0866ff] to-[#0050cd] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs">
                            {c.fullName.split(' ').pop()?.[0]?.toUpperCase() || 'K'}
                          </div>
                          <div className="flex flex-col">
                            <span
                              onClick={() => openViewModal(c)}
                              className="font-bold text-slate-900 hover:text-[#0866ff] cursor-pointer flex items-center gap-1 transition-colors"
                            >
                              {c.fullName}
                            </span>
                            <span className="text-xs text-slate-400 truncate max-w-[180px]">
                              {c.email || 'Chưa cập nhật email'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700 font-mono text-xs font-semibold">
                          <span className="material-symbols-outlined text-[15px] text-[#0866ff]">
                            phone_iphone
                          </span>
                          <span>{c.phone}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {c.vehicles && c.vehicles.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {c.vehicles.map((v: any, vIdx: number) => (
                              <div key={v.id || vIdx} className="flex items-center gap-2.5">
                                <span className="px-2 py-0.5 rounded bg-slate-900 font-mono text-xs font-bold text-white tracking-wider whitespace-nowrap">
                                  {v.licensePlate}
                                </span>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[160px]">
                                    {v.make} {v.model}
                                  </span>
                                  <span className="text-[11px] text-slate-400 truncate">
                                    Màu {v.color || 'Chưa rõ'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Chưa đăng ký xe</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="font-bold font-mono tabular-nums text-sm text-[#0866ff]">
                          {formatVND(c.stats?.totalSpent || 0)}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {c.stats?.totalVisits || 0} lượt dịch vụ
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {activeTab === 'active' ? (
                            <>
                              <button
                                onClick={() => openViewModal(c)}
                                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 flex items-center justify-center text-[#0866ff] transition-colors cursor-pointer"
                                title="Xem hồ sơ"
                              >
                                <span className="material-symbols-outlined text-[17px]">
                                  visibility
                                </span>
                              </button>
                              <button
                                onClick={() => openEditModal(c)}
                                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-[#0866ff] transition-colors cursor-pointer"
                                title="Chỉnh sửa"
                              >
                                <span className="material-symbols-outlined text-[17px]">edit</span>
                              </button>
                              <button
                                onClick={() => openConfirm(c.id, 'delete')}
                                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Vô hiệu hóa"
                              >
                                <span className="material-symbols-outlined text-[17px]">delete</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => openConfirm(c.id, 'restore')}
                                className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 flex items-center justify-center text-emerald-600 transition-colors cursor-pointer"
                                title="Khôi phục"
                              >
                                <span className="material-symbols-outlined text-[17px]">
                                  restore
                                </span>
                              </button>
                              <button
                                onClick={() => openConfirm(c.id, 'hard_delete')}
                                className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/80 flex items-center justify-center text-rose-600 transition-colors cursor-pointer"
                                title="Xóa vĩnh viễn"
                              >
                                <span className="material-symbols-outlined text-[17px]">
                                  delete_forever
                                </span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination UI */}
          {totalRecords > 0 && (
            <TablePagination
              totalRecords={totalRecords}
              totalPages={Math.max(1, totalPages)}
              currentPage={currentPage}
              onPageChange={(page) => fetchCustomers(search, page, activeTab)}
              currentCount={customers.length}
              recordLabel="khách hàng"
            />
          )}
        </div>
      </div>
    </>
  );
}
