import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import CustomerAuthGuard from '@/components/auth/CustomerAuthGuard';
import LazyCustomerAiChatWidget from '@/components/chat/LazyCustomerAiChatWidget';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-canvas font-body-md text-ink-primary antialiased overflow-x-clip">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg"
      >
        Chuyển đến nội dung chính
      </a>
      <PublicHeader />
      <main id="main-content" className="flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <CustomerAuthGuard>{children}</CustomerAuthGuard>
      </main>
      <PublicFooter />
      <LazyCustomerAiChatWidget />
    </div>
  );
}
