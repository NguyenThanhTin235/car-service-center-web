import CustomerNavBar from '@/components/layout/CustomerNavBar';
import CustomerAuthGuard from '@/components/auth/CustomerAuthGuard';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <CustomerAuthGuard>
      <div className="min-h-screen flex flex-col bg-surface-container-low font-body-md text-on-surface antialiased">
        <CustomerNavBar />
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-8">
          {children}
        </main>
        {/* Footer */}
        <footer className="w-full bg-surface-container-lowest border-t border-surface-container-highest">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-on-surface-variant text-center md:text-left">
                © 2025 Car Service Center. Bản quyền thuộc về Trung tâm Dịch vụ Kỹ thuật Ô tô.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                <span>Hotline: <strong className="text-on-surface">1900 6868</strong></span>
                <span>Email: contact@carservice.vn</span>
                <span>T2–T7: 08:00–18:00</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </CustomerAuthGuard>
  );
}
