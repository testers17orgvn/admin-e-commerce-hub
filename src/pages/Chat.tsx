import { Layout } from '@/components/layout/Layout';
import { ChatPage } from '@/components/chat/ChatPage';

export default function Chat() {
  return (
    <Layout>
      <div className="container py-4 sm:py-6 px-2 sm:px-4">
        <ChatPage />
      </div>
    </Layout>
  );
}
