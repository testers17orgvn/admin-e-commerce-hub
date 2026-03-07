import { useState, useEffect } from 'react';
import { Star, Send, CheckCircle, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface ShipperRatingProps {
  orderId: string;
  shipperId: string;
}

const ratingLabels = ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Tuyệt vời'];

export function ShipperRating({ orderId, shipperId }: ShipperRatingProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<{
    rating: number;
    comment: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) checkExistingReview();
  }, [user, orderId]);

  const checkExistingReview = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('shipper_reviews' as any)
      .select('rating, comment')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setExistingReview(data as any);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || rating === 0) return;

    setSubmitting(true);
    haptic('medium');

    const { error } = await supabase.from('shipper_reviews' as any).insert({
      order_id: orderId,
      shipper_id: shipperId,
      user_id: user.id,
      rating,
      comment: comment.trim() || null,
    } as any);

    if (error) {
      toast.error('Không thể gửi đánh giá');
      setSubmitting(false);
      return;
    }

    haptic('success');
    toast.success('Cảm ơn bạn đã đánh giá!');
    setExistingReview({ rating, comment: comment.trim() || null });
    setSubmitting(false);
  };

  if (loading) return null;

  // Already reviewed
  if (existingReview) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Đã đánh giá shipper</p>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      'h-4 w-4',
                      s <= existingReview.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    )}
                  />
                ))}
                <span className="text-sm text-muted-foreground ml-2">
                  {ratingLabels[existingReview.rating]}
                </span>
              </div>
              {existingReview.comment && (
                <p className="text-sm text-muted-foreground mt-1">
                  "{existingReview.comment}"
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Rating form
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          Đánh giá shipper
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stars */}
        <div className="text-center space-y-2">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                className="transition-transform hover:scale-110 active:scale-95"
                onMouseEnter={() => setHoveredRating(s)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => {
                  setRating(s);
                  haptic('selection');
                }}
              >
                <Star
                  className={cn(
                    'h-8 w-8 transition-colors',
                    s <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground/30'
                  )}
                />
              </button>
            ))}
          </div>
          {(hoveredRating || rating) > 0 && (
            <p className="text-sm font-medium text-primary animate-fade-in">
              {ratingLabels[hoveredRating || rating]}
            </p>
          )}
        </div>

        {/* Comment */}
        <Textarea
          placeholder="Nhận xét về shipper (tùy chọn)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          maxLength={500}
          className="resize-none"
        />

        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="w-full gap-2"
        >
          <Send className="h-4 w-4" />
          {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
        </Button>
      </CardContent>
    </Card>
  );
}
