'use client';

import React, { useState, useEffect } from 'react';
import CustomerFormModal from '@/components/customers/CustomerFormModal';
import CustomerDetailModal from '@/components/customers/CustomerDetailModal';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useSelector } from 'react-redux';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const user = useSelector((state: any) => state.auth?.user);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null); // Dùng chung cho View & Edit

  const fetchCustomers = async (searchQuery = '', page = 1) => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/customers', {
        params: { search: searchQuery, page, limit: 5 },
        withCredentials: true,
      });
      setCustomers(res.data.data);
      if (res.data.pagination) {
        setCurrentPage(res.data.pagination.currentPage);
        setTotalPages(res.data.pagination.totalPages);
        setTotalRecords(res.data.pagination.totalRecords);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu khách hàng', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchCustomers(search, 1);
    }, 500); // Debounce 500ms
    
    return () => clearTimeout(debounceTimer);
  }, [search]);

  const handleSaveCustomer = async (data: any, id?: number) => {
    try {
      if (id) {
        // Edit Mode
        await axios.put(`http://localhost:5000/api/customers/${id}`, data, { withCredentials: true });
      } else {
        // Create Mode
        await axios.post('http://localhost:5000/api/customers', data, { withCredentials: true });
      }
      await fetchCustomers(search, currentPage); // Refresh sau khi lưu
    } catch (error: any) {
      console.error('Lỗi khi lưu khách hàng', error);
      throw error;
    }
  };

  const handleExportExcel = async () => {
    try {
      setLoading(true);
      // Fetch all for the report
      const res = await axios.get('http://localhost:5000/api/customers', {
        params: { search, limit: 10000 },
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

      // Khởi tạo worksheet từ AoA (Array of Arrays) cho Header
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
      alert('Có lỗi xảy ra khi xuất báo cáo!');
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

  // Mock aggregates based on the unfiltered array for stats
  const totalCustomers = totalRecords; // Sử dụng dữ liệu từ DB thay vì mảng cục bộ

  return (
    <>
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

      {/* Breadcrumb & Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-headline-lg font-headline-lg text-on-surface">Quản lý Khách hàng & Phương tiện</h1>
            <span className="px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-primary-container text-primary font-bold">
              CRM Portal
            </span>
          </div>
          <p className="text-body-md font-body-md text-secondary">
            Quản lý thông tin khách hàng, lịch sử bảo dưỡng và phương tiện.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button 
            onClick={() => fetchCustomers(search, currentPage)}
            className="h-9 px-3.5 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low text-on-surface text-label-md font-label-md font-medium flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]">
            <span className="material-symbols-outlined text-[18px]">sync</span>
            <span>Đồng bộ CRM</span>
          </button>
          <button
            onClick={openAddModal}
            className="h-9 px-4 rounded-lg bg-primary-container hover:bg-primary text-on-primary text-label-md font-label-md font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>+ Thêm mới</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-label-sm font-label-sm text-secondary">Tổng khách hàng</span>
            <span className="text-headline-md font-headline-md text-on-surface font-bold mt-0.5">{totalCustomers}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">groups</span>
          </div>
        </div>
      </div>


      {/* Main Table Container Card */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-outline-variant flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative min-w-[260px] max-w-sm flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-outline-variant bg-surface text-body-md font-body-md placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
                placeholder="Tìm theo Tên, SĐT, Biển số..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <button 
              onClick={handleExportExcel}
              className="h-9 px-3.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-label-md font-label-md font-semibold flex items-center gap-1.5 shadow-sm hover:bg-emerald-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-700">description</span>
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>

        {/* Customer Data Table */}
        <div className="overflow-x-auto w-full min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center p-10 text-secondary">
              <span className="material-symbols-outlined animate-spin text-[32px]">progress_activity</span>
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-secondary">
              <span className="material-symbols-outlined text-[48px] opacity-50 mb-2">group_off</span>
              <p>Không tìm thấy khách hàng nào</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-label-md font-label-md text-secondary h-11">
                  <th className="px-4 py-2 font-semibold">Khách hàng</th>
                  <th className="px-4 py-2 font-semibold">Số điện thoại</th>
                  <th className="px-4 py-2 font-semibold">Phương tiện & Biển số</th>
                  <th className="px-4 py-2 font-semibold text-right">Tổng chi tiêu</th>
                  <th className="px-4 py-2 font-semibold text-center w-28">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-body-md font-body-md">
                {customers.map((c, idx) => (
                  <tr key={c.id} className={`hover:bg-surface-container-lowest transition-colors group ${idx % 2 === 0 ? 'bg-surface/50' : 'bg-surface-container-lowest'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary font-bold flex items-center justify-center text-label-md shrink-0 border border-outline-variant/50">
                          {c.fullName.split(' ').pop()?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div className="flex flex-col">
                          <span 
                            onClick={() => openViewModal(c)}
                            className="font-bold text-on-surface hover:text-primary cursor-pointer flex items-center gap-1"
                          >
                            {c.fullName}
                          </span>
                          <span className="text-body-sm font-body-sm text-secondary truncate max-w-[150px]">{c.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-on-surface font-code-mono font-medium">
                        <span className="material-symbols-outlined text-[16px] text-secondary">phone_iphone</span>
                        <span>{c.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.vehicles && c.vehicles.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {c.vehicles.map((v: any, vIdx: number) => (
                            <div key={v.id || vIdx} className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded border border-slate-700 bg-slate-100 font-code-mono text-label-sm font-bold text-slate-900 tracking-wider shadow-2xs whitespace-nowrap">
                                {v.licensePlate}
                              </span>
                              <div className="flex flex-col min-w-0">
                                <span className="text-body-sm font-medium text-on-surface truncate max-w-[150px]">
                                  {v.make} {v.model}
                                </span>
                                <span className="text-[11px] text-secondary truncate">
                                  Màu {v.color || 'N/A'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-secondary italic text-body-sm">Chưa có xe</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-on-surface font-code-mono text-title-sm text-primary">
                        {(c.stats?.totalSpent || 0).toLocaleString('vi-VN')} đ
                      </span>
                      <span className="block text-[10px] text-secondary">
                        {c.stats?.totalVisits || 0} lượt dịch vụ
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                        <button onClick={() => openViewModal(c)} className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-primary" title="Xem hồ sơ">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button onClick={() => openEditModal(c)} className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface" title="Chỉnh sửa">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest">
            <span className="text-body-sm text-secondary">
              Hiển thị trang {currentPage} của {totalPages} ({totalRecords} bản ghi)
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => fetchCustomers(search, currentPage - 1)}
                className="h-8 px-3 rounded border border-outline-variant bg-surface text-label-sm font-semibold hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Trước
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => fetchCustomers(search, idx + 1)}
                    className={`w-8 h-8 rounded border flex items-center justify-center text-label-sm font-semibold transition-colors ${
                      currentPage === idx + 1
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-outline-variant bg-surface hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => fetchCustomers(search, currentPage + 1)}
                className="h-8 px-3 rounded border border-outline-variant bg-surface text-label-sm font-semibold hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
