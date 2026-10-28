'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  WorkOrder,
  WoJobPart,
  addJobPart,
  updateJobPart,
  getAIPartSuggestions,
  AIPartSuggestion,
  AIPartSuggestionData,
} from '@/lib/api/work-order.api';
import { inventoryApi, AvailableInventoryItem } from '@/lib/api/inventory.api';
import toast from 'react-hot-toast';

interface AddPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder;
  preselectedJobId?: number | null;
  editingPart?: WoJobPart | null;
  onSuccess: () => void;
}

export default function AddPartModal({
  isOpen,
  onClose,
  workOrder,
  preselectedJobId,
  editingPart,
  onSuccess,
}: AddPartModalProps) {
  // Extract all available jobs across services
  const availableJobs = useMemo(() => {
    const list: Array<{ id: number; name: string; serviceName: string }> = [];
    (workOrder.services || []).forEach((service) => {
      (service.jobs || []).forEach((job) => {
        list.push({
          id: job.id,
          name: job.name,
          serviceName: service.name,
        });
      });
    });
    return list;
  }, [workOrder]);

  // Form states
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const jobDropdownRef = useRef<HTMLDivElement>(null);

  // AI Suggestion states
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiData, setAiData] = useState<AIPartSuggestionData | null>(null);
  const [aiExpanded, setAiExpanded] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryItems, setInventoryItems] = useState<AvailableInventoryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AvailableInventoryItem | null>(null);
  const [plannedQuantity, setPlannedQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const currentSelectedJob = useMemo(() => {
    return availableJobs.find((j) => j.id === selectedJobId) || null;
  }, [availableJobs, selectedJobId]);

  const filteredJobs = useMemo(() => {
    if (!jobSearchTerm.trim()) return availableJobs;
    const q = jobSearchTerm.toLowerCase().trim();
    return availableJobs.filter(
      (j) => j.name.toLowerCase().includes(q) || j.serviceName.toLowerCase().includes(q)
    );
  }, [availableJobs, jobSearchTerm]);

  // Handle outside click to close job dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (jobDropdownRef.current && !jobDropdownRef.current.contains(e.target as Node)) {
        setIsJobDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize or reset state on modal open
  useEffect(() => {
    if (!isOpen) return;

    setIsJobDropdownOpen(false);
    setJobSearchTerm('');
    setAiData(null);
    setLoadingAi(false);
    setAiExpanded(true);

    if (editingPart) {
      setSelectedJobId(editingPart.job_id);
      setPlannedQuantity(Number(editingPart.planned_quantity) || 1);
      setUnitPrice(Number(editingPart.unit_price) || 0);

      if (editingPart.item) {
        setSelectedItem({
          id: editingPart.item.id,
          sku: editingPart.item.sku,
          name: editingPart.item.part_category?.name
            ? `${editingPart.item.part_category.name}${editingPart.item.brand?.name ? ' - ' + editingPart.item.brand.name : ''}`
            : editingPart.item.sku,
          sellingPrice: Number(editingPart.item.selling_price) || 0,
          onHand: editingPart.item.on_hand ?? 0,
          isActive: true,
          uom: editingPart.item.part_category?.uom,
          brand: editingPart.item.brand,
          partCategory: editingPart.item.part_category as any,
        });
      }
    } else {
      const initialJobId = preselectedJobId || (availableJobs.length > 0 ? availableJobs[0].id : null);
      setSelectedJobId(initialJobId);
      setSelectedItem(null);
      setSearchTerm('');
      setPlannedQuantity(1);
      setUnitPrice(0);
      loadInventoryItems('');

      if (initialJobId) {
        handleFetchAiSuggestions(initialJobId, false);
      }
    }
  }, [isOpen, editingPart, preselectedJobId, availableJobs]);

  // Load inventory items with optional search
  const loadInventoryItems = async (query: string) => {
    try {
      setLoadingItems(true);
      const res = await inventoryApi.getItems({ search: query, limit: 15 });
      if (res.success && res.data?.items) {
        setInventoryItems(res.data.items.filter((item) => item.isActive));
      }
    } catch (err: any) {
      console.error('Failed to load inventory items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (!isOpen || editingPart) return;
    const timer = setTimeout(() => {
      loadInventoryItems(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, isOpen, editingPart]);

  const handleSelectItem = (item: AvailableInventoryItem) => {
    setSelectedItem(item);
    setUnitPrice(item.sellingPrice || 0);
  };

  // Fetch AI Part Suggestions for the selected job (hỗ trợ refresh cache)
  const handleFetchAiSuggestions = async (targetId?: number | null, refresh = false) => {
    const jId = targetId || selectedJobId;
    if (!jId) return;

    try {
      setLoadingAi(true);
      setAiExpanded(true);
      const res = await getAIPartSuggestions(workOrder.id, jId, refresh);
      if (res.success && res.data) {
        setAiData(res.data);
      } else {
        toast.error(res.message || 'Không thể tạo gợi ý phụ tùng từ AI');
      }
    } catch (err: any) {
      console.error('Failed to get AI part suggestions:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi gọi AI gợi ý phụ tùng');
    } finally {
      setLoadingAi(false);
    }
  };

  // Apply an AI Suggestion to the current form
  const handleApplyAiSuggestion = (suggestion: AIPartSuggestion) => {
    const itemToSelect: AvailableInventoryItem = {
      id: suggestion.item_id,
      sku: suggestion.sku,
      name: suggestion.part_name,
      sellingPrice: Number(suggestion.unit_price) || 0,
      onHand: suggestion.on_hand,
      isActive: true,
      uom: suggestion.uom ? { id: 0, name: suggestion.uom } : undefined,
      brand: suggestion.brand_name ? { id: 0, name: suggestion.brand_name } : undefined,
      partCategory: suggestion.category_name
        ? { id: 0, code: '', name: suggestion.category_name, itemType: 'PART' }
        : undefined,
    };

    setSelectedItem(itemToSelect);
    setPlannedQuantity(suggestion.suggested_quantity);
    setUnitPrice(Number(suggestion.unit_price) || 0);

    // Ensure it's in the inventoryItems list for consistent display
    setInventoryItems((prev) => {
      if (prev.some((it) => it.id === itemToSelect.id)) return prev;
      return [itemToSelect, ...prev];
    });

    toast.success(`Đã áp dụng: ${suggestion.part_name} (${suggestion.suggested_quantity} ${suggestion.uom || ''})`);
  };

  const totalAmount = useMemo(() => {
    return Math.max(0, plannedQuantity * unitPrice);
  }, [plannedQuantity, unitPrice]);

  const isStockShortage = useMemo(() => {
    if (!selectedItem) return false;
    return selectedItem.onHand < plannedQuantity;
  }, [selectedItem, plannedQuantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) {
      toast.error('Vui lòng chọn công việc thực hiện');
      return;
    }
    if (!editingPart && !selectedItem) {
      toast.error('Vui lòng chọn phụ tùng từ danh mục kho');
      return;
    }
    if (plannedQuantity <= 0) {
      toast.error('Số lượng dự kiến phải lớn hơn 0');
      return;
    }

    try {
      setSubmitting(true);
      if (editingPart) {
        await updateJobPart(workOrder.id, selectedJobId, editingPart.id, {
          planned_quantity: plannedQuantity,
          unit_price: unitPrice,
        });
        toast.success('Cập nhật phụ tùng thành công');
      } else {
        await addJobPart(workOrder.id, selectedJobId, {
          item_id: selectedItem!.id,
          planned_quantity: plannedQuantity,
          unit_price: unitPrice,
        });
        toast.success('Khai báo phụ tùng vào công việc thành công');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi lưu phụ tùng');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">construction</span>
            </div>
            <div>
              <h2 className="text-title-medium font-bold text-on-surface">
                {editingPart ? 'Chỉnh sửa phụ tùng / vật tư' : 'Khai báo phụ tùng cho công việc'}
              </h2>
              <p className="text-body-small text-on-surface-variant">
                Phiếu công việc: <span className="font-semibold text-primary">{workOrder.wo_number}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 styled-scrollbar">
          {/* Target Job Selection */}
          <div className="relative" ref={jobDropdownRef}>
            <label className="block text-label-medium font-semibold text-on-surface mb-1.5">
              Công việc chỉ định <span className="text-error">*</span>
            </label>
            {editingPart ? (
              <div className="px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-body-medium">
                {editingPart.job?.name || 'Công việc không xác định'}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  disabled={Boolean(preselectedJobId) || availableJobs.length === 0}
                  onClick={() => setIsJobDropdownOpen((prev) => !prev)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-surface text-left flex items-center justify-between text-body-medium transition-all ${
                    isJobDropdownOpen
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-outline-variant hover:border-outline'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    {currentSelectedJob ? (
                      <>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary/10 text-primary shrink-0 max-w-[130px] truncate">
                          {currentSelectedJob.serviceName}
                        </span>
                        <span className="font-semibold text-on-surface truncate">
                          {currentSelectedJob.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-on-surface-variant">-- Chọn công việc --</span>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px] shrink-0 transition-transform duration-200">
                    {isJobDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                  </span>
                </button>

                {/* Dropdown Menu Popup - constrained within modal width */}
                {isJobDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                    {/* Search inside jobs list if more than 4 jobs */}
                    {availableJobs.length > 4 && (
                      <div className="p-2 border-b border-outline-variant/50 bg-surface-container-low/40">
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">
                            search
                          </span>
                          <input
                            type="text"
                            placeholder="Tìm nhanh công việc..."
                            value={jobSearchTerm}
                            onChange={(e) => setJobSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-outline-variant bg-surface text-on-surface text-body-small focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    )}

                    {/* Jobs List */}
                    <div className="max-h-56 overflow-y-auto divide-y divide-outline-variant/30 styled-scrollbar">
                      {filteredJobs.length === 0 ? (
                        <div className="p-4 text-center text-body-small text-on-surface-variant">
                          Không tìm thấy công việc phù hợp
                        </div>
                      ) : (
                        filteredJobs.map((j) => {
                          const isSelected = j.id === selectedJobId;
                          return (
                            <div
                              key={j.id}
                              onClick={() => {
                                setSelectedJobId(j.id);
                                setIsJobDropdownOpen(false);
                                setJobSearchTerm('');
                                setAiData(null);
                                handleFetchAiSuggestions(j.id, false);
                              }}
                              className={`p-3 cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-primary/10 border-l-4 border-l-primary'
                                  : 'hover:bg-surface-container-low'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-surface-container text-on-surface-variant">
                                  {j.serviceName}
                                </span>
                              </div>
                              <div className="font-semibold text-on-surface text-body-medium break-words leading-snug">
                                {j.name}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
            {availableJobs.length === 0 && (
              <p className="text-body-small text-amber-600 mt-1">
                ⚠️ Cần tạo ít nhất một công việc trong tab &quot;Hạng mục sửa chữa&quot; trước khi thêm phụ tùng.
              </p>
            )}
          </div>

          {/* AI Parts Suggestion Section */}
          {!editingPart && selectedJobId && (
            <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.04] via-surface to-surface-container-low/40 p-4 transition-all duration-300 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-primary/80 text-on-primary flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-title-small font-bold text-on-surface truncate">
                        AI Đề xuất phụ tùng định mức
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                        RAG Gemini
                      </span>
                    </div>
                    <p className="text-body-small text-on-surface-variant truncate">
                      Gợi ý phụ tùng theo thông số xe &amp; kinh nghiệm kỹ thuật
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!aiData && !loadingAi && (
                    <button
                      type="button"
                      onClick={() => handleFetchAiSuggestions()}
                      className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-label-medium font-semibold shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                      Nhận gợi ý
                    </button>
                  )}

                  {aiData && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleFetchAiSuggestions(selectedJobId, true)}
                        disabled={loadingAi}
                        title="Tải lại gợi ý từ AI (Làm mới cache)"
                        className="w-8 h-8 rounded-lg border border-outline-variant hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
                      >
                        <span className={`material-symbols-outlined text-[16px] ${loadingAi ? 'animate-spin' : ''}`}>
                          refresh
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiExpanded(!aiExpanded)}
                        className="w-8 h-8 rounded-lg border border-outline-variant hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {aiExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Loading State with Shimmer */}
              {loadingAi && (
                <div className="mt-3.5 pt-3.5 border-t border-outline-variant/40 space-y-3">
                  <div className="flex items-center gap-2 text-body-small font-medium text-primary">
                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                    <span>AI đang phân tích thông số xe, định mức và đối soát kho...</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-xl bg-surface-container animate-pulse" />
                    <div className="h-16 rounded-xl bg-surface-container animate-pulse" />
                  </div>
                </div>
              )}

              {/* AI Content Result */}
              {!loadingAi && aiData && aiExpanded && (
                <div className="mt-3.5 pt-3.5 border-t border-outline-variant/40 space-y-3 animate-fade-in">
                  {/* Technical Advice Banner */}
                  {aiData.technical_advice && (
                    <div className="p-2.5 rounded-xl bg-primary/[0.06] border border-primary/15 text-body-small text-on-surface flex items-start gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">
                        info
                      </span>
                      <p className="leading-relaxed">
                        <strong className="text-primary font-semibold">Tư vấn kỹ thuật: </strong>
                        {aiData.technical_advice}
                      </p>
                    </div>
                  )}

                  {/* Suggestions List */}
                  {aiData.suggestions.length === 0 ? (
                    <div className="p-3 text-center text-body-small text-on-surface-variant bg-surface-container/30 rounded-xl">
                      Công việc này thuần thao tác kỹ thuật hoặc xưởng chưa có linh kiện định mức tương ứng trong kho.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 styled-scrollbar">
                      {aiData.suggestions.map((sug, idx) => {
                        const isChosen = selectedItem?.id === sug.item_id;
                        return (
                          <div
                            key={`${sug.item_id}-${idx}`}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                              isChosen
                                ? 'bg-primary/10 border-primary ring-1 ring-primary/30'
                                : 'bg-surface hover:bg-surface-container-low border-outline-variant/60'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  {sug.sku}
                                </span>
                                <span className="font-semibold text-on-surface text-body-medium truncate">
                                  {sug.part_name}
                                </span>
                                {sug.brand_name && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-container text-on-surface-variant">
                                    {sug.brand_name}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-body-small mt-1 text-on-surface-variant">
                                <span className="font-semibold text-primary">
                                  Đề xuất: {sug.suggested_quantity} {sug.uom}
                                </span>
                                <span>•</span>
                                <span
                                  className={`inline-flex items-center gap-1 font-medium ${
                                    sug.is_in_stock ? 'text-emerald-600' : 'text-amber-600'
                                  }`}
                                >
                                  {sug.is_in_stock
                                    ? `Tồn: ${sug.on_hand} ${sug.uom}`
                                    : `Tồn kho: ${sug.on_hand} (Thiếu hàng)`}
                                </span>
                                {sug.unit_price > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{Number(sug.unit_price).toLocaleString('vi-VN')} đ</span>
                                  </>
                                )}
                              </div>

                              {sug.reason && (
                                <p className="text-[11px] text-on-surface-variant/80 mt-1 line-clamp-1 italic">
                                  💡 {sug.reason}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleApplyAiSuggestion(sug)}
                              className={`px-3 py-1.5 rounded-xl font-semibold text-label-medium transition-all shrink-0 flex items-center gap-1 shadow-sm ${
                                isChosen
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-primary/10 text-primary hover:bg-primary hover:text-on-primary'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {isChosen ? 'check' : 'touch_app'}
                              </span>
                              {isChosen ? 'Đang chọn' : 'Áp dụng'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Phụ tùng / Vật tư (Inventory Item) */}
          {!editingPart ? (
            <div>
              <label className="block text-label-medium font-semibold text-on-surface mb-1.5">
                Chọn phụ tùng từ kho <span className="text-error">*</span>
              </label>

              {/* Search Bar */}
              <div className="relative mb-3">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Tìm theo mã SKU, tên phụ tùng, thương hiệu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-body-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Items List */}
              <div className="border border-outline-variant rounded-xl max-h-48 overflow-y-auto divide-y divide-outline-variant/40 bg-surface styled-scrollbar">
                {loadingItems ? (
                  <div className="p-4 text-center text-body-small text-on-surface-variant flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    Đang tra cứu kho phụ tùng...
                  </div>
                ) : inventoryItems.length === 0 ? (
                  <div className="p-4 text-center text-body-small text-on-surface-variant">
                    Không tìm thấy phụ tùng phù hợp với từ khóa
                  </div>
                ) : (
                  inventoryItems.map((item) => {
                    const isSelected = selectedItem?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary/10 border-l-4 border-l-primary'
                            : 'hover:bg-surface-container-low'
                        }`}
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              {item.sku}
                            </span>
                            <span className="font-semibold text-on-surface text-body-medium truncate">
                              {item.name}
                            </span>
                          </div>
                          <div className="text-body-small text-on-surface-variant flex items-center gap-3 mt-1">
                            {item.brand && <span>Hãng: {item.brand.name}</span>}
                            <span>ĐVT: {item.uom?.name || 'Cái'}</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {Number(item.sellingPrice).toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              item.onHand > 0
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              {item.onHand > 0 ? 'inventory_2' : 'warning'}
                            </span>
                            Tồn: {item.onHand}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* Selected item preview for edit */
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {selectedItem?.sku}
                </span>
                <p className="font-semibold text-on-surface mt-1">{selectedItem?.name}</p>
                <p className="text-body-small text-on-surface-variant">
                  ĐVT: {selectedItem?.uom?.name || 'Cái'} | Hãng: {selectedItem?.brand?.name || 'N/A'}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  (selectedItem?.onHand ?? 0) > 0
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20'
                }`}
              >
                Tồn kho: {selectedItem?.onHand ?? 0}
              </span>
            </div>
          )}

          {/* Quantities & Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Planned Quantity */}
            <div>
              <label className="block text-label-medium font-semibold text-on-surface mb-1.5">
                Số lượng dự kiến <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={plannedQuantity}
                  onChange={(e) => setPlannedQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-body-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="VD: 1, 4, 0.5..."
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-body-small text-on-surface-variant">
                  {selectedItem?.uom?.name || 'Cái'}
                </span>
              </div>
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-label-medium font-semibold text-on-surface mb-1.5">
                Đơn giá dự kiến (VNĐ)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-body-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-body-small text-on-surface-variant">
                  đ
                </span>
              </div>
            </div>
          </div>

          {/* Stock Alert Warning Banner */}
          {selectedItem && isStockShortage && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0 mt-0.5">
                warning
              </span>
              <div className="text-body-small">
                <p className="font-semibold">Cảnh báo thiếu hụt kho:</p>
                <p>
                  Số lượng dự kiến ({plannedQuantity} {selectedItem.uom?.name || 'đơn vị'}) vượt quá số lượng tồn
                  thực tế hiện có ({selectedItem.onHand} {selectedItem.uom?.name || 'đơn vị'}). Cần thông báo bộ phận kho
                  chuẩn bị hoặc nhập thêm hàng.
                </p>
              </div>
            </div>
          )}

          {/* Real-time Calculation Summary */}
          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/60 flex items-center justify-between">
            <span className="text-body-medium font-medium text-on-surface-variant">
              Thành tiền dự kiến:
            </span>
            <span className="text-title-medium font-bold text-primary">
              {totalAmount.toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container font-semibold text-body-medium transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || (!editingPart && !selectedItem) || !selectedJobId}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 font-semibold text-body-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {submitting && (
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            )}
            {editingPart ? 'Lưu thay đổi' : 'Khai báo phụ tùng'}
          </button>
        </div>
      </div>
    </div>
  );
}
