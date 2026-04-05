import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Search, Plus, Users, Send } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface NewChatDialogProps {
  onStartChat: (userId: string) => Promise<string | null>;
}

export function NewChatDialog({ onStartChat }: NewChatDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (term: string) => {
    if (!term.trim() || term.length < 2) { setUsers([]); return; }
    setLoading(true);

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .neq('id', user?.id || '')
      .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
      .limit(20);

    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSelectUser = async (userId: string) => {
    const convId = await onStartChat(userId);
    if (convId) {
      setOpen(false);
      setSearch('');
      toast.success('Đã mở cuộc trò chuyện');
    } else {
      toast.error('Không thể tạo cuộc trò chuyện');
    }
  };

  // Fetch user roles
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  useEffect(() => {
    if (users.length === 0) return;
    const fetchRoles = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', users.map(u => u.id));
      
      const rolesMap: Record<string, string[]> = {};
      (data || []).forEach((r: any) => {
        if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
        rolesMap[r.user_id].push(r.role);
      });
      setUserRoles(rolesMap);
    };
    fetchRoles();
  }, [users]);

  const getRoleBadge = (role: string) => {
    const config: Record<string, { label: string; className: string }> = {
      admin: { label: 'Admin', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
      seller: { label: 'Seller', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
      shipper: { label: 'Shipper', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      dealer: { label: 'Dealer', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
      staff: { label: 'Staff', className: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400' },
    };
    return config[role] || { label: role, className: 'bg-muted text-muted-foreground' };
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Chat mới
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Cuộc trò chuyện mới
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc email..."
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {search.length < 2 ? 'Nhập ít nhất 2 ký tự để tìm' : 'Không tìm thấy người dùng'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={u.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/10 text-sm font-semibold">
                        {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{u.full_name || 'Chưa đặt tên'}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end shrink-0">
                      {(userRoles[u.id] || []).map(role => {
                        const badge = getRoleBadge(role);
                        return (
                          <Badge key={role} variant="secondary" className={cn("text-[10px] px-1.5 py-0", badge.className)}>
                            {badge.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
