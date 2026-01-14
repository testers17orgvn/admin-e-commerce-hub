import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Eye, Search, UserPlus, Shield, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  isAdmin?: boolean;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchData = async () => {
    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch user roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (profiles) {
      const usersWithRoles = profiles.map((profile: any) => ({
        ...profile,
        isAdmin: roles?.some((r: any) => r.user_id === profile.id && r.role === 'admin'),
      }));
      setUsers(usersWithRoles);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const viewUserDetails = async (user: UserProfile) => {
    setSelectedUser(user);
    
    // Fetch user's orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    setUserOrders(orders || []);
    setIsOpen(true);
  };

  const toggleAdminRole = async (targetUser: UserProfile) => {
    // Get current user to prevent self-removal
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (targetUser.isAdmin && targetUser.id === currentUser?.id) {
      toast.error('Bạn không thể xóa quyền admin của chính mình!');
      return;
    }

    if (targetUser.isAdmin) {
      // Remove admin role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', targetUser.id)
        .eq('role', 'admin');
      
      if (error) {
        toast.error('Lỗi khi xóa quyền admin');
        return;
      }
      toast.success('Đã xóa quyền admin');
    } else {
      // Add admin role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: targetUser.id, role: 'admin' });
      
      if (error) {
        toast.error('Lỗi khi thêm quyền admin');
        return;
      }
      toast.success('Đã thêm quyền admin');
    }
    fetchData();
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Chờ xử lý', color: 'bg-yellow-500' },
    confirmed: { label: 'Đã xác nhận', color: 'bg-blue-500' },
    shipping: { label: 'Đang giao', color: 'bg-purple-500' },
    delivered: { label: 'Đã giao', color: 'bg-green-500' },
    cancelled: { label: 'Đã hủy', color: 'bg-red-500' },
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người dùng</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Điện thoại</TableHead>
              <TableHead>Ngày đăng ký</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.full_name || 'Chưa cập nhật'}
                </TableCell>
                <TableCell>{user.email || '-'}</TableCell>
                <TableCell>{user.phone || '-'}</TableCell>
                <TableCell>
                  {format(new Date(user.created_at), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell>
                  {user.isAdmin ? (
                    <Badge className="bg-accent">Admin</Badge>
                  ) : (
                    <Badge variant="secondary">Khách hàng</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => viewUserDetails(user)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => toggleAdminRole(user)}
                    title={user.isAdmin ? 'Xóa quyền admin' : 'Thêm quyền admin'}
                  >
                    {user.isAdmin ? (
                      <ShieldOff className="h-4 w-4 text-destructive" />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            Không tìm thấy người dùng nào
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Thông tin người dùng</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Họ tên</label>
                  <p className="font-medium">{selectedUser.full_name || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="font-medium">{selectedUser.email || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Điện thoại</label>
                  <p className="font-medium">{selectedUser.phone || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ngày đăng ký</label>
                  <p className="font-medium">{format(new Date(selectedUser.created_at), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Địa chỉ</label>
                  <p className="font-medium">{selectedUser.address || 'Chưa cập nhật'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Lịch sử đơn hàng ({userOrders.length})</h4>
                {userOrders.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Chưa có đơn hàng nào</p>
                ) : (
                  <div className="space-y-2">
                    {userOrders.map((order) => (
                      <div key={order.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{order.total_amount.toLocaleString('vi-VN')}đ</p>
                          <Badge className={statusConfig[order.status]?.color || 'bg-gray-500'}>
                            {statusConfig[order.status]?.label || order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}