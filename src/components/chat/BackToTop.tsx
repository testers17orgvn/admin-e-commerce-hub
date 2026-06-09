import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      aria-label="Lên đầu trang"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={cn(
        'fixed right-3 sm:right-6 z-40 h-10 w-10 sm:h-12 sm:w-12 rounded-full',
        'bottom-[5.5rem] lg:bottom-6',
        'bg-background/80 backdrop-blur-md border border-border shadow-lg',
        'flex items-center justify-center text-foreground/80 hover:text-foreground hover:scale-110',
        'transition-all duration-300',
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
