import { Layout } from '@/components/layout/Layout';
import { ChatPage } from '@/components/chat/ChatPage';

export default function Chat() {
  return (
    <Layout>
      <div className="container py-6">
        <ChatPage />
      </div>
    </Layout>
  );
}
