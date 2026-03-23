import { ReactNode, CSSProperties } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';

interface ScrollRevealProps {
  children: ReactNode;
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  className?: string;
  distance?: number;
}

const getTransform = (direction: RevealDirection, distance: number, visible: boolean) => {
  if (visible) return 'translate3d(0,0,0) scale(1)';
  switch (direction) {
    case 'up': return `translate3d(0, ${distance}px, 0)`;
    case 'down': return `translate3d(0, -${distance}px, 0)`;
    case 'left': return `translate3d(${distance}px, 0, 0)`;
    case 'right': return `translate3d(-${distance}px, 0, 0)`;
    case 'scale': return 'scale(0.92)';
    case 'fade': default: return 'translate3d(0, 0, 0)';
  }
};

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.7,
  className = '',
  distance = 40,
}: ScrollRevealProps) {
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();

  const style: CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: getTransform(direction, distance, isVisible),
    transition: `opacity ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
    willChange: 'opacity, transform',
  };

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}
