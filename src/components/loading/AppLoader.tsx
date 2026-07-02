import { useEffect, useState } from 'react';
import { LoadingSettings, defaultLoadingSettings } from '@/hooks/useLoadingSettings';

interface LoaderProps {
  settings?: LoadingSettings;
  fullScreen?: boolean;
  className?: string;
}

/**
 * Animated, admin-configurable loader.
 * Renders instantly from cache/defaults — no DB dependency required.
 */
export function AppLoader({ settings, fullScreen = true, className }: LoaderProps) {
  const s = settings ?? defaultLoadingSettings;
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    if (!s.show_progress) return;
    const id = setInterval(() => {
      setProgress((p) => (p >= 92 ? 92 : p + Math.random() * 8));
    }, 400 / Math.max(0.2, s.speed));
    return () => clearInterval(id);
  }, [s.show_progress, s.speed]);

  const wrapperStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${s.gradient_from}, ${s.gradient_to})`,
    color: '#fff',
  };
  const accent = s.accent_color;
  const durationMs = Math.round(1200 / Math.max(0.2, s.speed));

  const wrapCls = fullScreen
    ? 'fixed inset-0 z-[9999] flex items-center justify-center'
    : 'min-h-[60vh] w-full flex items-center justify-center';

  return (
    <div className={`${wrapCls} ${className ?? ''}`} style={wrapperStyle}>
      {s.effect === 'particles' && <Particles color={accent} />}
      <div className="relative flex flex-col items-center gap-6 px-6 text-center max-w-sm w-full">
        <LogoBlock settings={s} durationMs={durationMs} accent={accent} />
        <EffectBlock effect={s.effect} accent={accent} durationMs={durationMs} />
        {s.show_tagline && s.tagline && (
          <p className="text-sm md:text-base text-white/80 tracking-wide animate-pulse">
            {s.tagline}
          </p>
        )}
        {s.show_progress && (
          <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${accent}, #fff)`,
                boxShadow: `0 0 12px ${accent}`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function LogoBlock({
  settings,
  durationMs,
  accent,
}: {
  settings: LoadingSettings;
  durationMs: number;
  accent: string;
}) {
  const breath = settings.effect === 'logo-breath';
  const style: React.CSSProperties = {
    animation: breath ? `loader-breath ${durationMs * 1.5}ms ease-in-out infinite` : undefined,
    filter: `drop-shadow(0 0 24px ${accent}80)`,
  };
  if (settings.logo_url) {
    return (
      <img
        src={settings.logo_url}
        alt="Loading"
        className="h-16 w-16 md:h-20 md:w-20 object-contain"
        style={style}
      />
    );
  }
  return (
    <div
      className="h-16 w-16 md:h-20 md:w-20 rounded-2xl flex items-center justify-center text-2xl font-bold"
      style={{
        ...style,
        background: `linear-gradient(135deg, ${accent}, ${accent}80)`,
      }}
    >
      ★
    </div>
  );
}

function EffectBlock({
  effect,
  accent,
  durationMs,
}: {
  effect: LoadingSettings['effect'];
  accent: string;
  durationMs: number;
}) {
  if (effect === 'spinner') {
    return (
      <div
        className="h-8 w-8 rounded-full border-4 border-white/20 border-t-transparent animate-spin"
        style={{ borderTopColor: accent, animationDuration: `${durationMs}ms` }}
      />
    );
  }
  if (effect === 'pulse') {
    return (
      <div className="relative h-6 w-6">
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: accent, animationDuration: `${durationMs}ms` }}
        />
        <span className="absolute inset-0 rounded-full" style={{ background: accent }} />
      </div>
    );
  }
  if (effect === 'dots') {
    return (
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-3 w-3 rounded-full"
            style={{
              background: accent,
              animation: `loader-bounce ${durationMs}ms ease-in-out ${i * 150}ms infinite`,
            }}
          />
        ))}
      </div>
    );
  }
  if (effect === 'wave') {
    return (
      <div className="flex items-end gap-1 h-8">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="w-1.5 rounded-full"
            style={{
              background: accent,
              animation: `loader-wave ${durationMs}ms ease-in-out ${i * 100}ms infinite`,
              height: '100%',
            }}
          />
        ))}
      </div>
    );
  }
  return null;
}

function Particles({ color }: { color: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full opacity-40"
          style={{
            width: `${4 + Math.random() * 10}px`,
            height: `${4 + Math.random() * 10}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: color,
            animation: `loader-float ${6 + Math.random() * 6}s ease-in-out ${Math.random() * 3}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
