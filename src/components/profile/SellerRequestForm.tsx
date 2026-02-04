import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Store, FileText, Clock, CheckCircle, XCircle, AlertCircle,
  Upload, Building, Phone, MapPin, Package, Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface SellerRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  business_type: string;
  business_model: string;
  business_description: string | null;
  product_categories: string[];
  business_license_url: string | null;
  tax_code: string | null;
  phone: string;
  address: string;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface Category {
  id: string;
  name: string;
}

const BUSINESS_TYPES = [
  { value: 'individual', label: 'Cá nhân / Hộ kinh doanh' },
  { value: 'company', label: 'Công ty TNHH' },
  { value: 'jsc', label: 'Công ty Cổ phần' },
  { value: 'partnership', label: 'Công ty Hợp danh' },
  { value: 'other', label: 'Khác' },
];

const BUSINESS_MODELS = [
  { value: 'retail', label: 'Bán lẻ' },
  { value: 'wholesale', label: 'Bán buôn / Sỉ' },
  { value: 'manufacturer', label: 'Nhà sản xuất' },
  { value: 'distributor', label: 'Nhà phân phối' },
  { value: 'dropship', label: 'Dropshipping' },
  { value: 'handmade', label: 'Handmade / Thủ công' },
];

const STATUS_CONFIG = {
  pending: { label: 'Đang chờ duyệt', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  approved: { label: 'Đã duyệt', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  rejected: { label: 'Từ chối', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  revision_requested: { label: 'Yêu cầu bổ sung', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100' },
};

export function SellerRequestForm() {
  const { user } = useAuth();
  const [existingRequest, setExistingRequest] = useState<SellerRequest | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [form, setForm] = useState({
    business_type: '',
    business_model: '',
    business_description: '',
    product_categories: [] as string[],
    business_license_url: '',
    tax_code: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Check if already seller
    const { data: sellerCheck } = await supabase.rpc('is_seller');
    setIsSeller(sellerCheck === true);

    // Fetch existing request
    const { data: request } = await supabase
      .from('seller_requests')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (request) {
      setExistingRequest(request as SellerRequest);
      setForm({
        business_type: request.business_type,
        business_model: request.business_model,
        business_description: request.business_description || '',
        product_categories: request.product_categories || [],
        business_license_url: request.business_license_url || '',
        tax_code: request.tax_code || '',
        phone: request.phone,
        address: request.address,
      });
    }

    // Fetch categories
    const { data: cats } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');
    
    setCategories(cats || []);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước file tối đa 10MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `licenses/${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setForm(prev => ({ ...prev, business_license_url: publicUrl }));
      toast.success('Tải lên giấy phép thành công');
    } catch (error: any) {
      toast.error('Lỗi tải lên: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setForm(prev => ({
      ...prev,
      product_categories: prev.product_categories.includes(categoryId)
        ? prev.product_categories.filter(id => id !== categoryId)
        : [...prev.product_categories, categoryId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!form.business_type || !form.business_model || !form.phone || !form.address) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (form.product_categories.length === 0) {
      toast.error('Vui lòng chọn ít nhất một danh mục sản phẩm');
      return;
    }

    setSubmitting(true);

    const requestData = {
      user_id: user.id,
      business_type: form.business_type,
      business_model: form.business_model,
      business_description: form.business_description || null,
      product_categories: form.product_categories,
      business_license_url: form.business_license_url || null,
      tax_code: form.tax_code || null,
      phone: form.phone,
      address: form.address,
      status: 'pending' as const,
    };

    let error;
    if (existingRequest) {
      const { error: updateError } = await supabase
        .from('seller_requests')
        .update(requestData)
        .eq('id', existingRequest.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('seller_requests')
        .insert(requestData);
      error = insertError;
    }

    setSubmitting(false);

    if (error) {
      toast.error('Lỗi: ' + error.message);
      return;
    }

    toast.success(existingRequest ? 'Đã cập nhật yêu cầu' : 'Đã gửi yêu cầu trở thành người bán');
    fetchData();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (isSeller) {
    return (
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-green-700">Bạn đã là Người bán!</h3>
          <p className="text-muted-foreground mt-2 mb-6">
            Bạn có thể truy cập trang quản lý bán hàng để bắt đầu đăng sản phẩm.
          </p>
          <Button variant="hero" asChild>
            <a href="/seller/dashboard">
              <Store className="h-4 w-4 mr-2" />
              Truy cập Dashboard Seller
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-accent/5 to-transparent">
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5 text-accent" />
          Đăng ký trở thành Người bán
        </CardTitle>
        <CardDescription>
          Điền đầy đủ thông tin dưới đây để đăng ký trở thành người bán hàng trên hệ thống
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        {/* Existing Request Status */}
        {existingRequest && (
          <div className={cn(
            "p-4 rounded-xl mb-6",
            STATUS_CONFIG[existingRequest.status].bg
          )}>
            <div className="flex items-center gap-3">
              {(() => {
                const StatusIcon = STATUS_CONFIG[existingRequest.status].icon;
                return <StatusIcon className={cn("h-5 w-5", STATUS_CONFIG[existingRequest.status].color)} />;
              })()}
              <div>
                <p className={cn("font-semibold", STATUS_CONFIG[existingRequest.status].color)}>
                  {STATUS_CONFIG[existingRequest.status].label}
                </p>
                <p className="text-sm text-muted-foreground">
                  Gửi lúc: {format(new Date(existingRequest.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </p>
              </div>
            </div>
            {existingRequest.rejection_reason && (
              <div className="mt-3 p-3 bg-white/50 rounded-lg">
                <p className="text-sm font-medium">Lý do:</p>
                <p className="text-sm">{existingRequest.rejection_reason}</p>
              </div>
            )}
          </div>
        )}

        {/* Only show form if pending, revision_requested, or no request */}
        {(!existingRequest || existingRequest.status === 'pending' || existingRequest.status === 'revision_requested') && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Info */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-lg">
                <Building className="h-5 w-5 text-accent" />
                Thông tin doanh nghiệp
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loại hình kinh doanh *</Label>
                  <Select value={form.business_type} onValueChange={(v) => setForm({ ...form, business_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại hình" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mô hình kinh doanh *</Label>
                  <Select value={form.business_model} onValueChange={(v) => setForm({ ...form, business_model: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn mô hình" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_MODELS.map(model => (
                        <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mô tả hoạt động kinh doanh</Label>
                <Textarea
                  value={form.business_description}
                  onChange={(e) => setForm({ ...form, business_description: e.target.value })}
                  placeholder="Mô tả về sản phẩm/dịch vụ bạn kinh doanh, kinh nghiệm bán hàng..."
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mã số thuế (nếu có)</Label>
                  <Input
                    value={form.tax_code}
                    onChange={(e) => setForm({ ...form, tax_code: e.target.value })}
                    placeholder="VD: 0123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Giấy phép kinh doanh</Label>
                  <div className="flex gap-2">
                    <Input
                      value={form.business_license_url}
                      onChange={(e) => setForm({ ...form, business_license_url: e.target.value })}
                      placeholder="URL hoặc tải lên"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" disabled={uploading} asChild>
                      <label className="cursor-pointer">
                        <Upload className="h-4 w-4" />
                        <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tải lên ảnh hoặc PDF giấy phép (nếu có). Một số ngành hàng yêu cầu giấy phép.
                  </p>
                </div>
              </div>
            </div>

            {/* Product Categories */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-accent" />
                Danh mục sản phẩm kinh doanh *
              </h3>
              <p className="text-sm text-muted-foreground">Chọn các danh mục sản phẩm bạn dự định bán</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map(category => (
                  <label
                    key={category.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      form.product_categories.includes(category.id)
                        ? "border-accent bg-accent/10"
                        : "border-muted hover:border-accent/50"
                    )}
                  >
                    <Checkbox
                      checked={form.product_categories.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                    />
                    <span className="text-sm">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-lg">
                <Phone className="h-5 w-5 text-accent" />
                Thông tin liên hệ
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Số điện thoại *</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="VD: 0912345678"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Địa chỉ *</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Địa chỉ kho hàng / cửa hàng"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t">
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Đang xử lý...
                  </>
                ) : existingRequest ? (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Cập nhật yêu cầu
                  </>
                ) : (
                  <>
                    <Store className="h-4 w-4 mr-2" />
                    Gửi yêu cầu đăng ký
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Yêu cầu sẽ được xem xét trong 1-3 ngày làm việc. Chúng tôi sẽ thông báo kết quả qua email.
              </p>
            </div>
          </form>
        )}

        {existingRequest?.status === 'rejected' && (
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Yêu cầu của bạn đã bị từ chối. Bạn có thể gửi yêu cầu mới sau khi khắc phục các vấn đề.
            </p>
            <Button variant="outline" onClick={() => setExistingRequest(null)}>
              Gửi yêu cầu mới
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
