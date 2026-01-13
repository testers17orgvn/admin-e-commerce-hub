import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  is_hot: boolean;
}

interface SearchBarProps {
  className?: string;
  onClose?: () => void;
  isModal?: boolean;
}

const popularSearches = ['Áo thun', 'Quần jean', 'Váy đầm', 'Giày sneaker', 'Túi xách'];

export function SearchBar({ className, onClose, isModal = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // Save search to recent
  const saveRecentSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Debounced search
  const searchProducts = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, slug, price, original_price, image_url, is_hot')
      .eq('is_active', true)
      .ilike('name', `%${searchQuery}%`)
      .limit(8);

    if (!error && data) {
      setResults(data);
    }
    setLoading(false);
  }, []);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchProducts]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      onClose?.();
    }
  };

  // Handle product click
  const handleProductClick = (product: Product) => {
    saveRecentSearch(product.name);
    navigate(`/products/${product.slug}`);
    setIsOpen(false);
    onClose?.();
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    saveRecentSearch(suggestion);
    navigate(`/products?search=${encodeURIComponent(suggestion)}`);
    setIsOpen(false);
    onClose?.();
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const showDropdown = isOpen && (query.length > 0 || recentSearches.length > 0);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className={cn(
              "pl-12 pr-12 h-12 rounded-full bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-accent/50 text-base",
              isModal && "h-14 text-lg"
            )}
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {loading && (
            <Loader2 className="absolute right-12 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </form>

      {/* Dropdown Results */}
      {showDropdown && (
        <div className={cn(
          "absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-2xl border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200",
          isModal ? "max-h-[60vh]" : "max-h-[70vh]"
        )}>
          <div className="overflow-y-auto max-h-[inherit]">
            {/* Search Results */}
            {query.length > 0 && (
              <>
                {results.length > 0 ? (
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Kết quả tìm kiếm
                    </div>
                    {results.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group"
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Search className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate group-hover:text-accent transition-colors">
                              {product.name}
                            </p>
                            {product.is_hot && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">
                                HOT
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-accent font-bold">
                              {product.price.toLocaleString('vi-VN')}đ
                            </span>
                            {product.original_price && product.original_price > product.price && (
                              <span className="text-xs text-muted-foreground line-through">
                                {product.original_price.toLocaleString('vi-VN')}đ
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                    
                    {/* View all results */}
                    <button
                      onClick={handleSubmit}
                      className="w-full p-3 text-center text-accent font-medium hover:bg-accent/10 rounded-xl transition-colors mt-1"
                    >
                      Xem tất cả kết quả cho "{query}"
                    </button>
                  </div>
                ) : !loading && (
                  <div className="p-8 text-center">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">
                      Không tìm thấy sản phẩm cho "{query}"
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Thử tìm kiếm với từ khóa khác
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Recent & Popular Searches (when no query) */}
            {query.length === 0 && (
              <div className="p-2">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        Tìm kiếm gần đây
                      </span>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-muted-foreground hover:text-accent transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(search)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors text-left"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{search}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Popular Searches */}
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Tìm kiếm phổ biến
                  </div>
                  <div className="flex flex-wrap gap-2 p-3">
                    {popularSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(search)}
                        className="px-4 py-2 bg-muted/50 hover:bg-accent/10 hover:text-accent rounded-full text-sm font-medium transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}