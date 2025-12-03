import { Link } from 'react-router-dom';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { ShoppingBag, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  return (
    <div className={cn('group card-hover', className)}>
      {/* Image */}
      <Link to={`/products/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.is_featured && (
            <span className="px-2 py-1 bg-accent text-accent-foreground text-xs font-medium rounded">
              Nổi bật
            </span>
          )}
          {discount > 0 && (
            <span className="px-2 py-1 bg-destructive text-destructive-foreground text-xs font-medium rounded">
              -{discount}%
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full shadow-md">
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        {/* Add to cart overlay */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
          <Button
            variant="elegant"
            className="w-full shadow-lg"
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
      <div className="mt-4 space-y-1">
        <Link to={`/products/${product.slug}`}>
          <h3 className="font-medium text-foreground line-clamp-1 hover:text-accent transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">
            {formatPrice(product.price)}
          </span>
          {product.original_price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.original_price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
