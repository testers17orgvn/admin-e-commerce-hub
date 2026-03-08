import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Search, Shield, ShieldOff, Users, Store, Building2, ClipboardCheck, ShoppingBag, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';

type AppRole = 'admin' | 'staff' | 'seller' | 'dealer' | 'tester' | 'shipper';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  roles: AppRole[];
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const roleConfig: Record<AppRole, { label: string; description: string; color: string; icon: React.ReactNode }> = {
  admin: { 
    label: 'Quản trị viên', 
    description: 'Toàn quyền quản lý hệ thống',
    color: 'bg-red-500',
    icon: <Shield className="h-4 w-4" />
  },
  staff: { 
    label: 'Nhân viên', 
    description: 'Hỗ trợ quản lý đơn hàng và khách hàng',
    color: 'bg-blue-500',
    icon: <Users className="h-4 w-4" />
  },
  seller: { 
    label: 'Người bán hàng', 
    description: 'Đăng và quản lý sản phẩm của mình',
    color: 'bg-green-500',
    icon: <Store className="h-4 w-4" />
  },
  dealer: { 
    label: 'Đại lý', 
    description: 'Phân phối sản phẩm với giá ưu đãi',
    color: 'bg-purple-500',
    icon: <Building2 className="h-4 w-4" />
  },
  tester: { 
    label: 'Kiểm duyệt viên', 
    description: 'Xem và duyệt sản phẩm trước khi đăng',
    color: 'bg-orange-500',
    icon: <ClipboardCheck className="h-4 w-4" />
  },
  shipper: { 
    label: 'Shipper', 
    description: 'Nhận và giao đơn hàng cho khách',
    color: 'bg-teal-500',
    icon: <Truck className="h-4 w-4" />
  },
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchData = async () => {
    // Get current user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setCurrentUserId(currentUser?.id || null);

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch all user roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (profiles) {
      const usersWithRoles = profiles.map((profile: any) => {
        const userRoles = roles?.filter((r: any) => r.user_id === profile.id).map((r: any) => r.role as AppRole) || [];
        return {
          ...profile,
          roles: userRoles,
        };
      });
      setUsers(usersWithRoles);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const viewUserDetails = async (user: UserProfile) => {
    setSelectedUser(user);
    
    const { data: orders } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    setUserOrders(orders || []);
    setIsOpen(true);
  };

  const toggleRole = async (targetUser: UserProfile, role: AppRole) => {
    // Prevent self-removal of admin role
    if (role === 'admin' && targetUser.id === currentUserId && targetUser.roles.includes('admin')) {
      toast.error('Bạn không thể xóa quyền admin của chính mình!');
      return;
    }

    const hasRole = targetUser.roles.includes(role);

    if (hasRole) {
      // Remove role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', targetUser.id)
        .eq('role', role);
      
      if (error) {
        toast.error(`Lỗi khi xóa vai trò ${roleConfig[role].label}`);
        return;
      }
      toast.success(`Đã xóa vai trò ${roleConfig[role].label}`);
    } else {
      // Add role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: targetUser.id, role });
      
      if (error) {
        toast.error(`Lỗi khi thêm vai trò ${roleConfig[role].label}`);
        return;
      }
      toast.success(`Đã thêm vai trò ${roleConfig[role].label}`);
    }
    fetchData();
  };

  const getFilteredUsers = () => {
    let filtered = users.filter(user => 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm)
    );

    if (activeTab !== 'all') {
      filtered = filtered.filter(user => user.roles.includes(activeTab as AppRole));
    }

    return filtered;
  };

  const filteredUsers = getFilteredUsers();

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Chờ xử lý', color: 'bg-yellow-500' },
    confirmed: { label: 'Đã xác nhận', color: 'bg-blue-500' },
    shipping: { label: 'Đang giao', color: 'bg-purple-500' },
    delivered: { label: 'Đã giao', color: 'bg-green-500' },
    cancelled: { label: 'Đã hủy', color: 'bg-red-500' },
  };

  const getRoleCount = (role: AppRole) => users.filter(u => u.roles.includes(role)).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Quản lý người dùng & Vai trò</h1>
        </div>

        {/* Role Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('all')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Tất cả
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          
          {(Object.keys(roleConfig) as AppRole[]).map((role) => (
            <Card 
              key={role} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${activeTab === role ? 'ring-2 ring-accent' : ''}`}
              onClick={() => setActiveTab(role)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {roleConfig[role].icon}
                  {roleConfig[role].label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getRoleCount(role)}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Role Description */}
        {activeTab !== 'all' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {roleConfig[activeTab as AppRole].icon}
                {roleConfig[activeTab as AppRole].label}
              </CardTitle>
              <CardDescription>{roleConfig[activeTab as AppRole].description}</CardDescription>
            </CardHeader>
            <CardContent>
              {activeTab === 'seller' && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>✅ Đăng sản phẩm mới</p>
                  <p>✅ Quản lý sản phẩm của mình</p>
                  <p>✅ Xem đơn hàng liên quan</p>
                  <p>❌ Không thể xóa sản phẩm của người khác</p>
                </div>
              )}
              {activeTab === 'dealer' && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>✅ Xem giá đại lý ưu đãi</p>
                  <p>✅ Đặt hàng số lượng lớn</p>
                  <p>✅ Báo cáo doanh số</p>
                  <p>❌ Không thể chỉnh sửa sản phẩm gốc</p>
                </div>
              )}
              {activeTab === 'tester' && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>✅ Xem tất cả sản phẩm chờ duyệt</p>
                  <p>✅ Duyệt hoặc từ chối sản phẩm</p>
                  <p>✅ Ghi chú phản hồi cho seller</p>
                  <p>❌ Không thể chỉnh sửa sản phẩm</p>
                </div>
              )}
              {activeTab === 'admin' && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>✅ Toàn quyền quản lý hệ thống</p>
                  <p>✅ Quản lý người dùng và vai trò</p>
                  <p>✅ Cấu hình cài đặt</p>
                  <p>✅ Xem báo cáo tổng hợp</p>
                </div>
              )}
              {activeTab === 'staff' && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>✅ Xử lý đơn hàng</p>
                  <p>✅ Hỗ trợ khách hàng</p>
                  <p>✅ Quản lý liên hệ</p>
                  <p>❌ Không thể thay đổi cài đặt hệ thống</p>
                </div>
              )}
              {activeTab === 'shipper' && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>✅ Nhận đơn hàng được giao</p>
                  <p>✅ Cập nhật trạng thái giao hàng</p>
                  <p>✅ Theo dõi GPS vị trí</p>
                  <p>❌ Không thể quản lý sản phẩm</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Users Table */}
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
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length === 0 ? (
                        <Badge variant="secondary">Khách hàng</Badge>
                      ) : (
                        user.roles.map((role) => (
                          <Badge key={role} className={roleConfig[role].color}>
                            {roleConfig[role].label}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => viewUserDetails(user)}>
                      <Eye className="h-4 w-4" />
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
      </div>

      {/* User Detail Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Thông tin & Phân quyền</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="info">Thông tin</TabsTrigger>
                <TabsTrigger value="roles">Phân quyền</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-6 pt-4">
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
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Lịch sử đơn hàng ({userOrders.length})
                  </h4>
                  {userOrders.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Chưa có đơn hàng nào</p>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
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
              </TabsContent>

              <TabsContent value="roles" className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Chọn các vai trò để phân quyền cho người dùng này:
                </p>
                
                <div className="space-y-3">
                  {(Object.keys(roleConfig) as AppRole[]).map((role) => {
                    const hasRole = selectedUser.roles.includes(role);
                    const isCurrentUserAdmin = role === 'admin' && selectedUser.id === currentUserId;
                    
                    return (
                      <div 
                        key={role} 
                        className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                          hasRole ? 'bg-accent/10 border-accent' : 'bg-muted/30'
                        }`}
                      >
                        <Checkbox
                          id={`role-${role}`}
                          checked={hasRole}
                          disabled={isCurrentUserAdmin}
                          onCheckedChange={() => toggleRole(selectedUser, role)}
                        />
                        <div className="flex-1">
                          <label 
                            htmlFor={`role-${role}`} 
                            className="font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <Badge className={roleConfig[role].color}>
                              {roleConfig[role].icon}
                              <span className="ml-1">{roleConfig[role].label}</span>
                            </Badge>
                          </label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {roleConfig[role].description}
                          </p>
                          {isCurrentUserAdmin && (
                            <p className="text-xs text-destructive mt-1">
                              Bạn không thể xóa quyền admin của chính mình
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
