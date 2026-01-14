import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { ShoppingBag, Heart, Share2, Minus, Plus, ChevronRight, ChevronLeft, ZoomIn, Flame, Check, Eye, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductReviews } from '@/components/products/ProductReviews';
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

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [hotProducts, setHotProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const { addItem } = useCart();

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

  if (loading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="aspect-square bg-muted animate-pulse rounded-lg" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-20 h-20 bg-muted animate-pulse rounded-md" />
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

  const canAddToCart = product.stock > 0 && 
    (!product.colors?.length || selectedColor) && 
    (!product.sizes?.length || selectedSize);

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="border-b">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Trang chủ</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/products" className="hover:text-foreground transition-colors">Sản phẩm</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image with Zoom */}
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative aspect-square overflow-hidden rounded-xl bg-muted cursor-zoom-in group">
                  {images[selectedImage] ? (
                    <>
                      <img
                        src={images[selectedImage]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
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
                      <Badge className="bg-orange-500 hover:bg-orange-600 gap-1">
                        <Flame className="h-3 w-3" />
                        HOT
                      </Badge>
                    )}
                    {discount > 0 && (
                      <Badge variant="destructive">-{discount}%</Badge>
                    )}
                  </div>

                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10 rounded-full shadow-lg"
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10 rounded-full shadow-lg"
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </>
                  )}

                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      {selectedImage + 1} / {images.length}
                    </div>
                  )}
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
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
                        className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-6 w-6" />
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
                      "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all hover:opacity-80",
                      selectedImage === idx 
                        ? "border-accent ring-2 ring-accent/30" 
                        : "border-transparent opacity-70"
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
            {/* Title & Price */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                {product.is_hot && (
                  <Badge className="bg-orange-500 hover:bg-orange-600 gap-1">
                    <Flame className="h-3 w-3" />
                    Bán chạy
                  </Badge>
                )}
                {product.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
              
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-foreground">
                  {formatPrice(product.price)}
                </span>
                {product.original_price && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      {formatPrice(product.original_price)}
                    </span>
                    <Badge variant="destructive" className="text-sm">
                      Tiết kiệm {formatPrice(product.original_price - product.price)}
                    </Badge>
                  </>
                )}
              </div>
            </div>

            {product.description && (
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Màu sắc</label>
                  {selectedColor && (
                    <span className="text-sm text-muted-foreground">{selectedColor}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "relative w-10 h-10 rounded-full transition-all",
                        colorMap[color] || 'bg-gray-400',
                        selectedColor === color 
                          ? "ring-2 ring-accent ring-offset-2 ring-offset-background scale-110" 
                          : "hover:scale-105"
                      )}
                      title={color}
                    >
                      {selectedColor === color && (
                        <Check className={cn(
                          "absolute inset-0 m-auto h-5 w-5",
                          ['Trắng', 'Vàng'].includes(color) ? 'text-black' : 'text-white'
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
                <label className="text-sm font-medium">Kích thước</label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "min-w-[48px] h-12 px-4 rounded-lg border-2 font-medium transition-all",
                        selectedSize === size
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border hover:border-accent/50 hover:bg-muted"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2 py-2">
              <span className={cn(
                "w-2.5 h-2.5 rounded-full animate-pulse",
                product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
              )} />
              <span className="text-sm">
                {product.stock > 10 
                  ? `Còn hàng (${product.stock} sản phẩm)`
                  : product.stock > 0 
                    ? `Chỉ còn ${product.stock} sản phẩm`
                    : 'Hết hàng'}
              </span>
            </div>

            {/* Quantity */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Số lượng</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-none"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-14 text-center font-semibold text-lg">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-none"
                    onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                    disabled={quantity >= (product.stock || 99)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  Tổng: <span className="font-semibold text-foreground">{formatPrice(product.price * quantity)}</span>
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="hero"
                size="xl"
                className="flex-1 h-14"
                onClick={() => addItem(product, quantity, { 
                  selectedColor: selectedColor || undefined, 
                  selectedSize: selectedSize || undefined 
                })}
                disabled={!canAddToCart}
              >
                <ShoppingBag className="h-5 w-5" />
                {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
              </Button>
              <Button variant="outline" size="xl" className="h-14 w-14">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="xl" className="h-14 w-14">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Selection Warning */}
            {!canAddToCart && product.stock > 0 && (
              <p className="text-sm text-muted-foreground">
                Vui lòng chọn {!selectedColor && product.colors?.length ? 'màu sắc' : ''} 
                {!selectedColor && !selectedSize && product.colors?.length && product.sizes?.length ? ' và ' : ''}
                {!selectedSize && product.sizes?.length ? 'kích thước' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

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
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold">Sản phẩm tương tự</h2>
                  <p className="text-muted-foreground text-sm">Có thể bạn cũng thích</p>
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
        <section className="bg-muted/50 py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold">Đang thịnh hành</h2>
                  <p className="text-muted-foreground text-sm">Sản phẩm được yêu thích nhất</p>
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
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold">Đã xem gần đây</h2>
                  <p className="text-muted-foreground text-sm">Sản phẩm bạn đã xem trước đó</p>
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
