import { useState, useEffect } from 'react';
import { Star, ThumbsUp, User, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  const fetchReviews = async () => {
    const { data: reviewsData } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (reviewsData) {
      // Fetch user profiles for reviews
      const userIds = [...new Set(reviewsData.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const reviewsWithUsers = reviewsData.map(review => {
        const profile = profiles?.find(p => p.id === review.user_id);
        return {
          ...review,
          user_name: profile?.full_name || 'Ẩn danh',
          user_avatar: profile?.avatar_url,
        };
      });

      setReviews(reviewsWithUsers);
      
      // Check if current user has already reviewed
      if (user) {
        const existing = reviewsWithUsers.find(r => r.user_id === user.id);
        setUserReview(existing || null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [productId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vui lòng đăng nhập để đánh giá');
      return;
    }

    setSubmitting(true);
    try {
      if (editingReview) {
        // Update existing review
        const { error } = await supabase
          .from('product_reviews')
          .update({
            rating: formData.rating,
            title: formData.title || null,
            content: formData.content || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingReview.id);

        if (error) throw error;
        toast.success('Đã cập nhật đánh giá');
      } else {
        // Create new review
        const { error } = await supabase
          .from('product_reviews')
          .insert({
            product_id: productId,
            user_id: user.id,
            rating: formData.rating,
            title: formData.title || null,
            content: formData.content || null,
          });

        if (error) {
          if (error.code === '23505') {
            toast.error('Bạn đã đánh giá sản phẩm này rồi');
          } else {
            throw error;
          }
          return;
        }
        toast.success('Cảm ơn bạn đã đánh giá!');
      }

      setIsDialogOpen(false);
      setEditingReview(null);
      setFormData({ rating: 5, title: '', content: '' });
      fetchReviews();
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setFormData({
      rating: review.rating,
      title: review.title || '',
      content: review.content || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (reviewId: string) => {
    const { error } = await supabase
      .from('product_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      toast.error('Lỗi khi xóa đánh giá');
      return;
    }

    toast.success('Đã xóa đánh giá');
    fetchReviews();
  };

  const handleHelpful = async (reviewId: string) => {
    const { error } = await supabase
      .from('product_reviews')
      .update({ helpful_count: reviews.find(r => r.id === reviewId)!.helpful_count + 1 })
      .eq('id', reviewId);

    if (!error) {
      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r
      ));
    }
  };

  // Calculate statistics
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;
  
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 
      : 0,
  }));

  const StarRating = ({ 
    rating, 
    onRate, 
    size = 'default',
    interactive = false 
  }: { 
    rating: number; 
    onRate?: (rating: number) => void;
    size?: 'sm' | 'default' | 'lg';
    interactive?: boolean;
  }) => {
    const sizeClasses = {
      sm: 'h-3 w-3',
      default: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onRate?.(star)}
            className={cn(
              'transition-colors',
              interactive && 'cursor-pointer hover:scale-110'
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                star <= rating 
                  ? 'fill-amber-400 text-amber-400' 
                  : 'fill-muted text-muted'
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-accent" />
            Đánh giá sản phẩm
          </h2>
          <p className="text-muted-foreground mt-1">
            {reviews.length} đánh giá từ khách hàng
          </p>
        </div>

        {user && !userReview && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Star className="h-4 w-4" />
                Viết đánh giá
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingReview ? 'Chỉnh sửa đánh giá' : 'Đánh giá sản phẩm'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Đánh giá của bạn</p>
                  <div className="flex items-center gap-2">
                    <StarRating 
                      rating={formData.rating} 
                      onRate={(r) => setFormData(prev => ({ ...prev, rating: r }))}
                      size="lg"
                      interactive
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.rating}/5 sao
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Tiêu đề (tùy chọn)</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Tóm tắt đánh giá của bạn"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Nội dung đánh giá</label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingReview(null);
                    }}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Đang gửi...' : editingReview ? 'Cập nhật' : 'Gửi đánh giá'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary */}
      {reviews.length > 0 && (
        <div className="grid md:grid-cols-2 gap-8 p-6 bg-card rounded-xl border">
          {/* Average Rating */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
              <div>
                <StarRating rating={Math.round(averageRating)} size="default" />
                <p className="text-sm text-muted-foreground mt-1">
                  Dựa trên {reviews.length} đánh giá
                </p>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-2 text-sm">
                <span className="w-12">{rating} sao</span>
                <Progress value={percentage} className="flex-1 h-2" />
                <span className="w-8 text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải đánh giá...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-xl">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-medium text-lg mb-2">Chưa có đánh giá nào</h3>
            <p className="text-muted-foreground">
              Hãy là người đầu tiên đánh giá sản phẩm này!
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div 
              key={review.id} 
              className="p-4 md:p-6 bg-card rounded-xl border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {review.user_avatar ? (
                    <img 
                      src={review.user_avatar} 
                      alt={review.user_name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-accent/20">
                      <User className="h-5 w-5 text-accent" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-medium">{review.user_name}</span>
                    {review.is_verified_purchase && (
                      <Badge variant="secondary" className="text-xs">
                        Đã mua hàng
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), 'dd/MM/yyyy', { locale: vi })}
                    </span>
                  </div>

                  <StarRating rating={review.rating} size="sm" />

                  {review.title && (
                    <h4 className="font-medium mt-2">{review.title}</h4>
                  )}
                  
                  {review.content && (
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      {review.content}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-4">
                    <button
                      onClick={() => handleHelpful(review.id)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Hữu ích ({review.helpful_count})
                    </button>

                    {user && review.user_id === user.id && (
                      <>
                        <button
                          onClick={() => handleEdit(review)}
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                          Sửa
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="flex items-center gap-1 text-sm text-destructive hover:text-destructive/80 transition-colors">
                              <Trash2 className="h-4 w-4" />
                              Xóa
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xóa đánh giá?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc muốn xóa đánh giá này? Thao tác không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(review.id)}>
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* User's existing review notice */}
      {userReview && (
        <div className="p-4 bg-accent/10 rounded-xl border border-accent/20">
          <p className="text-sm">
            <span className="font-medium">Bạn đã đánh giá sản phẩm này.</span>{' '}
            <button 
              onClick={() => handleEdit(userReview)}
              className="text-accent hover:underline"
            >
              Chỉnh sửa đánh giá
            </button>
          </p>
        </div>
      )}
    </div>
  );
}