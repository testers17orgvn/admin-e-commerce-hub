import { Sparkles, Zap, Tag, Flame } from 'lucide-react';

export function SaleHeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl mb-6 shadow-xl shadow-primary/20 isolate">
      {/* Animated gradient background */}
      <div className="absolute inset-0 animate-gradient-shift bg-[linear-gradient(120deg,hsl(var(--primary)),hsl(var(--accent)),hsl(var(--primary)),#ff4d8d,hsl(var(--primary)))]" />

      {/* Soft glow blobs */}
      <div className="pointer-events-none absolute -top-16 -left-10 w-64 h-64 bg-white/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 w-72 h-72 bg-yellow-300/30 rounded-full blur-3xl animate-pulse-slow" />

      {/* Diagonal shimmer sweep */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-slide" />
      </div>

      {/* Sparkles */}
      <Sparkles className="pointer-events-none absolute top-4 left-6 w-4 h-4 text-yellow-200 animate-sparkle" style={{ animationDelay: '0s' }} />
      <Sparkles className="pointer-events-none absolute top-10 right-1/4 w-5 h-5 text-white animate-sparkle" style={{ animationDelay: '0.4s' }} />
      <Sparkles className="pointer-events-none absolute bottom-6 left-1/3 w-3 h-3 text-yellow-100 animate-sparkle" style={{ animationDelay: '0.9s' }} />
      <Sparkles className="pointer-events-none absolute bottom-10 right-10 w-4 h-4 text-white animate-sparkle" style={{ animationDelay: '1.3s' }} />
      <Sparkles className="pointer-events-none absolute top-1/2 left-10 w-3 h-3 text-yellow-200 animate-sparkle" style={{ animationDelay: '1.7s' }} />

      {/* Content */}
      <div className="relative z-10 px-5 py-7 md:px-10 md:py-10 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-3 animate-flash-pulse">
            <Flame className="w-3.5 h-3.5 text-yellow-200" />
            <span className="text-[11px] md:text-xs font-bold text-white uppercase tracking-wider">Mega Sale</span>
          </div>
          <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-lg">
            Giảm đến{' '}
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-white to-yellow-200 animate-gradient-shift">
              50%
            </span>
          </h2>
          <p className="text-white/90 text-xs md:text-sm mt-1.5 md:mt-2 font-medium drop-shadow">
            Săn deal sốc mỗi ngày · Freeship đơn từ 299K
          </p>
          <div className="flex items-center gap-2 md:gap-3 mt-3 md:mt-4 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-white text-primary text-[11px] md:text-xs font-bold shadow-md">
              <Zap className="w-3.5 h-3.5 fill-primary" />
              Flash Sale
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-yellow-300 text-yellow-900 text-[11px] md:text-xs font-bold shadow-md">
              <Tag className="w-3.5 h-3.5" />
              Voucher 100K
            </div>
          </div>
        </div>

        {/* Big discount badge */}
        <div className="hidden sm:flex flex-shrink-0 relative animate-float-y">
          <div className="absolute inset-0 bg-yellow-300 rounded-full blur-xl opacity-60 animate-pulse-slow" />
          <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-300 to-orange-400 flex flex-col items-center justify-center shadow-2xl border-4 border-white/40">
            <span className="text-[10px] md:text-xs font-bold text-orange-900 uppercase">Sale</span>
            <span className="font-display text-2xl md:text-4xl font-black text-orange-900 leading-none">50%</span>
            <span className="text-[10px] md:text-xs font-bold text-orange-900 uppercase">Off</span>
          </div>
        </div>
      </div>
    </div>
  );
}
