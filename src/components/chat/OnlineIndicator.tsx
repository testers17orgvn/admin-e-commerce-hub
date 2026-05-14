import { cn } from '@/lib/utils';
import { formatLastSeen, useOnlineStatus } from '@/hooks/useOnlineStatus';

interface OnlineIndicatorProps {
  isOnline?: boolean | null;
  lastSeen?: string | null;
  userId?: string;
  showText?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function OnlineIndicator({ isOnline, lastSeen, userId, showText = false, size = 'sm', className }: OnlineIndicatorProps) {
  const { isUserOnline, getLastSeen } = useOnlineStatus();

  const resolvedOnline = userId ? isUserOnline(userId) : (isOnline ?? null);
  const resolvedLastSeen = userId ? getLastSeen(userId) : (lastSeen ?? null);

  if (resolvedOnline === null) {
    return showText ? <span className={cn("text-xs text-muted-foreground", className)}>Ẩn hoạt động</span> : null;
  }

  const dotSize = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';

  return (
    <span className={cn("flex items-center gap-1", className)}>
      <span className={cn(
        "rounded-full shrink-0",
        dotSize,
        resolvedOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"
      )} />
      {showText && (
        <span className="text-xs text-muted-foreground">
          {resolvedOnline ? 'Đang hoạt động' : formatLastSeen(resolvedLastSeen)}
        </span>
      )}
    </span>
  );
}
