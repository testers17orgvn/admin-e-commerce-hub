import { cn } from '@/lib/utils';
import { formatLastSeen } from '@/hooks/useOnlineStatus';

interface OnlineIndicatorProps {
  isOnline: boolean | null;
  lastSeen?: string | null;
  showText?: boolean;
  size?: 'sm' | 'md';
}

export function OnlineIndicator({ isOnline, lastSeen, showText = false, size = 'sm' }: OnlineIndicatorProps) {
  if (isOnline === null) return showText ? <span className="text-xs text-muted-foreground">Ẩn hoạt động</span> : null;

  const dotSize = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';

  return (
    <span className="flex items-center gap-1">
      <span className={cn(
        "rounded-full shrink-0",
        dotSize,
        isOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"
      )} />
      {showText && (
        <span className="text-xs text-muted-foreground">
          {isOnline ? 'Đang hoạt động' : formatLastSeen(lastSeen || null)}
        </span>
      )}
    </span>
  );
}
