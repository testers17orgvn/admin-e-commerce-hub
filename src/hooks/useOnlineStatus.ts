import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OnlineStatus {
  user_id: string;
  is_online: boolean;
  last_seen_at: string;
  show_activity: boolean;
}

export function useOnlineStatus() {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<Map<string, OnlineStatus>>(new Map());

  // Update own status
  const updateMyStatus = useCallback(async (isOnline: boolean) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from('user_online_status')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('user_online_status')
        .update({ is_online: isOnline, last_seen_at: new Date().toISOString() })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('user_online_status')
        .insert({ user_id: user.id, is_online: isOnline, last_seen_at: new Date().toISOString() });
    }
  }, [user]);

  // Toggle show activity
  const toggleShowActivity = useCallback(async (show: boolean) => {
    if (!user) return;
    await supabase
      .from('user_online_status')
      .update({ show_activity: show })
      .eq('user_id', user.id);
  }, [user]);

  // Set online on mount, offline on unmount
  useEffect(() => {
    if (!user) return;
    updateMyStatus(true);

    const interval = setInterval(() => updateMyStatus(true), 60000); // heartbeat

    const handleVisibility = () => {
      updateMyStatus(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliability
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_online_status?user_id=eq.${user.id}`;
      navigator.sendBeacon?.(url); // fallback - update via realtime
      updateMyStatus(false);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateMyStatus(false);
    };
  }, [user, updateMyStatus]);

  // Fetch all statuses
  useEffect(() => {
    if (!user) return;

    const fetchStatuses = async () => {
      const { data } = await supabase.from('user_online_status').select('*');
      if (data) {
        const map = new Map<string, OnlineStatus>();
        data.forEach(s => map.set(s.user_id, s as OnlineStatus));
        setStatuses(map);
      }
    };
    fetchStatuses();

    const channel = supabase
      .channel('online-status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_online_status' }, (payload) => {
        const record = (payload.new as OnlineStatus);
        if (record?.user_id) {
          setStatuses(prev => {
            const next = new Map(prev);
            next.set(record.user_id, record);
            return next;
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const getStatus = useCallback((userId: string) => {
    return statuses.get(userId) || null;
  }, [statuses]);

  const isUserOnline = useCallback((userId: string) => {
    const status = statuses.get(userId);
    if (!status || !status.show_activity) return null; // null = unknown/hidden
    return status.is_online;
  }, [statuses]);

  const getLastSeen = useCallback((userId: string) => {
    const status = statuses.get(userId);
    if (!status || !status.show_activity) return null;
    return status.last_seen_at;
  }, [statuses]);

  const getMyShowActivity = useCallback(() => {
    if (!user) return true;
    const status = statuses.get(user.id);
    return status?.show_activity ?? true;
  }, [user, statuses]);

  return { isUserOnline, getLastSeen, getStatus, toggleShowActivity, getMyShowActivity, statuses };
}

export function formatLastSeen(lastSeenAt: string | null): string {
  if (!lastSeenAt) return '';
  const now = new Date();
  const last = new Date(lastSeenAt);
  const diffMs = now.getTime() - last.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'Vừa mới truy cập';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return last.toLocaleDateString('vi-VN');
}
