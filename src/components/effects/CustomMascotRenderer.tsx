import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/hooks/useTheme';
import type { CustomMascot } from '@/components/admin/CustomMascotManager';

const POSITION_STYLES: Record<string, React.CSSProperties> = {
  'top-left': { top: 0, left: 0 },
  'top-right': { top: 0, right: 0 },
  'center-left': { top: '50%', left: 0, transform: 'translateY(-50%)' },
  'center-right': { top: '50%', right: 0, transform: 'translateY(-50%)' },
  'bottom-left': { bottom: 0, left: 0 },
  'bottom-right': { bottom: 0, right: 0 },
};

const ANIMATION_CSS: Record<string, string> = {
  float: `
    @keyframes mascotFloat {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-15px); }
    }
  `,
  bounce: `
    @keyframes mascotBounce {
      0%, 100% { transform: translateY(0); }
      40% { transform: translateY(-25px); }
      60% { transform: translateY(-10px); }
    }
  `,
  swing: `
    @keyframes mascotSwing {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(8deg); }
      75% { transform: rotate(-8deg); }
    }
  `,
};

export function CustomMascotRenderer() {
  const { currentTheme } = useTheme();
  const location = useLocation();
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
      <style>{Object.values(ANIMATION_CSS).join('\n')}</style>
      {visibleMascots.map((mascot) => {
        const posStyle = POSITION_STYLES[mascot.position] || {};
        const animName =
          mascot.animation === 'float' ? 'mascotFloat' :
          mascot.animation === 'bounce' ? 'mascotBounce' :
          mascot.animation === 'swing' ? 'mascotSwing' : 'none';

        return (
          <div
            key={mascot.id}
            className="fixed pointer-events-none z-40"
            style={{
              ...posStyle,
              ...(posStyle.left !== undefined && typeof posStyle.left === 'number'
                ? { left: `${mascot.offset_x}%` } : {}),
              ...(posStyle.right !== undefined && typeof posStyle.right === 'number'
                ? { right: `${mascot.offset_x}%` } : {}),
              ...(posStyle.top !== undefined && typeof posStyle.top === 'number'
                ? { top: `${mascot.offset_y}%` } : {}),
              ...(posStyle.bottom !== undefined && typeof posStyle.bottom === 'number'
                ? { bottom: `${mascot.offset_y}%` } : {}),
              marginLeft: mascot.position.includes('left') ? `${mascot.offset_x}%` : undefined,
              marginRight: mascot.position.includes('right') ? `${mascot.offset_x}%` : undefined,
              marginTop: mascot.position.includes('top') ? `${mascot.offset_y}%` : undefined,
              marginBottom: mascot.position.includes('bottom') ? `${mascot.offset_y}%` : undefined,
            }}
          >
            <img
              src={mascot.image_url}
              alt="Theme mascot"
              style={{
                width: `${mascot.size}px`,
                height: `${mascot.size}px`,
                objectFit: 'contain',
                opacity: mascot.opacity / 100,
                animation: animName !== 'none' ? `${animName} 3s ease-in-out infinite` : undefined,
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
              }}
            />
          </div>
        );
      })}
    </>
  );
}
