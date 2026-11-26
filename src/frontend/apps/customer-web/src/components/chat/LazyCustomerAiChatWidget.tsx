'use client';

import dynamic from 'next/dynamic';

const CustomerAiChatWidget = dynamic(() => import('./CustomerAiChatWidget'), {
  ssr: false,
});

export default function LazyCustomerAiChatWidget() {
  return <CustomerAiChatWidget />;
}
