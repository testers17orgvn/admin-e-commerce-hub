import { useEffect, useState, useRef } from 'react';
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

const ANIM_MAP: Record<string, string> = {
  float: 'mascotFloat 3s ease-in-out infinite',
  bounce: 'mascotBounce 1.5s ease-in-out infinite',
  swing: 'mascotSwing 2s ease-in-out infinite',
  shake: 'mascotShake 0.6s ease-in-out infinite',
  spin: 'mascotSpin 4s linear infinite',
  pulse: 'mascotPulse 2s ease-in-out infinite',
  tada: 'mascotTada 1.5s ease-in-out infinite',
  wiggle: 'mascotWiggle 1s ease-in-out infinite',
};

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

  const handleClick = (mascot: CustomMascot) => {
    if (!mascot.link_url) return;
    if (mascot.link_url.startsWith('http')) {
      window.open(mascot.link_url, mascot.link_target || '_blank');
    } else {
      navigate(mascot.link_url);
    }
  };

  if (visibleMascots.length === 0) return null;

  return (
    <>
      <style>{ANIMATION_CSS}</style>
      {visibleMascots.map((mascot) => {
        const hasLink = !!mascot.link_url;
        const pos: React.CSSProperties = { position: 'fixed', zIndex: 40 };

        // Position
        if (mascot.position.includes('left')) pos.left = `${mascot.offset_x}%`;
        if (mascot.position.includes('right')) pos.right = `${mascot.offset_x}%`;
        if (mascot.position.includes('top') && !mascot.position.includes('center')) pos.top = `${mascot.offset_y}%`;
        if (mascot.position.includes('bottom')) pos.bottom = `${mascot.offset_y}%`;
        if (mascot.position.includes('center')) {
          pos.top = '50%';
          pos.marginTop = `${mascot.offset_y}%`;
        }

        return (
          <div
            key={mascot.id}
            onClick={() => handleClick(mascot)}
            className={hasLink ? 'cursor-pointer' : 'pointer-events-none'}
            style={{
              ...pos,
              transition: 'transform 0.2s',
            }}
            title={hasLink ? `Đi đến: ${mascot.link_url}` : undefined}
          >
            <img
              src={mascot.image_url}
              alt="Theme mascot"
              className={hasLink ? 'hover:scale-110 transition-transform duration-200' : ''}
              style={{
                width: `${mascot.size}px`,
                height: `${mascot.size}px`,
                objectFit: 'contain',
                opacity: mascot.opacity / 100,
                animation: ANIM_MAP[mascot.animation] || undefined,
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
              }}
            />
          </div>
        );
      })}
    </>
  );
}
