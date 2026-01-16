import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Check, X, Trash2, Star, Search, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  is_approved: boolean | null;
  is_verified_purchase: boolean | null;
  helpful_count: number | null;
  created_at: string;
  products: {
    name: string;
    slug: string;
    image_url: string | null;
  } | null;
}

export default function Reviews() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          products:product_id (name, slug, image_url)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Review[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, is_approved }: { id: string; is_approved: boolean }) => {
      const { error } = await supabase
        .from('product_reviews')
        .update({ is_approved })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { is_approved }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({
        title: is_approved ? 'Đã duyệt đánh giá' : 'Đã ẩn đánh giá',
        description: is_approved ? 'Đánh giá đã được hiển thị công khai' : 'Đánh giá đã bị ẩn khỏi trang sản phẩm',
      });
    },
    onError: () => {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật đánh giá',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({
        title: 'Đã xóa đánh giá',
        description: 'Đánh giá đã được xóa vĩnh viễn',
      });
    },
    onError: () => {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa đánh giá',
        variant: 'destructive',
      });
    },
  });

  const filteredReviews = reviews?.filter((review) => {
    const matchesSearch =
      review.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'approved' && review.is_approved) ||
      (filterStatus === 'pending' && !review.is_approved);

    const matchesRating =
      filterRating === 'all' || review.rating === parseInt(filterRating);

    return matchesSearch && matchesStatus && matchesRating;
  });

  const stats = {
    total: reviews?.length || 0,
    approved: reviews?.filter((r) => r.is_approved).length || 0,
    pending: reviews?.filter((r) => !r.is_approved).length || 0,
    averageRating: reviews?.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0',
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý đánh giá</h1>
          <p className="text-muted-foreground">Duyệt, ẩn và xóa các đánh giá sản phẩm</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng đánh giá
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Đã duyệt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Chờ duyệt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Điểm TB
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                {stats.averageRating}
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo sản phẩm, khách hàng, nội dung..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="approved">Đã duyệt</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Đánh giá" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả sao</SelectItem>
                  <SelectItem value="5">5 sao</SelectItem>
                  <SelectItem value="4">4 sao</SelectItem>
                  <SelectItem value="3">3 sao</SelectItem>
                  <SelectItem value="2">2 sao</SelectItem>
                  <SelectItem value="1">1 sao</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Đang tải...</div>
            ) : filteredReviews?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Không tìm thấy đánh giá nào
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Đánh giá</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews?.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {review.products?.image_url && (
                            <img
                              src={review.products.image_url}
                              alt={review.products.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          )}
                          <span className="font-medium line-clamp-1 max-w-[150px]">
                            {review.products?.name || 'Sản phẩm đã xóa'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">
                          Khách hàng
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {renderStars(review.rating)}
                          {review.is_verified_purchase && (
                            <Badge variant="outline" className="text-xs">
                              Đã mua hàng
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          {review.title && (
                            <div className="font-medium text-sm line-clamp-1">
                              {review.title}
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {review.content || 'Không có nội dung'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {review.is_approved ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <Eye className="h-3 w-3 mr-1" />
                            Hiển thị
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Đang ẩn
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(review.created_at), 'dd/MM/yyyy', { locale: vi })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(review.created_at), 'HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {review.is_approved ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                approveMutation.mutate({ id: review.id, is_approved: false })
                              }
                              disabled={approveMutation.isPending}
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                approveMutation.mutate({ id: review.id, is_approved: true })
                              }
                              disabled={approveMutation.isPending}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa đánh giá?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Đánh giá này sẽ bị xóa vĩnh viễn và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(review.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
