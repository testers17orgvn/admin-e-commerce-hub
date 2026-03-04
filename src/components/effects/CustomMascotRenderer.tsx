import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/hooks/useTheme';
import type { CustomMascot } from '@/components/admin/CustomMascotManager';

const ANIMATION_CSS = `
@keyframes mascotFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
}
@keyframes mascotBounce {
  0%, 100% { transform: translateY(0); }
  40% { transform: translateY(-25px); }
  60% { transform: translateY(-10px); }
}
@keyframes mascotSwing {
  0%, 100% { transform: rotate(0deg); transform-origin: top center; }
  25% { transform: rotate(12deg); }
  75% { transform: rotate(-12deg); }
}
@keyframes mascotShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
@keyframes mascotSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes mascotPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
@keyframes mascotTada {
  0% { transform: scale(1) rotate(0deg); }
  10%, 20% { transform: scale(0.9) rotate(-3deg); }
  30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); }
  40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); }
  100% { transform: scale(1) rotate(0deg); }
}
@keyframes mascotWiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg) translateX(-2px); }
  75% { transform: rotate(5deg) translateX(2px); }
}
`;

const TOOLTIP_CSS = `
.mascot-tooltip {
  position: absolute;
  background: hsl(var(--foreground));
  color: hsl(var(--background));
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  white-space: pre-wrap;
  max-width: 200px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  line-height: 1.4;
}
.mascot-tooltip::after {
  content: '';
  position: absolute;
  border: 5px solid transparent;
}
.mascot-tooltip-top {
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
}
.mascot-tooltip-top::after {
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-top-color: hsl(var(--foreground));
}
.mascot-tooltip-bottom {
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(-4px);
}
.mascot-tooltip-bottom::after {
  bottom: 100%;
  left: 50%;
  margin-left: -5px;
  border-bottom-color: hsl(var(--foreground));
}
.mascot-tooltip-left {
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%) translateX(4px);
}
.mascot-tooltip-left::after {
  left: 100%;
  top: 50%;
  margin-top: -5px;
  border-left-color: hsl(var(--foreground));
}
.mascot-tooltip-right {
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%) translateX(-4px);
}
.mascot-tooltip-right::after {
  right: 100%;
  top: 50%;
  margin-top: -5px;
  border-right-color: hsl(var(--foreground));
}
.mascot-wrapper:hover .mascot-tooltip {
  opacity: 1;
}
.mascot-wrapper:hover .mascot-tooltip-top { transform: translateX(-50%) translateY(0); }
.mascot-wrapper:hover .mascot-tooltip-bottom { transform: translateX(-50%) translateY(0); }
.mascot-wrapper:hover .mascot-tooltip-left { transform: translateY(-50%) translateX(0); }
.mascot-wrapper:hover .mascot-tooltip-right { transform: translateY(-50%) translateX(0); }
`;

export const ANIM_MAP: Record<string, string> = {
  float: 'mascotFloat 3s ease-in-out infinite',
  bounce: 'mascotBounce 1.5s ease-in-out infinite',
  swing: 'mascotSwing 2s ease-in-out infinite',
  shake: 'mascotShake 0.6s ease-in-out infinite',
  spin: 'mascotSpin 4s linear infinite',
  pulse: 'mascotPulse 2s ease-in-out infinite',
  tada: 'mascotTada 1.5s ease-in-out infinite',
  wiggle: 'mascotWiggle 1s ease-in-out infinite',
};

function MascotItem({ mascot, navigate }: { mascot: CustomMascot; navigate: ReturnType<typeof useNavigate> }) {
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);
  const animFrameRef = useRef<number>(0);

  // Follow mouse
  useEffect(() => {
    if (!mascot.follow_mouse) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mascot.follow_mouse]);

  // Smooth follow animation
  useEffect(() => {
    if (!mascot.follow_mouse || !mousePos) return;

    const speed = (mascot.follow_speed || 5) / 100;

    const animate = () => {
      setCurrentPos(prev => {
        const cx = prev?.x ?? mousePos.x;
        const cy = prev?.y ?? mousePos.y;
        const dx = mousePos.x - cx;
        const dy = mousePos.y - cy;
        // Stop animating when close enough
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return mousePos;
        return {
          x: cx + dx * speed,
          y: cy + dy * speed,
        };
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [mascot.follow_mouse, mousePos, mascot.follow_speed]);

  // Scroll hide/show
  useEffect(() => {
    if (!mascot.hide_on_scroll) {
      setIsHidden(false);
      return;
    }

    const threshold = mascot.scroll_threshold || 100;
    const showOnUp = mascot.show_on_scroll_up !== false;

    const handleScroll = () => {
      const y = window.scrollY;
      if (y > threshold) {
        if (showOnUp && y < lastScrollY.current) {
          setIsHidden(false);
        } else {
          setIsHidden(true);
        }
      } else {
        setIsHidden(false);
      }
      lastScrollY.current = y;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mascot.hide_on_scroll, mascot.scroll_threshold, mascot.show_on_scroll_up]);

  const handleClick = () => {
    if (!mascot.link_url) return;
    if (mascot.link_url.startsWith('http')) {
      window.open(mascot.link_url, mascot.link_target || '_blank');
    } else {
      navigate(mascot.link_url);
    }
  };

  const hasLink = !!mascot.link_url;
  const hasTooltip = !!mascot.tooltip_text;
  const tooltipPos = mascot.tooltip_position || 'top';

  // Build position styles
  let posStyle: React.CSSProperties;

  if (mascot.follow_mouse && currentPos) {
    posStyle = {
      position: 'fixed',
      zIndex: 9999,
      left: currentPos.x - mascot.size / 2,
      top: currentPos.y - mascot.size / 2,
      transition: 'none',
    };
  } else {
    posStyle = { position: 'fixed', zIndex: 9999 };
    if (mascot.position.includes('left')) posStyle.left = `${mascot.offset_x}%`;
    if (mascot.position.includes('right')) posStyle.right = `${mascot.offset_x}%`;
    if (mascot.position.includes('top') && !mascot.position.includes('center')) posStyle.top = `${mascot.offset_y}%`;
    if (mascot.position.includes('bottom')) posStyle.bottom = `${mascot.offset_y}%`;
    if (mascot.position.includes('center')) {
      posStyle.top = '50%';
      posStyle.marginTop = `${mascot.offset_y}%`;
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`mascot-wrapper ${hasLink ? 'cursor-pointer' : ''}`}
      style={{
        ...posStyle,
        width: `${mascot.size}px`,
        height: `${mascot.size}px`,
        animation: (!mascot.follow_mouse && mascot.animation !== 'none') ? (ANIM_MAP[mascot.animation] || undefined) : undefined,
        opacity: isHidden ? 0 : 1,
        transform: isHidden ? 'scale(0.5)' : undefined,
        transition: mascot.follow_mouse ? 'opacity 0.4s ease' : 'opacity 0.4s ease, transform 0.4s ease',
        pointerEvents: isHidden ? 'none' : (hasLink || hasTooltip ? 'auto' : 'none'),
      }}
    >
      {hasTooltip && (
        <div className={`mascot-tooltip mascot-tooltip-${tooltipPos}`}>
          {mascot.tooltip_text}
        </div>
      )}
      <img
        src={mascot.image_url}
        alt="Theme mascot"
        draggable={false}
        className={hasLink ? 'hover:scale-110 transition-transform duration-200' : ''}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: mascot.opacity / 100,
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
          userSelect: 'none',
        }}
      />
    </div>
  );
}

export function CustomMascotRenderer() {
  const { currentTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mascots, setMascots] = useState<CustomMascot[]>([]);
  const prevThemeRef = useRef(currentTheme);

  useEffect(() => {
    loadMascots();
    prevThemeRef.current = currentTheme;
  }, [currentTheme]);

  const loadMascots = async () => {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', `custom_mascots_${currentTheme}`)
      .maybeSingle();

    if (data?.value && Array.isArray(data.value)) {
      setMascots(data.value as unknown as CustomMascot[]);
    } else {
      setMascots([]);
    }
  };

  const visibleMascots = mascots.filter(m => {
    if (!m.enabled || !m.image_url) return false;
    if (m.pages.includes('all')) return true;
    return m.pages.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
  });

  if (visibleMascots.length === 0) return null;

  return (
    <>
      <style>{ANIMATION_CSS}{TOOLTIP_CSS}</style>
      {visibleMascots.map((mascot) => (
        <MascotItem key={mascot.id} mascot={mascot} navigate={navigate} />
      ))}
    </>
  );
}