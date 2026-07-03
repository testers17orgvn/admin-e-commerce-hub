import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { AIChatBot } from '@/components/chat/AIChatBot';
import { BackToTop } from '@/components/chat/BackToTop';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col w-full max-w-[100vw] overflow-x-hidden">
      <Header />
      <main className="flex-1 pb-16 md:pb-0 w-full max-w-[100vw] overflow-x-hidden">
        <div className="w-full max-w-[100vw] overflow-x-hidden">{children}</div>
      </main>
      <Footer />
      <MobileBottomNav />
      <ChatWidget />
      <AIChatBot />
      <BackToTop />
    </div>
  );
}

