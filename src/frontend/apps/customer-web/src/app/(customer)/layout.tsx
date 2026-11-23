import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import CustomerAuthGuard from '@/components/auth/CustomerAuthGuard';
import CustomerAiChatWidget from '@/components/chat/CustomerAiChatWidget';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <CustomerAuthGuard>
      <div className="min-h-screen flex flex-col bg-canvas font-body-md text-ink-primary antialiased">
        <PublicHeader />
        <main className="flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
        <PublicFooter />
        <CustomerAiChatWidget />
      </div>
    </CustomerAuthGuard>
  );
}
