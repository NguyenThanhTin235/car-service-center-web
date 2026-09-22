import React, { useState, useMemo } from 'react';
import ComboBox from '@/components/shared/ComboBox';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading?: boolean;
  services?: Array<{id: number, name: string}>;
  customers?: any[];
}

export default function WalkInIntakeModal({ isOpen, onClose, onSubmit, loading, services = [], customers = [] }: Props) {
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    customerId: '',
    vehicleId: '',
    notes: '',
    // New customer/vehicle fields
    fullName: '',
    phone: '',
    email: '',
    licensePlate: '',
    make: '',
    model: '',
  });

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id.toString() === formData.customerId.toString());
  }, [customers, formData.customerId]);

  const customerOptions = useMemo(() => {
    return customers.map(c => ({
      id: c.id,
      label: `${c.fullName} - ${c.phone}`
    }));
  }, [customers]);

  const vehicleOptions = useMemo(() => {
    if (!selectedCustomer || !selectedCustomer.vehicles) return [];
    return selectedCustomer.vehicles.map((v: any) => ({
      id: v.id,
      label: `${v.licensePlate} (${v.make} ${v.model})`
    }));
  }, [selectedCustomer]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      intakeType: 'WALK_IN',
      arrivedAt: new Date().toISOString(),
      notes: formData.notes,
      serviceTemplateIds: serviceIds.length > 0 ? serviceIds : undefined,
    };

    if (isNewCustomer) {
      payload.newCustomer = {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email || undefined,
      };
      payload.newVehicle = {
        licensePlate: formData.licensePlate,
        make: formData.make,
        model: formData.model,
      };
    } else {
      payload.customerId = Number(formData.customerId);
      payload.vehicleId = Number(formData.vehicleId);
    }

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant bg-surface-container-lowest">
          <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">directions_walk</span>
            Tiếp nhận Walk-In
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-container text-secondary">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="walkin-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Toggle Existing vs New Customer */}
            <div className="flex bg-surface-container-low p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setIsNewCustomer(false)}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                  !isNewCustomer ? 'bg-surface shadow-sm text-primary' : 'text-secondary hover:bg-surface-variant/50'
                }`}
              >
                Khách hàng đã có
              </button>
              <button
                type="button"
                onClick={() => setIsNewCustomer(true)}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                  isNewCustomer ? 'bg-surface shadow-sm text-primary' : 'text-secondary hover:bg-surface-variant/50'
                }`}
              >
                Khách hàng mới
              </button>
            </div>

            {isNewCustomer ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <h3 className="text-label-lg font-bold text-on-surface mb-2">Thông tin Khách hàng</h3>
                  </div>
                  <div>
                    <label className="block text-label-sm font-medium text-secondary mb-1">Họ tên *</label>
                    <input
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-surface-container-lowest"
                    />
                  </div>
                  <div>
                    <label className="block text-label-sm font-medium text-secondary mb-1">Số điện thoại *</label>
                    <input
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-surface-container-lowest"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-label-sm font-medium text-secondary mb-1">Email</label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-surface-container-lowest"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-outline-variant pt-4 mt-2">
                  <div className="col-span-2">
                    <h3 className="text-label-lg font-bold text-on-surface mb-2">Thông tin Xe</h3>
                  </div>
                  <div>
                    <label className="block text-label-sm font-medium text-secondary mb-1">Biển số *</label>
                    <input
                      name="licensePlate"
                      required
                      value={formData.licensePlate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-surface-container-lowest uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-label-sm font-medium text-secondary mb-1">Hãng xe *</label>
                    <input
                      name="make"
                      required
                      value={formData.make}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-surface-container-lowest"
                      placeholder="VD: Toyota"
                    />
                  </div>
                  <div>
                    <label className="block text-label-sm font-medium text-secondary mb-1">Dòng xe *</label>
                    <input
                      name="model"
                      required
                      value={formData.model}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-surface-container-lowest"
                      placeholder="VD: Camry"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-label-sm font-medium text-secondary mb-1">Khách hàng *</label>
                  <ComboBox
                    options={customerOptions}
                    value={formData.customerId}
                    onChange={(val) => setFormData({ ...formData, customerId: val.toString(), vehicleId: '' })}
                    placeholder="Tìm theo tên hoặc số điện thoại..."
                  />
                </div>
                <div>
                  <label className="block text-label-sm font-medium text-secondary mb-1">Xe *</label>
                  <ComboBox
                    options={vehicleOptions}
                    value={formData.vehicleId}
                    onChange={(val) => setFormData({ ...formData, vehicleId: val.toString() })}
                    placeholder={formData.customerId ? "Chọn xe..." : "Vui lòng chọn khách hàng trước"}
                  />
                </div>
              </div>
            )}

            <div className="border-t border-outline-variant pt-4 mt-2">
              <label className="block text-label-sm font-medium text-secondary mb-2">Dịch vụ yêu cầu (Có thể chọn nhiều)</label>
              {services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto bg-surface-container-low p-3 rounded-lg border border-outline-variant">
                  {services.map((svc) => (
                    <label key={svc.id} className="flex items-center gap-2 cursor-pointer text-body-sm">
                      <input
                        type="checkbox"
                        checked={serviceIds.includes(svc.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setServiceIds([...serviceIds, svc.id]);
                          } else {
                            setServiceIds(serviceIds.filter(id => id !== svc.id));
                          }
                        }}
                        className="w-4 h-4 text-primary rounded border-outline focus:ring-primary"
                      />
                      {svc.name}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-body-sm text-secondary italic">Đang tải danh sách dịch vụ...</div>
              )}
            </div>

            <div className="border-t border-outline-variant pt-4 mt-2">
              <label className="block text-label-sm font-medium text-secondary mb-1">Ghi chú tiếp nhận</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-surface-container-lowest"
                placeholder="Nhu cầu sửa chữa, hiện trạng sơ bộ..."
              />
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-semibold text-secondary hover:bg-surface-container rounded-lg"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="walkin-form"
            disabled={loading}
            className="px-6 py-2 font-semibold text-on-primary bg-primary rounded-lg hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>}
            Tạo phiếu tiếp nhận
          </button>
        </div>
      </div>
    </div>
  );
}
