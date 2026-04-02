import { Link } from 'react-router-dom';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { ShoppingBag, Heart, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProductCardProps {
  product: Product;
  className?: string;
  showFlashSale?: boolean;
}

export function ProductCard({ product, className, showFlashSale }: ProductCardProps) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [avgRating, setAvgRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);

  const inWishlist = isInWishlist(product.id);

  useEffect(() => {
    supabase
      .from('product_reviews')
      .select('rating')
      .eq('product_id', product.id)
      .eq('is_approved', true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setReviewCount(data.length);
          setAvgRating(data.reduce((s, r) => s + r.rating, 0) / data.length);
        }
      });
  }, [product.id]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div className={cn(
      'group relative rounded-xl overflow-hidden bg-card border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1',
      className
    )}>
      {/* Image */}
      <Link to={`/products/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}

        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Badges - top left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {showFlashSale && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-md shadow-md animate-pulse">
              <Zap className="h-3 w-3" /> FLASH SALE
            </span>
          )}
          {discount > 0 && (
            <span className="px-2 py-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-md shadow-md">
              -{discount}%
            </span>
          )}
          {product.is_featured && !showFlashSale && (
            <span className="px-2 py-1 bg-accent text-accent-foreground text-[10px] font-medium rounded-md shadow-sm">
              Nổi bật
            </span>
          )}
        </div>

        {/* Wishlist - top right */}
        <div className="absolute top-2 right-2">
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full shadow-md backdrop-blur-sm bg-background/70 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110",
              inWishlist && "opacity-100 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
            onClick={handleWishlistClick}
          >
            <Heart className={cn("h-3.5 w-3.5", inWishlist && "fill-current")} />
          </Button>
        </div>

        {/* Add to cart - bottom overlay */}
        <div className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-3 group-hover:translate-y-0">
          <Button
            variant="elegant"
            className="w-full shadow-lg text-sm h-9"
            onClick={(e) => {
              e.preventDefault();
              addItem(product);
            }}
          >
            <ShoppingBag className="h-4 w-4" />
            Thêm vào giỏ
          </Button>
        </div>
      </Link>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <Link to={`/products/${product.slug}`}>
          <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-tight hover:text-accent transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-3 w-3",
                  star <= Math.round(avgRating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-muted-foreground/30"
                )}
              />
            ))}
            <span className="text-[10px] text-muted-foreground ml-0.5">({reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            "font-bold text-sm",
            showFlashSale ? "text-destructive" : "text-foreground"
          )}>
            {formatPrice(product.price)}
          </span>
          {product.original_price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.original_price)}
            </span>
          )}
        </div>

        {/* Sold count placeholder for flash sale */}
        {showFlashSale && discount > 0 && (
          <div className="w-full bg-destructive/10 rounded-full h-1.5 mt-1">
            <div
              className="bg-destructive h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(75, 40 + Math.random() * 35)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
