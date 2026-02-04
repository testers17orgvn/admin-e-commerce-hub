import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Store, Clock, CheckCircle, XCircle, AlertCircle, 
  User, Calendar, Phone, MapPin, Building, Package,
  FileText, ExternalLink, Shield, Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface SellerRequest {
  id: string;
  user_id: string;
  business_type: string;
  business_model: string;
  business_description: string | null;
  product_categories: string[];
  business_license_url: string | null;
  tax_code: string | null;
  phone: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface UserProfile {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface Category {
  id: string;
  name: string;
}

const STATUS_CONFIG = {
  pending: { label: 'Chờ duyệt', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  approved: { label: 'Đã duyệt', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  rejected: { label: 'Từ chối', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  revision_requested: { label: 'Yêu cầu bổ sung', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100' },
};

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  individual: 'Cá nhân / Hộ kinh doanh',
  company: 'Công ty TNHH',
  jsc: 'Công ty Cổ phần',
  partnership: 'Công ty Hợp danh',
  other: 'Khác',
};

const BUSINESS_MODEL_LABELS: Record<string, string> = {
  retail: 'Bán lẻ',
  wholesale: 'Bán buôn / Sỉ',
  manufacturer: 'Nhà sản xuất',
  distributor: 'Nhà phân phối',
  dropship: 'Dropshipping',
  handmade: 'Handmade / Thủ công',
};

// Categories that typically require licenses
const LICENSE_REQUIRED_CATEGORIES = [
  'Thực phẩm', 'Dược phẩm', 'Mỹ phẩm', 'Thực phẩm chức năng',
  'Thiết bị y tế', 'Hóa chất', 'Thuốc lá', 'Rượu bia'
];

export default function SellerRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<SellerRequest | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [requestsRes, categoriesRes] = await Promise.all([
      supabase
        .from('seller_requests')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('id, name')
    ]);

    setRequests((requestsRes.data as SellerRequest[]) || []);
    setCategories(categoriesRes.data || []);
    setLoading(false);
  };

  const openRequestDetail = async (request: SellerRequest) => {
    setSelectedRequest(request);
    setRejectReason(request.rejection_reason || '');

    // Fetch user profile
    const { data } = await supabase
      .from('profiles')
      .select('full_name, email, avatar_url')
      .eq('id', request.user_id)
      .single();
    
    setUserProfile(data);
  };

  const getCategoryNames = (categoryIds: string[]) => {
    return categoryIds.map(id => {
      const cat = categories.find(c => c.id === id);
      return cat?.name || id;
    });
  };

  const checkLicenseRequired = (categoryIds: string[]) => {
    const categoryNames = getCategoryNames(categoryIds);
    return categoryNames.some(name => 
      LICENSE_REQUIRED_CATEGORIES.some(required => 
        name.toLowerCase().includes(required.toLowerCase())
      )
    );
  };

  const updateRequestStatus = async (status: SellerRequest['status'], reason?: string) => {
    if (!selectedRequest || !user) return;
    
    setProcessing(true);
    
    const updateData: Record<string, unknown> = {
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };

    if (reason) {
      updateData.rejection_reason = reason;
    }

    const { error } = await supabase
      .from('seller_requests')
      .update(updateData)
      .eq('id', selectedRequest.id);

    if (error) {
      toast.error('Lỗi cập nhật: ' + error.message);
      setProcessing(false);
      return;
    }

    // If approved, add seller role
    if (status === 'approved') {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedRequest.user_id,
          role: 'seller'
        });

      if (roleError && !roleError.message.includes('duplicate')) {
        toast.error('Lỗi cấp quyền seller: ' + roleError.message);
        setProcessing(false);
        return;
      }

      // Update profile with business info
      await supabase
        .from('profiles')
        .update({
          business_type: selectedRequest.business_type,
          business_model: selectedRequest.business_model,
          business_description: selectedRequest.business_description,
          business_license_url: selectedRequest.business_license_url,
          tax_code: selectedRequest.tax_code,
          is_verified_seller: true,
        })
        .eq('id', selectedRequest.user_id);

      // Send notification to user
      await supabase.from('notifications').insert({
        user_id: selectedRequest.user_id,
        title: '🎉 Chúc mừng! Bạn đã trở thành Người bán',
        message: 'Yêu cầu đăng ký bán hàng của bạn đã được duyệt. Bạn có thể bắt đầu đăng sản phẩm ngay!',
        type: 'success',
        link: '/seller/dashboard'
      });
    } else if (status === 'rejected' || status === 'revision_requested') {
      // Notify user about rejection/revision
      await supabase.from('notifications').insert({
        user_id: selectedRequest.user_id,
        title: status === 'rejected' ? 'Yêu cầu bán hàng bị từ chối' : 'Yêu cầu cần bổ sung thông tin',
        message: reason || 'Vui lòng kiểm tra lại yêu cầu của bạn.',
        type: status === 'rejected' ? 'error' : 'warning',
        link: '/profile'
      });
    }

    setProcessing(false);
    toast.success(
      status === 'approved' ? 'Đã duyệt và cấp quyền Seller' :
      status === 'rejected' ? 'Đã từ chối yêu cầu' :
      'Đã yêu cầu bổ sung thông tin'
    );
    
    setSelectedRequest(null);
    fetchData();
  };

  const getFilteredRequests = () => {
    if (activeTab === 'all') return requests;
    return requests.filter(r => r.status === activeTab);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-3">
            <Store className="h-8 w-8 text-accent" />
            Duyệt yêu cầu Người bán
          </h1>
          <p className="text-muted-foreground mt-1">Xem xét và duyệt yêu cầu đăng ký trở thành người bán</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const count = requests.filter(r => r.status === status).length;
            const Icon = config.icon;
            return (
              <Card 
                key={status} 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  activeTab === status && "ring-2 ring-accent"
                )}
                onClick={() => setActiveTab(status)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", config.bg)}>
                      <Icon className={cn("h-5 w-5", config.color)} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-sm text-muted-foreground">{config.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Tất cả ({requests.length})</TabsTrigger>
            <TabsTrigger value="pending">Chờ duyệt ({requests.filter(r => r.status === 'pending').length})</TabsTrigger>
            <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
            <TabsTrigger value="rejected">Từ chối</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Request List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {getFilteredRequests().map((request) => {
              const statusConfig = STATUS_CONFIG[request.status];
              const StatusIcon = statusConfig.icon;
              const needsLicense = checkLicenseRequired(request.product_categories);
              
              return (
                <Card 
                  key={request.id} 
                  className="cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => openRequestDetail(request)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={cn(statusConfig.bg, statusConfig.color)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                          {needsLicense && !request.business_license_url && (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Cần giấy phép
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg">
                          {BUSINESS_TYPE_LABELS[request.business_type] || request.business_type}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          Mô hình: {BUSINESS_MODEL_LABELS[request.business_model] || request.business_model}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {getCategoryNames(request.product_categories).slice(0, 3).map((cat, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{cat}</Badge>
                          ))}
                          {request.product_categories.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{request.product_categories.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 justify-end">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(request.created_at), 'dd/MM/yyyy', { locale: vi })}
                        </div>
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <Phone className="h-3 w-3" />
                          {request.phone}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {getFilteredRequests().length === 0 && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Không có yêu cầu nào</h3>
              <p className="text-muted-foreground mt-1">Chưa có yêu cầu đăng ký trong danh mục này</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Store className="h-5 w-5 text-accent" />
              Chi tiết yêu cầu đăng ký Seller
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Status Banner */}
                <div className={cn(
                  "p-4 rounded-xl flex items-center gap-3",
                  STATUS_CONFIG[selectedRequest.status].bg
                )}>
                  {(() => {
                    const StatusIcon = STATUS_CONFIG[selectedRequest.status].icon;
                    return <StatusIcon className={cn("h-6 w-6", STATUS_CONFIG[selectedRequest.status].color)} />;
                  })()}
                  <div>
                    <p className={cn("font-semibold", STATUS_CONFIG[selectedRequest.status].color)}>
                      {STATUS_CONFIG[selectedRequest.status].label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Gửi lúc: {format(new Date(selectedRequest.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </p>
                  </div>
                </div>

                {/* User Info */}
                {userProfile && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4 text-accent" />
                        Thông tin người dùng
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden">
                          {userProfile.avatar_url ? (
                            <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="h-8 w-8 text-accent" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{userProfile.full_name || 'Chưa cập nhật tên'}</p>
                          <p className="text-muted-foreground">{userProfile.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Business Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building className="h-4 w-4 text-accent" />
                      Thông tin doanh nghiệp
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">Loại hình</Label>
                        <p className="font-medium">
                          {BUSINESS_TYPE_LABELS[selectedRequest.business_type] || selectedRequest.business_type}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Mô hình</Label>
                        <p className="font-medium">
                          {BUSINESS_MODEL_LABELS[selectedRequest.business_model] || selectedRequest.business_model}
                        </p>
                      </div>
                    </div>

                    {selectedRequest.business_description && (
                      <div>
                        <Label className="text-muted-foreground text-sm">Mô tả hoạt động</Label>
                        <p className="mt-1">{selectedRequest.business_description}</p>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">Mã số thuế</Label>
                        <p className="font-medium">{selectedRequest.tax_code || 'Không có'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Giấy phép kinh doanh</Label>
                        {selectedRequest.business_license_url ? (
                          <a 
                            href={selectedRequest.business_license_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-accent hover:underline"
                          >
                            <FileText className="h-4 w-4" />
                            Xem giấy phép
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <p className="text-muted-foreground">Chưa cung cấp</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Product Categories */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4 text-accent" />
                      Danh mục sản phẩm kinh doanh
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {getCategoryNames(selectedRequest.product_categories).map((cat, i) => (
                        <Badge key={i} variant="secondary">{cat}</Badge>
                      ))}
                    </div>
                    
                    {/* License Warning */}
                    {checkLicenseRequired(selectedRequest.product_categories) && (
                      <div className={cn(
                        "mt-4 p-4 rounded-lg flex items-start gap-3",
                        selectedRequest.business_license_url 
                          ? "bg-green-50 dark:bg-green-900/20" 
                          : "bg-orange-50 dark:bg-orange-900/20"
                      )}>
                        {selectedRequest.business_license_url ? (
                          <>
                            <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-green-700 dark:text-green-400">
                                Đã cung cấp giấy phép kinh doanh
                              </p>
                              <p className="text-sm text-green-600/80 dark:text-green-500">
                                Ngành hàng này yêu cầu giấy phép và người bán đã cung cấp.
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-orange-700 dark:text-orange-400">
                                ⚠️ Ngành hàng yêu cầu giấy phép
                              </p>
                              <p className="text-sm text-orange-600/80 dark:text-orange-500">
                                Một số danh mục sản phẩm này có thể yêu cầu giấy phép kinh doanh 
                                (thực phẩm, mỹ phẩm, dược phẩm...). Người bán chưa cung cấp giấy phép.
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contact Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Phone className="h-4 w-4 text-accent" />
                      Thông tin liên hệ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedRequest.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedRequest.address}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Review Actions */}
                {selectedRequest.status === 'pending' && (
                  <Card className="border-accent/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-accent" />
                        Xử lý yêu cầu
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Lý do từ chối / Yêu cầu bổ sung (nếu có)</Label>
                        <Textarea 
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Nhập lý do nếu từ chối hoặc yêu cầu bổ sung thông tin..."
                          rows={3}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="hero" 
                          onClick={() => updateRequestStatus('approved')}
                          disabled={processing}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Duyệt & Cấp quyền Seller
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => updateRequestStatus('revision_requested', rejectReason)}
                          disabled={processing || !rejectReason}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Yêu cầu bổ sung
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => updateRequestStatus('rejected', rejectReason)}
                          disabled={processing || !rejectReason}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Từ chối
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Previous rejection reason */}
                {selectedRequest.rejection_reason && selectedRequest.status !== 'pending' && (
                  <Card className="border-orange-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-orange-700 dark:text-orange-400">Lý do xử lý:</p>
                          <p className="text-sm mt-1">{selectedRequest.rejection_reason}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
