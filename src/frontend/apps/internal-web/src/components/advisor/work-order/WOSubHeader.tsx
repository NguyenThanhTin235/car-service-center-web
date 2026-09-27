'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getWorkOrders, WorkOrder } from '@/lib/api/work-order.api';

type Props = {
  woNumber: string;
  currentIndex?: number;
  totalCount?: number;
  onNext?: () => void;
  onPrev?: () => void;
};

export default function WOSubHeader({ woNumber, currentIndex = 0, totalCount = 0, onNext, onPrev }: Props) {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WorkOrder[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!isSearchOpen) return;
    const timeoutId = setTimeout(() => {
      const fetchSearch = async () => {
        setIsSearching(true);
        try {
          const res = await getWorkOrders({ search: searchQuery, limit: 5 });
          if (res.success && res.data) {
            setSearchResults(res.data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      };
      fetchSearch();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, isSearchOpen]);

  const handleResultClick = (id: number) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    router.push(`/advisor/work-orders/${id}`);
  };

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-outline-variant bg-surface-container-lowest">
      {/* Left: Actions & Title */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 border border-outline-variant rounded-md overflow-hidden bg-surface-container-lowest shadow-sm">
          <button className="px-3 py-1.5 text-label-md font-semibold text-white bg-primary hover:bg-primary/90 transition-colors">
            Lưu
          </button>
          <button className="px-3 py-1.5 text-label-md font-semibold text-on-surface hover:bg-surface-container-low border-l border-outline-variant transition-colors">
            Hủy
          </button>
        </div>
        <button className="flex items-center gap-1 px-3 py-1.5 text-label-md font-semibold text-on-surface border border-outline-variant rounded-md hover:bg-surface-container-low transition-colors shadow-sm">
          <span className="material-symbols-outlined text-[18px]">print</span>
          In phiếu
        </button>
        
        <div className="w-px h-6 bg-outline-variant mx-2"></div>
        
        <h1 className="text-title-md font-bold text-on-surface flex items-center gap-2 whitespace-nowrap">
          Work Orders <span className="text-outline">/</span> {woNumber}
          <span className="material-symbols-outlined text-[16px] text-outline cursor-pointer hover:text-primary">info</span>
        </h1>
      </div>

      {/* Right: Pipeline */}
      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
        <div className="relative flex-shrink-0 w-64" ref={searchRef}>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
            <input
              type="text"
              placeholder="Tìm nhanh — Biển số hoặc Mã phiếu..."
              className="w-full pl-9 pr-3 py-1.5 text-label-md bg-surface-container-low border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors text-on-surface placeholder:text-on-surface-variant/70"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isSearchOpen) setIsSearchOpen(true);
              }}
              onFocus={() => {
                if (searchQuery) setIsSearchOpen(true);
              }}
            />
          </div>

          {/* Search Dropdown */}
          {isSearchOpen && searchQuery.trim() !== '' && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-surface rounded-lg shadow-lg border border-outline-variant z-50 overflow-hidden flex flex-col">
              <div className="max-h-64 overflow-y-auto styled-scrollbar bg-surface-container-lowest">
                {isSearching ? (
                  <div className="p-4 text-center text-on-surface-variant text-body-sm flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                    Đang tìm kiếm...
                  </div>
                ) : searchResults.length > 0 ? (
                  <ul className="py-1">
                    {searchResults.map(wo => {
                      const statusMap: Record<string, string> = {
                        'DRAFT': 'Tiếp nhận',
                        'IN_PLANNING': 'Tiếp nhận',
                        'NEW_INTAKE': 'Tiếp nhận',
                        'PENDING_APPROVAL': 'Chờ duyệt',
                        'APPROVED': 'Đã duyệt',
                        'IN_PROGRESS': 'Đang sửa',
                        'REPAIRING': 'Đang sửa',
                        'QC': 'Kiểm tra',
                        'BILLING_REQUESTED': 'Chờ TT',
                        'PENDING_PAYMENT': 'Chờ TT',
                        'FINANCIAL_CLEARED': 'Chờ giao xe',
                        'READY': 'Chờ giao xe',
                        'RELEASED': 'Đóng',
                        'CLOSED': 'Đóng',
                        'COMPLETED': 'Đóng',
                        'CANCELLED': 'Đã hủy'
                      };
                      return (
                      <li key={wo.id}>
                        <button
                          onClick={() => handleResultClick(wo.id)}
                          className="w-full text-left px-4 py-2 hover:bg-surface-container-low focus:bg-surface-container-low outline-none transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-on-surface text-label-md">{wo.wo_number}</span>
                            <span className="text-label-sm px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-medium uppercase">{statusMap[wo.status] || wo.status}</span>
                          </div>
                          <div className="text-body-sm text-on-surface-variant mt-1">
                            {wo.vehicle?.license_plate || 'N/A'} • {wo.customer?.full_name || 'Khách lẻ'}
                          </div>
                        </button>
                      </li>
                    )})}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-on-surface-variant text-body-sm">
                    Không tìm thấy kết quả nào
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {totalCount > 0 && (
          <div className="flex items-center gap-2 text-label-md text-on-surface-variant whitespace-nowrap">
            <span>{currentIndex} / {totalCount}</span>
            <div className="flex items-center">
              <button 
                onClick={onPrev}
                disabled={currentIndex <= 1}
                className="w-6 h-6 flex items-center justify-center hover:bg-surface-container-high rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <button 
                onClick={onNext}
                disabled={currentIndex >= totalCount}
                className="w-6 h-6 flex items-center justify-center hover:bg-surface-container-high rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
