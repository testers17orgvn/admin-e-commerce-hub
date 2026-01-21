import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Clock, CheckCircle, XCircle, AlertCircle, Eye, User, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface SellerProduct {
  id: string;
  seller_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category_id: string | null;
  image_url: string | null;
  images: string[];
  colors: string[];
  sizes: string[];
  tags: string[];
  stock: number;
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  rejection_reason: string | null;
  created_at: string;
}

interface SellerProfile {
  full_name: string | null;
  email: string | null;
}

const STATUS_CONFIG = {
  pending: { label: 'Chờ duyệt', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Đã duyệt', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Từ chối', icon: XCircle, color: 'bg-red-100 text-red-800' },
  revision_requested: { label: 'Cần chỉnh sửa', icon: AlertCircle, color: 'bg-orange-100 text-orange-800' },
};

export default function SellerProductReview() {
  const { user } = useAuth();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedProduct, setSelectedProduct] = useState<SellerProduct | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('seller_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setProducts((data as SellerProduct[]) || []);
    }
    setLoading(false);
  };

  const openProductDetail = async (product: SellerProduct) => {
    setSelectedProduct(product);
    setRejectReason(product.rejection_reason || '');
    
    // Fetch seller profile
    const { data } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', product.seller_id)
      .single();
    
    setSellerProfile(data);
  };

  const updateProductStatus = async (status: SellerProduct['status'], reason?: string) => {
    if (!selectedProduct || !user) return;
    
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
      .from('seller_products')
      .update(updateData)
      .eq('id', selectedProduct.id);

    setProcessing(false);

    if (error) {
      toast.error('Lỗi cập nhật: ' + error.message);
      return;
    }

    // If approved, create actual product
    if (status === 'approved') {
      const { error: insertError } = await supabase.from('products').insert({
        name: selectedProduct.name,
        slug: selectedProduct.slug + '-' + Date.now(),
        description: selectedProduct.description,
        price: selectedProduct.price,
        original_price: selectedProduct.original_price,
        category_id: selectedProduct.category_id,
        image_url: selectedProduct.image_url,
        images: selectedProduct.images,
        colors: selectedProduct.colors,
        sizes: selectedProduct.sizes,
        tags: selectedProduct.tags,
        stock: selectedProduct.stock,
        is_active: true,
        is_featured: false,
      });

      if (insertError) {
        toast.error('Lỗi tạo sản phẩm: ' + insertError.message);
        return;
      }
    }

    toast.success(
      status === 'approved' ? 'Đã duyệt và đăng sản phẩm' :
      status === 'rejected' ? 'Đã từ chối sản phẩm' :
      'Đã yêu cầu chỉnh sửa'
    );
    
    setSelectedProduct(null);
    fetchProducts();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getFilteredProducts = () => {
    if (activeTab === 'all') return products;
    return products.filter(p => p.status === activeTab);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display">Duyệt sản phẩm Seller</h1>
          <p className="text-muted-foreground mt-1">Xem xét và duyệt sản phẩm từ người bán</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const count = products.filter(p => p.status === status).length;
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
                    <div className={cn("p-2 rounded-lg", config.color.split(' ')[0])}>
                      <Icon className={cn("h-5 w-5", config.color.split(' ')[1])} />
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
            <TabsTrigger value="all">Tất cả ({products.length})</TabsTrigger>
            <TabsTrigger value="pending">Chờ duyệt ({products.filter(p => p.status === 'pending').length})</TabsTrigger>
            <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
            <TabsTrigger value="rejected">Từ chối</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-square bg-muted" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredProducts().map((product) => {
              const statusConfig = STATUS_CONFIG[product.status];
              const StatusIcon = statusConfig.icon;
              return (
                <Card 
                  key={product.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => openProductDetail(product)}
                >
                  <div className="relative aspect-square">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Package className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{product.name}</h3>
                    <p className="text-lg font-bold text-accent mt-1">{formatPrice(product.price)}</p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(product.created_at), 'dd/MM/yyyy', { locale: vi })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {getFilteredProducts().length === 0 && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Không có sản phẩm nào</h3>
              <p className="text-muted-foreground mt-1">Chưa có sản phẩm nào trong danh mục này</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Chi tiết sản phẩm</DialogTitle>
              </DialogHeader>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Images */}
                <div className="space-y-4">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    {selectedProduct.image_url ? (
                      <img src={selectedProduct.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-20 w-20 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  {selectedProduct.images?.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedProduct.images.map((img, i) => (
                        <img key={i} src={img} alt="" className="aspect-square rounded object-cover" />
                      ))}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-4">
                  <div>
                    <Badge className={STATUS_CONFIG[selectedProduct.status].color}>
                      {STATUS_CONFIG[selectedProduct.status].label}
                    </Badge>
                    <h2 className="text-2xl font-bold mt-2">{selectedProduct.name}</h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-accent">{formatPrice(selectedProduct.price)}</span>
                    {selectedProduct.original_price && (
                      <span className="text-lg text-muted-foreground line-through">
                        {formatPrice(selectedProduct.original_price)}
                      </span>
                    )}
                  </div>

                  {sellerProfile && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-accent/10 rounded-full">
                            <User className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <p className="font-medium">{sellerProfile.full_name || 'Người bán'}</p>
                            <p className="text-sm text-muted-foreground">{sellerProfile.email}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedProduct.description && (
                    <div>
                      <Label className="text-muted-foreground">Mô tả</Label>
                      <p className="mt-1">{selectedProduct.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Tồn kho</Label>
                      <p className="font-medium">{selectedProduct.stock}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Ngày đăng</Label>
                      <p className="font-medium">
                        {format(new Date(selectedProduct.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </p>
                    </div>
                  </div>

                  {selectedProduct.colors?.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Màu sắc</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedProduct.colors.map((c, i) => (
                          <Badge key={i} variant="outline">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProduct.sizes?.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Kích thước</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedProduct.sizes.map((s, i) => (
                          <Badge key={i} variant="outline">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review Actions */}
                  {selectedProduct.status === 'pending' && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label>Lý do từ chối / Yêu cầu chỉnh sửa</Label>
                        <Textarea 
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Nhập lý do nếu từ chối hoặc yêu cầu chỉnh sửa..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="hero" 
                          className="flex-1" 
                          onClick={() => updateProductStatus('approved')}
                          disabled={processing}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Duyệt & Đăng bán
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => updateProductStatus('revision_requested', rejectReason)}
                          disabled={processing || !rejectReason}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Yêu cầu sửa
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => updateProductStatus('rejected', rejectReason)}
                          disabled={processing || !rejectReason}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
