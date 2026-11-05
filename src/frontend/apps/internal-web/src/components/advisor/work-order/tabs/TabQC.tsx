'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WorkOrder } from '@/lib/api/work-order.api';
import {
  QcDetailsResponse,
  QcServiceItem,
  getWOQcDetails,
  submitQcEvaluation,
  submitBatchQcEvaluation,
  requestBilling,
} from '@/lib/api/qc.api';
import toast from 'react-hot-toast';

interface TabQCProps {
  workOrder: WorkOrder;
  refetchWO: () => void;
  isReadOnly?: boolean;
  setActiveTab?: (tabId: string) => void;
}

export default function TabQC({ workOrder, refetchWO, isReadOnly: propIsReadOnly = false, setActiveTab }: TabQCProps) {
  const [qcData, setQcData] = useState<QcDetailsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  // Khi Work Order không còn trong trạng thái kiểm định (chỉ thực hiện khi IN_PROGRESS)
  // hoặc đã chuyển sang các trạng thái hoàn tất/đóng/thanh toán: BILLING_REQUESTED, FINANCIAL_CLEARED, RELEASED, CLOSED, CANCELLED
  // thì toàn bộ giao diện KCS chuyển sang chế độ CHỈ ĐỌC (Read-only)
  const isQcActive = workOrder?.status === 'IN_PROGRESS';
  const isReadOnly = propIsReadOnly || !isQcActive || qcData?.stats?.isBillingRequested;

  // Lưu trạng thái đánh giá form tạm cho từng service: serviceId -> Record<itemId, { result: 'PASS' | 'FAIL' | null, notes: string, reworkDescription?: string }>
  const [evaluationForms, setEvaluationForms] = useState<
    Record<
      number,
      Record<
        number,
        {
          itemName: string;
          result: 'PASS' | 'FAIL' | null;
          notes: string;
          reworkDescription: string;
        }
      >
    >
  >({});

  // Tải dữ liệu QC
  const fetchQcData = useCallback(async () => {
    if (!workOrder?.id) return;
    try {
      setLoading(true);
      const res = await getWOQcDetails(workOrder.id);
      if (res.success && res.data) {
        setQcData(res.data);
        if (res.data.services.length > 0) {
          setSelectedServiceId((prev) => (prev ? prev : res.data.services[0].id));
        }

        // Khởi tạo form evaluation từ template/latestQc (nếu chưa QC thì để null - Chờ đánh giá)
        const initialForms: Record<number, any> = {};
        res.data.services.forEach((s) => {
          initialForms[s.id] = {};
          s.template.items.forEach((item) => {
            const existingItem = s.latestQc?.items.find((i) => i.itemName === item.name);
            const cleanStr = (val?: string | null) => (val ? val.split(/\s*\(Sửa lại:/i)[0].trim() : '');
            const savedNote = cleanStr(existingItem?.notes);
            const savedReworkDesc = cleanStr(existingItem?.reworkDescription);
            initialForms[s.id][item.id] = {
              itemName: item.name,
              result: existingItem ? (existingItem.result as 'PASS' | 'FAIL') : null,
              notes: savedNote,
              reworkDescription: savedReworkDesc,
            };
          });
        });
        setEvaluationForms(initialForms);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải thông tin QC:', err);
      toast.error('Không thể tải dữ liệu kiểm định chất lượng');
    } finally {
      setLoading(false);
    }
  }, [workOrder?.id]);

  useEffect(() => {
    fetchQcData();
  }, [fetchQcData]);

  // Cập nhật kết quả đánh giá cho một item (hỗ trợ toggle khi bấm lại)
  const handleItemResultChange = (
    serviceId: number,
    itemId: number,
    result: 'PASS' | 'FAIL'
  ) => {
    setEvaluationForms((prev) => {
      const serviceForm = prev[serviceId] || {};
      const currentItem = serviceForm[itemId] || { itemName: '', result: null, notes: '', reworkDescription: '' };
      // Nếu bấm lại chính nút đang chọn -> toggle về null (bỏ chọn)
      const nextResult = currentItem.result === result ? null : result;
      return {
        ...prev,
        [serviceId]: {
          ...serviceForm,
          [itemId]: {
            ...currentItem,
            result: nextResult,
          },
        },
      };
    });
  };

  // Cập nhật ghi chú / mô tả sửa lại
  const handleItemNoteChange = (
    serviceId: number,
    itemId: number,
    field: 'notes' | 'reworkDescription',
    val: string
  ) => {
    setEvaluationForms((prev) => {
      const serviceForm = prev[serviceId] || {};
      const currentItem = serviceForm[itemId] || { itemName: '', result: null, notes: '', reworkDescription: '' };
      return {
        ...prev,
        [serviceId]: {
          ...serviceForm,
          [itemId]: {
            ...currentItem,
            [field]: val,
          },
        },
      };
    });
  };

  // Đánh dấu tất cả hạng mục của service này là ĐẠT
  const handleMarkAllPass = (service: QcServiceItem) => {
    setEvaluationForms((prev) => {
      const updatedServiceForm: Record<number, any> = {};
      service.template.items.forEach((item) => {
        const currentItem = prev[service.id]?.[item.id] || {};
        updatedServiceForm[item.id] = {
          itemName: item.name,
          result: 'PASS',
          notes: currentItem.notes || '',
          reworkDescription: '',
        };
      });
      return {
        ...prev,
        [service.id]: updatedServiceForm,
      };
    });
    toast.success(`Đã chọn ĐẠT cho toàn bộ ${service.template.items.length} hạng mục của "${service.name}"`);
  };

  // Đánh dấu tất cả hạng mục của TẤT CẢ các dịch vụ trong phiếu là ĐẠT
  const handleMarkAllServicesPass = () => {
    if (!qcData?.services || qcData.services.length === 0) return;
    setEvaluationForms((prev) => {
      const updatedForms = { ...prev };
      qcData.services.forEach((service) => {
        const updatedServiceForm: Record<number, any> = {};
        service.template.items.forEach((item) => {
          const currentItem = prev[service.id]?.[item.id] || {};
          updatedServiceForm[item.id] = {
            itemName: item.name,
            result: 'PASS',
            notes: currentItem.notes || '',
            reworkDescription: '',
          };
        });
        updatedForms[service.id] = updatedServiceForm;
      });
      return updatedForms;
    });
    toast.success(`Đã đánh dấu ĐẠT cho toàn bộ ${qcData.services.length} dịch vụ! Nhấn "Lưu toàn bộ" để hoàn tất.`);
  };

  // Gửi đánh giá QC cho service
  const handleSubmitServiceQc = async (service: QcServiceItem) => {
    const serviceForm = evaluationForms[service.id];
    if (!serviceForm) return;

    // Kiểm tra xem có mục nào chưa được đánh giá không
    const unsetItem = service.template.items.find((tItem) => {
      const form = serviceForm[tItem.id];
      return !form || form.result === null || form.result === undefined;
    });

    if (unsetItem) {
      toast.error(`Vui lòng đánh giá toàn bộ các tiêu chí (mục "${unsetItem.name}" chưa chọn kết quả)`);
      return;
    }

    // Kiểm tra có mục Không đạt nào thiếu lý do sửa lại không
    const failWithoutReason = service.template.items.find((tItem) => {
      const form = serviceForm[tItem.id];
      return form?.result === 'FAIL' && !form.reworkDescription?.trim();
    });

    if (failWithoutReason) {
      toast.error(`Vui lòng nhập lý do sửa lại cho mục "${failWithoutReason.name}"`);
      return;
    }

    const itemsPayload = service.template.items.map((tItem) => {
      const formData = serviceForm[tItem.id] || { itemName: tItem.name, result: 'PASS', notes: '', reworkDescription: '' };
      return {
        templateItemId: tItem.id > 0 ? tItem.id : undefined,
        itemName: tItem.name,
        result: formData.result as 'PASS' | 'FAIL',
        notes: formData.notes?.trim() || undefined,
        reworkDescription: formData.result === 'FAIL' ? formData.reworkDescription?.trim() : undefined,
        reworkJobName: formData.result === 'FAIL' ? `[Sửa lại - KCS] ${tItem.name}` : undefined,
      };
    });

    try {
      setActionLoading(true);
      const res = await submitQcEvaluation(workOrder.id, {
        woServiceId: service.id,
        templateId: service.template.id,
        items: itemsPayload,
      });

      if (res.success) {
        if (res.data?.overallResult === 'PASS') {
          toast.success(`Nghiệm thu ĐẠT chuẩn cho dịch vụ "${service.name}"`);
        } else {
          toast(
            `Đã ghi nhận ${res.data?.failCount} hạng mục lỗi. Hệ thống đã tự động tạo Job sửa lại (Rework).`,
            { icon: '⚠️', duration: 4000 }
          );
        }
        await fetchQcData();
        refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi lưu kết quả kiểm định');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi lưu kết quả kiểm định');
    } finally {
      setActionLoading(false);
    }
  };

  // Gửi đánh giá QC cho TOÀN BỘ các dịch vụ trong phiếu cùng một lúc
  const handleSubmitAllQc = async () => {
    if (!qcData?.services || qcData.services.length === 0) return;

    // 1. Kiểm tra validation toàn bộ các dịch vụ
    for (const service of qcData.services) {
      const serviceForm = evaluationForms[service.id];
      if (!serviceForm) {
        setSelectedServiceId(service.id);
        toast.error(`Dịch vụ "${service.name}" chưa có dữ liệu đánh giá`);
        return;
      }

      // Kiểm tra có mục nào chưa chọn kết quả
      const unsetItem = service.template.items.find((tItem) => {
        const form = serviceForm[tItem.id];
        return !form || form.result === null || form.result === undefined;
      });

      if (unsetItem) {
        setSelectedServiceId(service.id);
        toast.error(`Dịch vụ "${service.name}": Vui lòng đánh giá mục "${unsetItem.name}" trước khi lưu toàn bộ`);
        return;
      }

      // Kiểm tra có mục Không đạt nào thiếu lý do sửa lại
      const failWithoutReason = service.template.items.find((tItem) => {
        const form = serviceForm[tItem.id];
        return form?.result === 'FAIL' && !form.reworkDescription?.trim();
      });

      if (failWithoutReason) {
        setSelectedServiceId(service.id);
        toast.error(`Dịch vụ "${service.name}": Vui lòng nhập lý do sửa lại cho mục "${failWithoutReason.name}"`);
        return;
      }
    }

    // 2. Gom payload cho toàn bộ các dịch vụ
    const evaluations = qcData.services.map((service) => {
      const serviceForm = evaluationForms[service.id] || {};
      const itemsPayload = service.template.items.map((tItem) => {
        const formData = serviceForm[tItem.id] || {
          itemName: tItem.name,
          result: 'PASS',
          notes: '',
          reworkDescription: '',
        };
        return {
          templateItemId: tItem.id > 0 ? tItem.id : undefined,
          itemName: tItem.name,
          result: formData.result as 'PASS' | 'FAIL',
          notes: formData.notes?.trim() || undefined,
          reworkDescription: formData.result === 'FAIL' ? formData.reworkDescription?.trim() : undefined,
          reworkJobName: formData.result === 'FAIL' ? `[Sửa lại - KCS] ${tItem.name}` : undefined,
        };
      });

      return {
        woServiceId: service.id,
        templateId: service.template.id,
        items: itemsPayload,
      };
    });

    try {
      setActionLoading(true);
      const res = await submitBatchQcEvaluation(workOrder.id, { evaluations });

      if (res.success) {
        if (!res.data?.totalFailCount || res.data.totalFailCount === 0) {
          toast.success(`Nghiệm thu ĐẠT chuẩn cho toàn bộ ${evaluations.length} dịch vụ!`);
        } else {
          toast(
            `Đã lưu kết quả KCS (${res.data.overallPassCount} đạt, ${res.data.totalFailCount} lỗi). Hệ thống đã tự động tạo Job sửa lại (Rework).`,
            { icon: '⚠️', duration: 4500 }
          );
        }
        await fetchQcData();
        refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi lưu kết quả kiểm định');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi lưu kết quả kiểm định');
    } finally {
      setActionLoading(false);
    }
  };

  // Kích hoạt Billing Gate: Yêu cầu lập hóa đơn
  const handleRequestBilling = async () => {
    try {
      setActionLoading(true);
      const res = await requestBilling(workOrder.id);
      if (res.success) {
        toast.success('Đã gửi yêu cầu thanh toán sang quầy Thu ngân thành công!');
        await fetchQcData();
        refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi yêu cầu thanh toán');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi yêu cầu thanh toán');
    } finally {
      setActionLoading(false);
    }
  };

  const activeService = useMemo(() => {
    if (!qcData?.services) return null;
    return qcData.services.find((s) => s.id === selectedServiceId) || qcData.services[0] || null;
  }, [qcData, selectedServiceId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-[36px] text-primary">progress_activity</span>
      </div>
    );
  }

  if (!qcData || qcData.services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-outline-variant rounded-2xl bg-surface-container-lowest">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
          <span className="material-symbols-outlined text-[32px]">fact_check</span>
        </div>
        <h3 className="text-title-lg font-bold text-on-surface">Chưa có dịch vụ nào để kiểm định QC</h3>
        <p className="text-body-md text-on-surface-variant mt-2 max-w-md">
          Phiếu công việc cần có ít nhất một dịch vụ được lên kế hoạch và hoàn thành trước khi kiểm định chất lượng xuất xưởng.
        </p>
      </div>
    );
  }

  const { stats } = qcData;

  return (
    <div className="space-y-6">
      {/* 1. KPI STATS - Flattened Unified Strip */}
      <div className="bg-[#f8fafc] border border-slate-200/90 rounded-2xl p-4 grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80">
        {/* Stat 1: Tiến độ kiểm định */}
        <div className="sm:px-3 first:pl-0">
          <div className="flex items-center justify-between text-slate-600 mb-1.5">
            <span className="text-xs font-bold">Tiến độ KCS</span>
            <span className="material-symbols-outlined text-[#0050cd] text-[18px]">verified</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-zinc-900 font-mono">{stats.progressPercent}%</span>
            <span className="text-xs text-slate-500 font-medium">({stats.passedServices}/{stats.totalServices} dịch vụ)</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full mt-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                stats.progressPercent === 100 ? 'bg-emerald-500' : 'bg-[#0050cd]'
              }`}
              style={{ width: `${stats.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stat 2: Công việc đã nghiệm thu */}
        <div className="pt-3 sm:pt-0 sm:px-3">
          <div className="flex items-center justify-between text-slate-600 mb-1.5">
            <span className="text-xs font-bold">Hạng mục đã Pass</span>
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">{stats.passedJobs}</span>
            <span className="text-xs text-slate-500 font-medium">/ {stats.totalJobs} jobs kỹ thuật</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Đã đạt chuẩn an toàn & chạy thử
          </p>
        </div>

        {/* Stat 3: Công việc Rework cần sửa lại */}
        <div className="pt-3 sm:pt-0 sm:px-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-bold ${
              stats.reworkJobs > 0 ? 'text-rose-700' : 'text-slate-600'
            }`}>
              Cần sửa lại (Rework)
            </span>
            <span className={`material-symbols-outlined text-[18px] ${
              stats.reworkJobs > 0 ? 'text-rose-600' : 'text-slate-500'
            }`}>
              build_circle
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl sm:text-2xl font-black font-mono ${
              stats.reworkJobs > 0 ? 'text-rose-600' : 'text-zinc-900'
            }`}>
              {stats.reworkJobs}
            </span>
            <span className="text-xs text-slate-500 font-medium">hạng mục phát hiện lỗi</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {stats.reworkJobs > 0 ? '⚠️ Cần thợ khắc phục trước khi giao xe' : 'Không có lỗi kỹ thuật nào'}
          </p>
        </div>

        {/* Stat 4: Trạng thái chốt cổng xuất xưởng */}
        <div className="pt-3 sm:pt-0 sm:pl-3">
          <div className="flex items-center justify-between text-slate-600 mb-1.5">
            <span className="text-xs font-bold">Cổng nghiệm thu</span>
            <span className="material-symbols-outlined text-amber-600 text-[18px]">door_front</span>
          </div>
          <div>
            {stats.isBillingRequested ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-bold text-xs">
                <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                Đã gửi Billing
              </span>
            ) : stats.canRequestBilling ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Sẵn sàng thanh toán
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
                Đang thi công & QC
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {stats.canRequestBilling ? 'Đạt chuẩn 100% để xuất hóa đơn' : 'Cần nghiệm thu đủ các dịch vụ'}
          </p>
        </div>
      </div>

      {/* 2. Billing Gate Notification Banner */}
      {stats.canRequestBilling && !stats.isBillingRequested && !isReadOnly && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px] text-white">verified</span>
            </div>
            <div>
              <h4 className="font-bold text-base">Toàn bộ dịch vụ đã hoàn tất & Vượt qua kiểm định KCS!</h4>
              <p className="text-xs text-emerald-100 mt-0.5">
                Chất lượng kỹ thuật xe đã đạt 100%. Nhấn nút bên dưới để gửi lệnh sang quầy Thu ngân phát hành hóa đơn.
              </p>
            </div>
          </div>

          <button
            onClick={handleRequestBilling}
            disabled={actionLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 font-bold rounded-xl text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            {actionLoading ? 'Đang gửi...' : 'Gửi yêu cầu lập hóa đơn'}
          </button>
        </div>
      )}

      {stats.isBillingRequested && (
        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-purple-900 dark:text-purple-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-purple-600 text-[24px]">task_alt</span>
          <div className="text-xs sm:text-sm">
            <span className="font-bold">Hồ sơ đã được nghiệm thu KCS hoàn tất.</span> Đang chờ Thu ngân xử lý thanh toán tại quầy. Chế độ chỉ đọc (Read-only).
          </div>
        </div>
      )}

      {isReadOnly && !stats.isBillingRequested && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#0050cd] text-[22px]">lock</span>
            <div>
              <span className="font-bold text-zinc-900">Chế độ xem chỉ đọc (Read-only): </span>
              <span className="text-slate-600">
                {['BILLING_REQUESTED', 'FINANCIAL_CLEARED', 'RELEASED', 'CLOSED'].includes(workOrder?.status || '')
                  ? `Phiếu công việc đã hoàn thành giai đoạn kiểm định (${workOrder?.status}). Không thể chỉnh sửa kết quả KCS.`
                  : workOrder?.status === 'CANCELLED'
                  ? 'Phiếu công việc đã bị hủy.'
                  : `Phiếu công việc đang ở trạng thái "${workOrder?.status || 'N/A'}", chỉ có thể đánh giá KCS khi đang thi công (IN_PROGRESS).`}
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono font-bold text-xs uppercase tracking-wider shrink-0 shadow-2xs">
            {workOrder?.status}
          </span>
        </div>
      )}

      {/* 3. Main Workspace: Service Selector Tabs & Inspection Checklist */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden">
        {/* Service Switcher Tabs */}
        <div className="flex items-center gap-2 p-2.5 bg-slate-50/80 border-b border-slate-200/80 overflow-x-auto no-scrollbar">
          {qcData.services.map((service, idx) => {
            const isSelected = selectedServiceId === service.id;
            const isPassed = service.latestQc?.overallResult === 'PASS';
            const hasRework = service.jobs.some(
              (j) => j.status === 'REWORK' || (j.isRework && j.status !== 'PASSED' && j.status !== 'COMPLETED')
            );

            return (
              <button
                key={service.id}
                type="button"
                onClick={() => setSelectedServiceId(service.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-white text-[#0050cd] shadow-2xs border border-slate-200/90 font-bold'
                    : 'text-slate-600 hover:text-zinc-900 hover:bg-white/60'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isSelected ? 'bg-[#0050cd] text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {idx + 1}
                </span>
                <span>{service.name}</span>

                {isPassed ? (
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">check</span>
                    Đạt
                  </span>
                ) : hasRework ? (
                  <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200/80 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">build</span>
                    Rework
                  </span>
                ) : (
                  <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200/80 font-bold px-2 py-0.5 rounded-md">
                    Chờ QC
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Service QC Checklist Workspace */}
        {activeService && (
          <div className="p-6 space-y-6">
            {/* Header: Service Info & Jobs Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 flex items-center gap-2">
                  <span>{activeService.name}</span>
                  <span className="text-xs font-normal text-slate-500">
                    ({activeService.template.name})
                  </span>
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs text-slate-500 font-medium">Công việc thi công:</span>
                  {activeService.jobs.map((job) => (
                    <span
                      key={job.id}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${
                        job.status === 'PASSED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          : job.status === 'REWORK'
                          ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {job.status === 'PASSED' ? 'done_all' : job.status === 'REWORK' ? 'handyman' : 'engineering'}
                      </span>
                      {job.name} ({job.technician})
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick Actions & Save at Top */}
              {!isReadOnly && (
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {/* Đánh dấu ĐẠT cho dịch vụ hiện tại */}
                  <button
                    type="button"
                    onClick={() => handleMarkAllPass(activeService)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                    title="Tất cả các tiêu chí của dịch vụ này đều đạt"
                  >
                    <span className="material-symbols-outlined text-[16px]">done_all</span>
                    <span>Đạt mục này</span>
                  </button>

                  {/* Đánh dấu ĐẠT cho toàn bộ dịch vụ */}
                  {qcData.services.length > 1 && (
                    <button
                      type="button"
                      onClick={handleMarkAllServicesPass}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                      title={`Đánh dấu ĐẠT cho toàn bộ ${qcData.services.length} dịch vụ trong phiếu`}
                    >
                      <span className="material-symbols-outlined text-[16px]">checklist_rtl</span>
                      <span>Đạt tất cả ({qcData.services.length})</span>
                    </button>
                  )}

                  {/* Lưu dịch vụ này (tùy chọn) */}
                  <button
                    type="button"
                    onClick={() => handleSubmitServiceQc(activeService)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50"
                    title="Chỉ lưu kết quả kiểm định của dịch vụ hiện tại"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>Lưu mục này</span>
                  </button>

                  {/* NÚT LƯU TOÀN BỘ KẾT QUẢ KCS */}
                  <button
                    type="button"
                    onClick={handleSubmitAllQc}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#0050cd] hover:bg-[#0866ff] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Lưu kết quả kiểm định cho toàn bộ các dịch vụ và công việc"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {actionLoading ? 'progress_activity' : 'fact_check'}
                    </span>
                    <span>
                      {actionLoading ? 'Đang lưu...' : `Lưu toàn bộ (${qcData.services.length} dịch vụ)`}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Checklist Items Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-2">
                <span>Tiêu chuẩn kỹ thuật nghiệm thu ({activeService.template.items.length})</span>
                <span>Kết quả đánh giá</span>
              </div>

              {activeService.template.items.map((item, index) => {
                const serviceForm = evaluationForms[activeService.id] || {};
                const itemState = serviceForm[item.id] || { itemName: item.name, result: null, notes: '', reworkDescription: '' };
                const isPass = itemState.result === 'PASS';
                const isFail = itemState.result === 'FAIL';
                const isUnset = itemState.result === null || itemState.result === undefined;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isFail
                        ? 'bg-rose-50/40 border-rose-200/90'
                        : isPass
                        ? 'bg-emerald-50/30 border-emerald-200/80'
                        : 'bg-white hover:bg-slate-50/60 border-slate-200/80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors ${
                            isPass
                              ? 'bg-emerald-600 text-white'
                              : isFail
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-zinc-900">{item.name}</p>
                            {isUnset && (
                              <span className="text-xs text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                                Chờ đánh giá
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder="Ghi chú kỹ thuật (tùy chọn)..."
                            value={itemState.notes || ''}
                            onChange={(e) => handleItemNoteChange(activeService.id, item.id, 'notes', e.target.value)}
                            disabled={isReadOnly}
                            className={`mt-1.5 w-full sm:w-80 text-xs px-3 py-1.5 rounded-lg border text-zinc-900 placeholder:text-slate-400 ${
                              isReadOnly
                                ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-dashed border-slate-200'
                                : 'bg-white border-slate-200/90 focus:outline-none focus:ring-1 focus:ring-[#0050cd] focus:border-[#0050cd]'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Segmented Buttons: ĐẠT vs KHÔNG ĐẠT */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleItemResultChange(activeService.id, item.id, 'PASS')}
                          disabled={isReadOnly}
                          title={isPass ? 'Nhấn lại để hủy chọn ĐẠT' : 'Đánh dấu ĐẠT'}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                            isPass
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50'
                          } ${isReadOnly ? 'cursor-not-allowed opacity-90' : 'active:scale-95 cursor-pointer'}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isPass ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <span>{isPass ? 'ĐÃ ĐẠT' : 'ĐẠT'}</span>
                        </button>

                        {/* Khi ĐẠT rồi thì ẩn các button không đạt theo yêu cầu */}
                        {!isPass && (
                          <button
                            type="button"
                            onClick={() => handleItemResultChange(activeService.id, item.id, 'FAIL')}
                            disabled={isReadOnly}
                            title={isFail ? 'Nhấn lại để hủy chọn' : 'Đánh dấu KHÔNG ĐẠT'}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                              isFail
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'bg-white text-rose-700 border border-rose-300 hover:bg-rose-50'
                            } ${isReadOnly ? 'cursor-not-allowed opacity-90' : 'active:scale-95 cursor-pointer'}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isFail ? 'cancel' : 'radio_button_unchecked'}
                            </span>
                            <span>KHÔNG ĐẠT</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expandable Rework Form when FAIL */}
                    {isFail && (
                      <div className="mt-3 pt-3 border-t border-rose-200/80 space-y-2 text-xs">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
                          <span className="inline-flex items-center gap-1 text-rose-700 font-bold shrink-0">
                            <span className="material-symbols-outlined text-[16px]">warning</span>
                            Yêu cầu sửa lại (Rework):
                          </span>
                          <input
                            type="text"
                            placeholder="Mô tả cụ thể nguyên nhân lỗi để thợ kỹ thuật sửa lại (bắt buộc)..."
                            value={itemState.reworkDescription || ''}
                            onChange={(e) =>
                              handleItemNoteChange(activeService.id, item.id, 'reworkDescription', e.target.value)
                            }
                            disabled={isReadOnly}
                            className={`w-full flex-1 px-3 py-1.5 rounded-lg border text-zinc-900 font-medium ${
                              isReadOnly
                                ? 'bg-rose-50 text-rose-900 cursor-not-allowed border-dashed border-rose-200'
                                : 'bg-white border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-500'
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Latest QC info if available */}
            {activeService.latestQc && (
              <div className="pt-3 border-t border-slate-200/80 text-xs text-slate-500">
                <span>
                  Lần kiểm định gần nhất: <b className="text-zinc-800">{new Date(activeService.latestQc.createdAt).toLocaleString('vi-VN')}</b> bởi{' '}
                  <b className="text-zinc-800">{activeService.latestQc.inspectorName}</b>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
