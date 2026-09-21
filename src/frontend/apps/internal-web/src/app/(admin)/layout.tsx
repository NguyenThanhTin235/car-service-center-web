import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin Portal – Car Service Center',
  description: 'Hệ thống quản trị trung tâm dịch vụ ô tô',
};

const NAV_ITEMS = [
  { href: '/accounts', icon: 'manage_accounts', label: 'Tài khoản & Phân quyền', section: 'admin' },
  { href: '/employees', icon: 'engineering', label: 'Nhân viên', section: 'admin' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
      `}</style>
      <div style={{ margin: 0, fontFamily: "'Be Vietnam Pro', sans-serif", background: '#f8f9ff', color: '#0b1c30' }}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {/* Sidebar */}
          <aside style={{
            width: '16rem', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 40,
            borderRight: '1px solid rgba(194,198,216,0.3)', boxShadow: '0 1px 8px rgba(0,0,0,0.02)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Logo */}
              <div style={{ height: '3.5rem', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(194,198,216,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#0866ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '18px' }}>build</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0b1c30', lineHeight: 1 }}>Car Service</span>
                    <span style={{ fontSize: '11px', color: '#727687', fontFamily: 'JetBrains Mono, monospace' }}>Admin Console</span>
                  </div>
                </div>
                <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#eff4ff', color: '#0050cd', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>LTS</span>
              </div>

              {/* Nav section */}
              <div style={{ padding: '0.75rem 0' }}>
                <div style={{ padding: '0.5rem 1rem', fontSize: '10px', fontWeight: 700, color: '#727687', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Phân hệ quản trị
                </div>
                <nav style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {NAV_ITEMS.map(item => (
                    <a key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#424656] hover:bg-[#eff4ff] hover:text-[#0b1c30] text-[13px] font-medium transition-colors no-underline">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </a>
                  ))}
                </nav>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem', borderTop: '1px solid rgba(194,198,216,0.2)', background: 'rgba(239,244,255,0.4)' }}>
              <div style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'white', border: '1px solid rgba(194,198,216,0.3)', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#0b1c30' }}>Server Uptime</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#0058bc', fontWeight: 500 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0058bc', animation: 'pulse 2s infinite' }}></span>
                    99.9%
                  </span>
                </div>
                <div style={{ height: '4px', background: '#e5eeff', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#0866ff', width: '99%' }}></div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: '#0866ff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>AD</div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#0b1c30', lineHeight: 1 }}>Admin</span>
                    <span style={{ fontSize: '11px', color: '#424656' }}>Quản trị viên</span>
                  </div>
                </div>
                <a href="/public/home" title="Về trang chủ" className="w-7 h-7 rounded flex items-center justify-center text-[#424656] hover:bg-[#fef2f2] hover:text-[#ef4444] transition-colors no-underline">
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                </a>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main style={{ marginLeft: '16rem', flex: 1, minHeight: '100vh' }}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
