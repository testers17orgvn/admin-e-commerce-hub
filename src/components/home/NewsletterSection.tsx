import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { useHomepageSettings } from '@/hooks/useHomepageSettings';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { settings } = useHomepageSettings();
  const newsletter = settings.newsletter;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // Simulate subscription
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Đăng ký thành công! Cảm ơn bạn đã theo dõi.');
    setEmail('');
    setLoading(false);
  };

  return (
    <section className="py-20 bg-charcoal text-cream">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            {newsletter.title}
          </h2>
          <p className="text-cream/70 mb-8">
            {newsletter.description}
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder={newsletter.placeholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-cream/10 border-cream/20 text-cream placeholder:text-cream/50 focus:border-accent"
            />
            <Button type="submit" variant="hero" disabled={loading}>
              {loading ? 'Đang gửi...' : newsletter.button_text}
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
