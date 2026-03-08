import { useEffect, useState, useMemo } from 'react';
import { updatePageMeta, setJsonLd } from '@/lib/slugify';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { 
  ShoppingBag, Heart, Share2, Minus, Plus, ChevronRight, ChevronLeft, 
  ZoomIn, Flame, Check, Eye, Sparkles, TrendingUp, Zap, Package, 
  Shield, Truck, RotateCcw, Star, Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductReviews } from '@/components/products/ProductReviews';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const colorMap: Record<string, string> = {
  'Đỏ': 'bg-red-500',
  'Xanh dương': 'bg-blue-500',
  'Xanh lá': 'bg-green-500',
  'Vàng': 'bg-yellow-500',
  'Đen': 'bg-black',
  'Trắng': 'bg-white border border-gray-300',
  'Hồng': 'bg-pink-500',
  'Tím': 'bg-purple-500',
  'Cam': 'bg-orange-500',
  'Xám': 'bg-gray-500',
  'Nâu': 'bg-amber-700',
  'Navy': 'bg-blue-900',
};

interface VariantStock {
  color: string | null;
  size: string | null;
  stock: number;
}

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [hotProducts, setHotProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [variantStocks, setVariantStocks] = useState<VariantStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchProduct() {
      if (!slug) return;
      
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      
      const productData = data as Product;
      setProduct(productData);
      
      // Set default selections
      if (productData?.colors?.length > 0) {
        setSelectedColor(productData.colors[0]);
      }
      if (productData?.sizes?.length > 0) {
        setSelectedSize(productData.sizes[0]);
      }

      // Fetch variant stocks
      if (productData?.id) {
        const { data: stocks } = await supabase
          .from('product_variant_stock')
          .select('color, size, stock')
          .eq('product_id', productData.id);
        setVariantStocks((stocks as VariantStock[]) || []);
      }
      
      // Fetch related products (same category)
      if (productData?.category_id) {
        const { data: related } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', productData.category_id)
          .eq('is_active', true)
          .neq('id', productData.id)
          .limit(4);
        setRelatedProducts((related as Product[]) || []);
      }
      
      // Fetch hot/trending products
      const { data: hot } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('is_hot', true)
        .neq('slug', slug)
        .limit(4);
      setHotProducts((hot as Product[]) || []);
      
      // Save to recently viewed (localStorage)
      if (productData) {
        const viewedKey = 'recently_viewed';
        const viewed = JSON.parse(localStorage.getItem(viewedKey) || '[]');
        const filtered = viewed.filter((p: Product) => p.id !== productData.id);
        const updated = [productData, ...filtered].slice(0, 10);
        localStorage.setItem(viewedKey, JSON.stringify(updated));
      }

      // SEO meta tags
      if (productData) {
        updatePageMeta({
          title: `${productData.name} | VSM Shop`,
          description: productData.description?.slice(0, 155) || `Mua ${productData.name} giá tốt tại VSM Shop`,
          image: productData.image_url || undefined,
          url: `${window.location.origin}/products/${productData.slug}`,
          type: 'product',
        });
        setJsonLd({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: productData.name,
          description: productData.description,
          image: productData.image_url,
          url: `${window.location.origin}/products/${productData.slug}`,
          offers: {
            '@type': 'Offer',
            price: productData.price,
            priceCurrency: 'VND',
            availability: productData.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
        });
      }
      
      setLoading(false);
    }
    fetchProduct();
  }, [slug]);

  // Load recently viewed products
  useEffect(() => {
    const viewedKey = 'recently_viewed';
    const viewed = JSON.parse(localStorage.getItem(viewedKey) || '[]');
    const filtered = viewed.filter((p: Product) => p.slug !== slug);
    setRecentlyViewed(filtered.slice(0, 4));
  }, [slug]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : '';
  };

  const getVimeoId = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : '';
  };

  const nextImage = () => {
    if (!product) return;
    const images = getAllImages();
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (!product) return;
    const images = getAllImages();
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const getAllImages = () => {
    if (!product) return [];
    return product.image_url 
      ? [product.image_url, ...(product.images || [])] 
      : (product.images || []);
  };

  // Get stock for selected variant
  const getVariantStock = () => {
    if (variantStocks.length === 0) return product?.stock || 0;
    
    const variant = variantStocks.find(v => 
      v.color === selectedColor && v.size === selectedSize
    );
    
    return variant?.stock ?? product?.stock ?? 0;
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity, { 
      selectedColor: selectedColor || undefined, 
      selectedSize: selectedSize || undefined 
    });
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem(product, quantity, { 
      selectedColor: selectedColor || undefined, 
      selectedSize: selectedSize || undefined 
    });
    navigate('/cart');
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="aspect-square bg-muted animate-pulse rounded-2xl" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-20 h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-6 bg-muted animate-pulse rounded w-1/4" />
              <div className="h-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Sản phẩm không tồn tại</h1>
          <Link to="/products">
            <Button>Quay lại cửa hàng</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const images = getAllImages();
  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  const currentStock = getVariantStock();
  const canAddToCart = currentStock > 0 && 
    (!product.colors?.length || selectedColor) && 
    (!product.sizes?.length || selectedSize);

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-gradient-to-r from-muted/50 to-background border-b">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Trang chủ</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/products" className="hover:text-foreground transition-colors">Sản phẩm</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container py-8 md:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image with Zoom */}
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-muted to-muted/50 cursor-zoom-in group shadow-lg">
                  {images[selectedImage] ? (
                    <>
                      <img
                        src={images[selectedImage]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-full flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                        <ZoomIn className="h-4 w-4" />
                        <span className="text-sm font-medium">Phóng to</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {product.is_hot && (
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 gap-1 shadow-lg">
                        <Flame className="h-3 w-3" />
                        HOT
                      </Badge>
                    )}
                    {discount > 0 && (
                      <Badge className="bg-gradient-to-r from-destructive to-red-600 shadow-lg">
                        -{discount}%
                      </Badge>
                    )}
                  </div>

                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all h-12 w-12 rounded-full shadow-xl bg-background/90 backdrop-blur-sm hover:bg-background hover:scale-110"
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all h-12 w-12 rounded-full shadow-xl bg-background/90 backdrop-blur-sm hover:bg-background hover:scale-110"
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                    </>
                  )}

                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm text-foreground text-sm px-4 py-2 rounded-full font-medium shadow-lg">
                      {selectedImage + 1} / {images.length}
                    </div>
                  )}
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-5xl p-0 bg-transparent border-none">
                <div className="relative">
                  <img
                    src={images[selectedImage]}
                    alt={product.name}
                    className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                  />
                  {images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full shadow-xl"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-7 w-7" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full shadow-xl"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-7 w-7" />
                      </Button>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={cn(
                      "flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all hover:scale-105",
                      selectedImage === idx 
                        ? "border-accent ring-2 ring-accent/30 shadow-lg" 
                        : "border-transparent opacity-70 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title & Tags */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {product.is_hot && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 gap-1">
                    <Flame className="h-3 w-3" />
                    Bán chạy
                  </Badge>
                )}
                {product.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-muted">{tag}</Badge>
                ))}
              </div>
              
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-6 leading-tight">
                {product.name}
              </h1>
              
              {/* Price Section */}
              <div className="bg-gradient-to-r from-muted/80 to-muted/40 rounded-2xl p-6 space-y-3">
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold text-accent">
                    {formatPrice(product.price)}
                  </span>
                  {product.original_price && (
                    <span className="text-xl text-muted-foreground line-through">
                      {formatPrice(product.original_price)}
                    </span>
                  )}
                </div>
                {product.original_price && (
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-sm px-3 py-1">
                      Tiết kiệm {formatPrice(product.original_price - product.price)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      (Giảm {discount}%)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {product.description && (
              <p className="text-muted-foreground leading-relaxed text-lg">
                {product.description}
              </p>
            )}

            <Separator />

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">Màu sắc</label>
                  {selectedColor && (
                    <span className="text-sm text-accent font-medium">{selectedColor}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "relative w-12 h-12 rounded-full transition-all duration-300",
                        colorMap[color] || 'bg-gray-400',
                        selectedColor === color 
                          ? "ring-4 ring-accent ring-offset-2 ring-offset-background scale-110 shadow-lg" 
                          : "hover:scale-110 hover:shadow-md"
                      )}
                      title={color}
                    >
                      {selectedColor === color && (
                        <Check className={cn(
                          "absolute inset-0 m-auto h-5 w-5 drop-shadow-md",
                          ['Trắng', 'Vàng'].includes(color) ? 'text-foreground' : 'text-white'
                        )} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-semibold">Kích thước</label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "min-w-[56px] h-12 px-5 rounded-xl border-2 font-semibold transition-all duration-300",
                        selectedSize === size
                          ? "border-accent bg-accent text-accent-foreground shadow-lg scale-105"
                          : "border-border hover:border-accent/50 hover:bg-muted hover:scale-105"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
              <Package className="h-5 w-5 text-accent" />
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-2.5 h-2.5 rounded-full animate-pulse",
                  currentStock > 10 ? 'bg-green-500' : currentStock > 0 ? 'bg-amber-500' : 'bg-destructive'
                )} />
                <span className="text-sm font-medium">
                  {currentStock > 10 
                    ? `Còn hàng (${currentStock} sản phẩm)`
                    : currentStock > 0 
                      ? `Chỉ còn ${currentStock} sản phẩm`
                      : 'Hết hàng'}
                </span>
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-3">
              <label className="text-sm font-semibold">Số lượng</label>
              <div className="flex items-center gap-6">
                <div className="flex items-center border-2 rounded-xl overflow-hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-none hover:bg-muted"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <span className="w-16 text-center font-bold text-xl">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-none hover:bg-muted"
                    onClick={() => setQuantity(Math.min(currentStock || 99, quantity + 1))}
                    disabled={quantity >= (currentStock || 99)}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                <div className="text-lg">
                  Tổng: <span className="font-bold text-accent">{formatPrice(product.price * quantity)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="hero"
                size="xl"
                className="flex-1 h-14 text-lg gap-2"
                onClick={handleAddToCart}
                disabled={!canAddToCart}
              >
                <ShoppingBag className="h-5 w-5" />
                {currentStock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
              </Button>
              <Button
                size="xl"
                className="flex-1 h-14 text-lg gap-2 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground"
                onClick={handleBuyNow}
                disabled={!canAddToCart}
              >
                <Zap className="h-5 w-5" />
                Mua ngay
              </Button>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="lg" 
                className={cn(
                  "flex-1 gap-2 transition-colors",
                  product && isInWishlist(product.id) && "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20"
                )}
                onClick={() => {
                  if (!user) {
                    toast.error('Vui lòng đăng nhập để thêm vào yêu thích');
                    return;
                  }
                  if (product) toggleWishlist(product.id);
                }}
              >
                <Heart className={cn("h-5 w-5", product && isInWishlist(product.id) && "fill-current")} />
                {product && isInWishlist(product.id) ? 'Đã yêu thích' : 'Yêu thích'}
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="flex-1 gap-2"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: product?.name,
                      url: window.location.href,
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Đã sao chép link sản phẩm');
                  }
                }}
              >
                <Share2 className="h-5 w-5" />
                Chia sẻ
              </Button>
            </div>

            {/* Selection Warning */}
            {!canAddToCart && currentStock > 0 && (
              <p className="text-sm text-muted-foreground bg-amber-500/10 p-3 rounded-lg">
                ⚠️ Vui lòng chọn {!selectedColor && product.colors?.length ? 'màu sắc' : ''} 
                {!selectedColor && !selectedSize && product.colors?.length && product.sizes?.length ? ' và ' : ''}
                {!selectedSize && product.sizes?.length ? 'kích thước' : ''}
              </p>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <Truck className="h-5 w-5 text-accent" />
                <div className="text-sm">
                  <p className="font-medium">Miễn phí vận chuyển</p>
                  <p className="text-muted-foreground text-xs">Đơn từ 500k</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <RotateCcw className="h-5 w-5 text-accent" />
                <div className="text-sm">
                  <p className="font-medium">Đổi trả 30 ngày</p>
                  <p className="text-muted-foreground text-xs">Hoàn tiền 100%</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <Shield className="h-5 w-5 text-accent" />
                <div className="text-sm">
                  <p className="font-medium">Bảo hành chính hãng</p>
                  <p className="text-muted-foreground text-xs">12 tháng</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <Star className="h-5 w-5 text-accent" />
                <div className="text-sm">
                  <p className="font-medium">Sản phẩm chính hãng</p>
                  <p className="text-muted-foreground text-xs">100% authentic</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Video Section */}
      {product.video_url && (
        <section className="bg-gradient-to-b from-background to-muted/30 border-t py-16">
          <div className="container">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-accent/10 rounded-xl">
                <Play className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold">Video Review</h2>
                <p className="text-muted-foreground">Xem video chi tiết sản phẩm</p>
              </div>
            </div>
            <div className="max-w-4xl mx-auto">
              {product.video_url!.includes('youtube.com') || product.video_url!.includes('youtu.be') ? (
                <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(product.video_url!)}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : product.video_url!.includes('vimeo.com') ? (
                <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
                  <iframe
                    src={`https://player.vimeo.com/video/${getVimeoId(product.video_url!)}`}
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <video
                  controls
                  className="w-full rounded-2xl shadow-2xl"
                  poster={product.image_url || undefined}
                >
                  <source src={(product as any).video_url} type="video/mp4" />
                  Trình duyệt không hỗ trợ video.
                </video>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Product Reviews Section */}
      <section className="border-t py-16">
        <div className="container">
          <ProductReviews productId={product.id} productName={product.name} />
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="border-t py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent/10 rounded-xl">
                  <Sparkles className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold">Sản phẩm tương tự</h2>
                  <p className="text-muted-foreground">Có thể bạn cũng thích</p>
                </div>
              </div>
              <Link to="/products">
                <Button variant="ghost" className="gap-2">
                  Xem tất cả
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hot Products */}
      {hotProducts.length > 0 && (
        <section className="bg-gradient-to-b from-muted/50 to-background py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500/10 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold">Đang thịnh hành</h2>
                  <p className="text-muted-foreground">Sản phẩm được yêu thích nhất</p>
                </div>
              </div>
              <Link to="/products?hot=true">
                <Button variant="ghost" className="gap-2">
                  Xem tất cả
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {hotProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <section className="border-t py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold">Đã xem gần đây</h2>
                  <p className="text-muted-foreground">Sản phẩm bạn đã xem trước đó</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {recentlyViewed.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default ProductDetail;
