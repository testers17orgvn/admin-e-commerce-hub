import { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Eye, Search, Shield, Users, Store, Building2, ClipboardCheck,
  ShoppingBag, Truck, UserPlus, Calendar, Mail, Phone, MapPin,
  ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown,
  TrendingUp, Activity, UserCheck, Ban
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';


type AppRole = 'admin' | 'staff' | 'seller' | 'dealer' | 'tester' | 'shipper';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: AppRole[];
  is_verified_seller: boolean;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  payment_status: string;
}

const roleConfig: Record<AppRole, { label: string; description: string; color: string; icon: React.ReactNode }> = {
  admin: { label: 'Admin', description: 'Toàn quyền quản lý hệ thống', color: 'bg-red-500/90 text-white', icon: <Shield className="h-3.5 w-3.5" /> },
  staff: { label: 'Nhân viên', description: 'Hỗ trợ quản lý đơn hàng và khách hàng', color: 'bg-blue-500/90 text-white', icon: <Users className="h-3.5 w-3.5" /> },
  seller: { label: 'Seller', description: 'Đăng và quản lý sản phẩm của mình', color: 'bg-emerald-500/90 text-white', icon: <Store className="h-3.5 w-3.5" /> },
  dealer: { label: 'Đại lý', description: 'Phân phối sản phẩm với giá ưu đãi', color: 'bg-violet-500/90 text-white', icon: <Building2 className="h-3.5 w-3.5" /> },
  tester: { label: 'Tester', description: 'Xem và duyệt sản phẩm trước khi đăng', color: 'bg-amber-500/90 text-white', icon: <ClipboardCheck className="h-3.5 w-3.5" /> },
  shipper: { label: 'Shipper', description: 'Nhận và giao đơn hàng cho khách', color: 'bg-cyan-500/90 text-white', icon: <Truck className="h-3.5 w-3.5" /> },
};

type SortField = 'full_name' | 'email' | 'created_at';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 15;

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkRoleAction, setBulkRoleAction] = useState<AppRole | ''>('');

  const fetchData = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setCurrentUserId(currentUser?.id || null);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (profiles) {
      const usersWithRoles = profiles.map((profile: any) => {
        const userRoles = roles?.filter((r: any) => r.user_id === profile.id).map((r: any) => r.role as AppRole) || [];
        return { ...profile, roles: userRoles };
      });
      setUsers(usersWithRoles);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredUsers = useMemo(() => {
    let result = users.filter(user =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm)
    );
    if (activeTab !== 'all') {
      if (activeTab === 'customer') {
        result = result.filter(u => u.roles.length === 0);
      } else {
        result = result.filter(u => u.roles.includes(activeTab as AppRole));
      }
    }
    result.sort((a, b) => {
      const valA = (a[sortField] || '') as string;
      const valB = (b[sortField] || '') as string;
      const cmp = valA.localeCompare(valB);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [users, searchTerm, activeTab, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [searchTerm, activeTab]);

  const viewUserDetails = async (user: UserProfile) => {
    setSelectedUser(user);
    const { data: orders } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at, payment_status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setUserOrders(orders || []);
    setIsOpen(true);
  };

  const toggleRole = async (targetUser: UserProfile, role: AppRole) => {
    if (role === 'admin' && targetUser.id === currentUserId && targetUser.roles.includes('admin')) {
      toast.error('Bạn không thể xóa quyền admin của chính mình!');
      return;
    }
    const hasRole = targetUser.roles.includes(role);
    if (hasRole) {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', targetUser.id).eq('role', role);
      if (error) { toast.error(`Lỗi khi xóa vai trò ${roleConfig[role].label}`); return; }
      toast.success(`Đã xóa vai trò ${roleConfig[role].label}`);
    } else {
      const { error } = await supabase.from('user_roles').insert({ user_id: targetUser.id, role });
      if (error) { toast.error(`Lỗi khi thêm vai trò ${roleConfig[role].label}`); return; }
      toast.success(`Đã thêm vai trò ${roleConfig[role].label}`);
    }
    fetchData();
  };

  const handleBulkAddRole = async () => {
    if (!bulkRoleAction || bulkSelected.size === 0) return;
    let success = 0;
    for (const uid of bulkSelected) {
      const user = users.find(u => u.id === uid);
      if (user && !user.roles.includes(bulkRoleAction)) {
        const { error } = await supabase.from('user_roles').insert({ user_id: uid, role: bulkRoleAction });
        if (!error) success++;
      }
    }
    toast.success(`Đã thêm vai trò ${roleConfig[bulkRoleAction].label} cho ${success} người dùng`);
    setBulkSelected(new Set());
    setBulkRoleAction('');
    fetchData();
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const getRoleCount = (role: AppRole) => users.filter(u => u.roles.includes(role)).length;
  const customerCount = users.filter(u => u.roles.length === 0).length;

  const newThisWeek = users.filter(u => {
    const d = new Date(u.created_at);
    const now = new Date();
    return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Chờ xử lý', color: 'bg-yellow-500' },
    confirmed: { label: 'Đã xác nhận', color: 'bg-blue-500' },
    shipping: { label: 'Đang giao', color: 'bg-purple-500' },
    delivered: { label: 'Đã giao', color: 'bg-green-500' },
    cancelled: { label: 'Đã hủy', color: 'bg-red-500' },
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  };

  const toggleBulkSelect = (uid: string) => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  const selectAll = () => {
    if (bulkSelected.size === paginatedUsers.length) setBulkSelected(new Set());
    else setBulkSelected(new Set(paginatedUsers.map(u => u.id)));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý người dùng</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {users.length} người dùng · {newThisWeek} mới trong tuần
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <Card
            className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${activeTab === 'all' ? 'ring-2 ring-accent shadow-md' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <span className="text-2xl font-bold">{users.length}</span>
              <span className="text-[11px] text-muted-foreground">Tất cả</span>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${activeTab === 'customer' ? 'ring-2 ring-accent shadow-md' : ''}`}
            onClick={() => setActiveTab('customer')}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-2">
                <UserCheck className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="text-2xl font-bold">{customerCount}</span>
              <span className="text-[11px] text-muted-foreground">Khách hàng</span>
            </CardContent>
          </Card>
          {(Object.keys(roleConfig) as AppRole[]).map((role) => (
            <Card
              key={role}
              className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${activeTab === role ? 'ring-2 ring-accent shadow-md' : ''}`}
              onClick={() => setActiveTab(role)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-xl ${roleConfig[role].color} flex items-center justify-center mb-2`}>
                  {roleConfig[role].icon}
                </div>
                <span className="text-2xl font-bold">{getRoleCount(role)}</span>
                <span className="text-[11px] text-muted-foreground">{roleConfig[role].label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search + Bulk Actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, email, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          {bulkSelected.size > 0 && (
            <div className="flex items-center gap-2 animate-fade-in">
              <Badge variant="secondary">{bulkSelected.size} đã chọn</Badge>
              <Select value={bulkRoleAction} onValueChange={(v) => setBulkRoleAction(v as AppRole)}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Thêm vai trò..." />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(roleConfig) as AppRole[]).map(r => (
                    <SelectItem key={r} value={r}>{roleConfig[r].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleBulkAddRole} disabled={!bulkRoleAction}>
                <UserPlus className="h-3.5 w-3.5 mr-1" /> Áp dụng
              </Button>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={paginatedUsers.length > 0 && bulkSelected.size === paginatedUsers.length}
                      onCheckedChange={selectAll}
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('full_name')}>
                    <span className="flex items-center">Người dùng <SortIcon field="full_name" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hidden md:table-cell" onClick={() => toggleSort('email')}>
                    <span className="flex items-center">Liên hệ <SortIcon field="email" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hidden lg:table-cell" onClick={() => toggleSort('created_at')}>
                    <span className="flex items-center">Ngày tham gia <SortIcon field="created_at" /></span>
                  </TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead className="text-right w-20">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <Checkbox
                        checked={bulkSelected.has(user.id)}
                        onCheckedChange={() => toggleBulkSelect(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-accent/10 text-accent font-semibold">
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{user.full_name || 'Chưa đặt tên'}</p>
                          <p className="text-xs text-muted-foreground truncate md:hidden">{user.email || '-'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-0.5">
                        <p className="text-sm truncate max-w-[200px]">{user.email || '-'}</p>
                        {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="space-y-0.5">
                        <p className="text-sm">{format(new Date(user.created_at), 'dd/MM/yyyy')}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: vi })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {user.roles.length === 0 ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">Khách hàng</Badge>
                        ) : (
                          user.roles.map((role) => (
                            <Badge key={role} className={`${roleConfig[role].color} text-[10px] px-1.5 py-0.5 gap-0.5`}>
                              {roleConfig[role].icon}
                              {roleConfig[role].label}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-60 group-hover:opacity-100 transition-opacity"
                        onClick={() => viewUserDetails(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Không tìm thấy người dùng nào</p>
              <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
              <p className="text-sm text-muted-foreground">
                Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredUsers.length)} / {filteredUsers.length}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 5) p = i + 1;
                  else if (page <= 3) p = i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else p = page - 2 + i;
                  return (
                    <Button
                      key={p}
                      variant={page === p ? 'default' : 'ghost'}
                      size="icon"
                      className="h-8 w-8 text-xs"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  );
                })}
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Chi tiết người dùng</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <>
              {/* User Header */}
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                    <AvatarFallback className="text-lg bg-accent/10 text-accent font-bold">
                      {getInitials(selectedUser.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate">{selectedUser.full_name || 'Chưa đặt tên'}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {selectedUser.roles.length === 0 ? (
                      <Badge variant="outline" className="text-xs">Khách hàng</Badge>
                    ) : (
                      selectedUser.roles.map((role) => (
                        <Badge key={role} className={`${roleConfig[role].color} text-xs gap-0.5`}>
                          {roleConfig[role].icon}
                          {roleConfig[role].label}
                        </Badge>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Tham gia {formatDistanceToNow(new Date(selectedUser.created_at), { addSuffix: true, locale: vi })}
                  </p>
                </div>
              </div>

              <Tabs defaultValue="info" className="w-full mt-2">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="info">Thông tin</TabsTrigger>
                  <TabsTrigger value="orders">Đơn hàng ({userOrders.length})</TabsTrigger>
                  <TabsTrigger value="roles">Phân quyền</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium truncate">{selectedUser.email || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Điện thoại</p>
                        <p className="text-sm font-medium">{selectedUser.phone || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 sm:col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Địa chỉ</p>
                        <p className="text-sm font-medium">{selectedUser.address || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-lg bg-muted/20 border">
                      <p className="text-xl font-bold">{userOrders.length}</p>
                      <p className="text-xs text-muted-foreground">Đơn hàng</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/20 border">
                      <p className="text-xl font-bold">
                        {userOrders.reduce((s, o) => s + (o.status === 'delivered' ? o.total_amount : 0), 0).toLocaleString('vi-VN')}
                      </p>
                      <p className="text-xs text-muted-foreground">Chi tiêu (₫)</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/20 border">
                      <p className="text-xl font-bold">
                        {userOrders.filter(o => o.status === 'delivered').length}
                      </p>
                      <p className="text-xs text-muted-foreground">Hoàn thành</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="orders" className="pt-4">
                  {userOrders.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Chưa có đơn hàng nào</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {userOrders.map((order) => (
                        <div key={order.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                          <div>
                            <p className="font-mono text-sm font-medium">#{order.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="font-bold text-sm">{order.total_amount.toLocaleString('vi-VN')}₫</p>
                            <div className="flex gap-1 justify-end">
                              <Badge className={`${statusConfig[order.status]?.color || 'bg-gray-500'} text-[10px] px-1.5`}>
                                {statusConfig[order.status]?.label || order.status}
                              </Badge>
                              {order.payment_status === 'paid' && (
                                <Badge className="bg-emerald-500 text-[10px] px-1.5">Đã TT</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="roles" className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Chọn vai trò cho <strong>{selectedUser.full_name || selectedUser.email}</strong>:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(Object.keys(roleConfig) as AppRole[]).map((role) => {
                      const hasRole = selectedUser.roles.includes(role);
                      const isCurrentUserAdmin = role === 'admin' && selectedUser.id === currentUserId;

                      return (
                        <div
                          key={role}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                            hasRole ? 'border-accent bg-accent/5 shadow-sm' : 'border-transparent bg-muted/20 hover:bg-muted/40'
                          }`}
                          onClick={() => !isCurrentUserAdmin && toggleRole(selectedUser, role)}
                        >
                          <Checkbox
                            checked={hasRole}
                            disabled={isCurrentUserAdmin}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-6 h-6 rounded-md ${roleConfig[role].color} flex items-center justify-center`}>
                                {roleConfig[role].icon}
                              </div>
                              <span className="font-medium text-sm">{roleConfig[role].label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{roleConfig[role].description}</p>
                            {isCurrentUserAdmin && (
                              <p className="text-[10px] text-destructive mt-1">Không thể xóa admin của chính mình</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
