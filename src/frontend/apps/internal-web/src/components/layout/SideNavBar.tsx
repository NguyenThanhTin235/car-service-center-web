'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/shared/LogoutButton';
import { 
  CheckSquare, 
  Car, 
  Briefcase, 
  FileText
} from 'lucide-react';

type NavItem = {
  name: string;
  href: string;
  icon?: string;
  lucideIcon?: any;
  badge?: number;
  urgent?: boolean;
};

export default function SideNavBar() {
  const pathname = usePathname();

  const staffNavItems: NavItem[] = [
    { name: 'Tổng quan', href: '/staff', icon: 'dashboard' },
    { name: 'Quản lý lịch hẹn', href: '/staff/appointments', icon: 'calendar_today', badge: 12 },
    { name: 'Tiếp nhận xe', href: '/staff/intake', icon: 'car_repair', badge: 4, urgent: true },
    { name: 'Báo giá & Hóa đơn', href: '/staff/billing', icon: 'receipt_long' },
    { name: 'Quản lý Khách hàng', href: '/staff/customers', icon: 'group' },
  ];

  // Advisor flat tabs theo yêu cầu (Bỏ tab con)
  const advisorNavItems: NavItem[] = [
    { name: 'Tiếp nhận - Kiểm tra', href: '/advisor/intake-inspection', lucideIcon: Car },
    { name: 'Kiểm định chất lượng', href: '/advisor', lucideIcon: CheckSquare },
    { name: 'Thực hiện công việc', href: '/advisor/job-dispatch', lucideIcon: Briefcase },
    { name: 'Báo giá - Bàn giao', href: '/advisor/quotation-release', lucideIcon: FileText },
  ];

  const isAdvisor = pathname?.startsWith('/advisor');
  const activeNavItems = isAdvisor ? advisorNavItems : staffNavItems;

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 z-40 bg-surface-container-lowest dark:bg-inverse-surface border-r border-outline-variant dark:border-outline shadow-sm dark:shadow-none flex flex-col justify-between">
      {/* Top & Navigation Cluster */}
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Brand Header */}
        <div className="h-[68px] px-4 border-b border-outline-variant flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[24px]">car_repair</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-headline-md font-headline-md font-bold text-primary dark:text-inverse-primary tracking-tight truncate leading-tight">
              AutoCare Pro
            </span>
            <span className="text-label-sm font-label-sm text-on-surface-variant truncate">
              Xưởng Dịch vụ Ủy quyền
            </span>
          </div>
        </div>

        {/* Main Navigation Menu */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          <div className="px-2 py-1 text-label-sm font-label-sm text-outline font-semibold tracking-wider">
            PHÂN HỆ CHÍNH
          </div>

          {activeNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.lucideIcon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-body-md font-body-md transition-colors ${
                  isActive
                    ? 'bg-[#0866FF] text-white font-medium shadow-sm'
                    : 'text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-low dark:hover:bg-surface-variant hover:text-on-surface'
                }`}
              >
                {item.lucideIcon ? (
                  <Icon size={20} className={isActive ? 'text-white' : ''} />
                ) : (
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {item.icon}
                  </span>
                )}
                
                <span className="flex-1">{item.name}</span>

                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full font-label-sm text-label-sm ${
                      item.urgent
                        ? 'bg-error-container text-error font-bold'
                        : 'bg-surface-container-high text-primary'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && !item.badge && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
              </Link>
            );
          })}

          <div className="pt-3 px-2 py-1 text-label-sm font-label-sm text-outline font-semibold tracking-wider">
            HỖ TRỢ & HỆ THỐNG
          </div>
          <LogoutButton className="w-full text-left px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface text-body-md font-body-md transition-colors" />
        </nav>

      </div>
    </aside>
  );
}
