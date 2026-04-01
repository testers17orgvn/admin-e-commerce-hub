import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SlidersHorizontal, X, Flame, Tag, Palette, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterState {
  colors: string[];
  sizes: string[];
  tags: string[];
  priceRange: [number, number];
  isHot: boolean;
  hasDiscount: boolean;
  categoryId: string;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface ProductFiltersProps {
  availableColors: string[];
  availableSizes: string[];
  availableTags: string[];
  categories: CategoryOption[];
  maxPrice: number;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
  isMobileOnly?: boolean;
  isDesktopOnly?: boolean;
}

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

const PRICE_PRESETS = [
  { label: 'Dưới 100K', min: 0, max: 100000 },
  { label: '100K - 300K', min: 100000, max: 300000 },
  { label: '300K - 500K', min: 300000, max: 500000 },
  { label: '500K - 1tr', min: 500000, max: 1000000 },
  { label: 'Trên 1tr', min: 1000000, max: 99999999 },
];

export function ProductFilters({
  availableColors,
  availableSizes,
  availableTags,
  categories,
  maxPrice,
  filters,
  onFiltersChange,
  onReset,
  isMobileOnly = false,
  isDesktopOnly = false,
}: ProductFiltersProps) {
  const [minInput, setMinInput] = useState('');
  const [maxInput, setMaxInput] = useState('');

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)}tr`;
    if (price >= 1000) return `${Math.round(price / 1000)}K`;
    return price.toLocaleString('vi-VN');
  };

  const activeFiltersCount = 
    filters.colors.length + 
    filters.sizes.length + 
    filters.tags.length + 
    (filters.isHot ? 1 : 0) + 
    (filters.hasDiscount ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice ? 1 : 0);

  const toggleColor = (color: string) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter(c => c !== color)
      : [...filters.colors, color];
    onFiltersChange({ ...filters, colors: newColors });
  };

  const toggleSize = (size: string) => {
    const newSizes = filters.sizes.includes(size)
      ? filters.sizes.filter(s => s !== size)
      : [...filters.sizes, size];
    onFiltersChange({ ...filters, sizes: newSizes });
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  const applyPricePreset = (min: number, max: number) => {
    const isActive = filters.priceRange[0] === min && filters.priceRange[1] === max;
    if (isActive) {
      onFiltersChange({ ...filters, priceRange: [0, maxPrice] });
    } else {
      onFiltersChange({ ...filters, priceRange: [min, Math.min(max, maxPrice)] });
    }
  };

  const applyCustomPrice = () => {
    const min = minInput ? parseInt(minInput) * 1000 : 0;
    const max = maxInput ? parseInt(maxInput) * 1000 : maxPrice;
    onFiltersChange({ ...filters, priceRange: [min, max] });
  };

  const FilterContent = () => (
    <div className="space-y-1">
      <Accordion type="multiple" defaultValue={['price', 'colors', 'sizes', 'tags', 'special']} className="w-full">
        {/* Price Range - Friendly presets + custom input */}
        <AccordionItem value="price" className="border-b-0">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              Khoảng giá
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pb-2">
              {/* Price presets */}
              <div className="flex flex-wrap gap-1.5">
                {PRICE_PRESETS.map((preset) => {
                  const isActive = filters.priceRange[0] === preset.min && filters.priceRange[1] === Math.min(preset.max, maxPrice);
                  return (
                    <button
                      key={preset.label}
                      onClick={() => applyPricePreset(preset.min, preset.max)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom price input */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    placeholder="Từ"
                    value={minInput}
                    onChange={(e) => setMinInput(e.target.value)}
                    className="h-8 text-xs pr-6"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">K</span>
                </div>
                <span className="text-muted-foreground text-xs">—</span>
                <div className="relative flex-1">
                  <Input
                    type="number"
                    placeholder="Đến"
                    value={maxInput}
                    onChange={(e) => setMaxInput(e.target.value)}
                    className="h-8 text-xs pr-6"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">K</span>
                </div>
                <Button size="sm" variant="secondary" className="h-8 px-3 text-xs" onClick={applyCustomPrice}>
                  Áp dụng
                </Button>
              </div>

              {/* Current range display */}
              {(filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
                <div className="flex items-center justify-between bg-primary/5 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-primary font-medium">
                    {formatPrice(filters.priceRange[0])} — {formatPrice(filters.priceRange[1])}
                  </span>
                  <button
                    onClick={() => {
                      onFiltersChange({ ...filters, priceRange: [0, maxPrice] });
                      setMinInput('');
                      setMaxInput('');
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Colors */}
        {availableColors.length > 0 && (
          <AccordionItem value="colors" className="border-b-0">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
              <span className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                Màu sắc
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2 pb-2">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => toggleColor(color)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-all",
                      filters.colors.includes(color) 
                        ? "border-primary bg-primary/10 text-primary font-medium" 
                        : "border-border hover:border-primary/50 text-muted-foreground"
                    )}
                  >
                    <span className={cn("w-3 h-3 rounded-full shrink-0", colorMap[color] || 'bg-gray-400')} />
                    {color}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Sizes */}
        {availableSizes.length > 0 && (
          <AccordionItem value="sizes" className="border-b-0">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
              <span className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-primary" />
                Kích thước
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-1.5 pb-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all min-w-[36px] text-center",
                      filters.sizes.includes(size) 
                        ? "border-primary bg-primary text-primary-foreground shadow-sm" 
                        : "border-border hover:border-primary/50 text-muted-foreground"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Tags */}
        {availableTags.length > 0 && (
          <AccordionItem value="tags" className="border-b-0">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Tags</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-1.5 pb-2">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={filters.tags.includes(tag) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all text-xs",
                      filters.tags.includes(tag) && "bg-primary hover:bg-primary/80"
                    )}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Special Filters */}
        <AccordionItem value="special" className="border-b-0">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Đặc biệt</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pb-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hot" 
                  checked={filters.isHot}
                  onCheckedChange={(checked) => onFiltersChange({ ...filters, isHot: !!checked })}
                />
                <Label htmlFor="hot" className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Hàng Hot
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="discount" 
                  checked={filters.hasDiscount}
                  onCheckedChange={(checked) => onFiltersChange({ ...filters, hasDiscount: !!checked })}
                />
                <Label htmlFor="discount" className="text-sm cursor-pointer">
                  🏷️ Đang giảm giá
                </Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {activeFiltersCount > 0 && (
        <Button variant="outline" className="w-full mt-2" onClick={onReset}>
          <X className="h-4 w-4 mr-2" />
          Xóa bộ lọc ({activeFiltersCount})
        </Button>
      )}
    </div>
  );

  // Desktop only mode
  if (isDesktopOnly) {
    return (
      <div className="w-[260px] flex-shrink-0">
        <div className="sticky top-24 bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            Bộ lọc
          </h3>
          <FilterContent />
        </div>
      </div>
    );
  }

  // Mobile only mode
  if (isMobileOnly) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 rounded-full">
            <SlidersHorizontal className="h-4 w-4" />
            Bộ lọc
            {activeFiltersCount > 0 && (
              <Badge className="ml-1 h-5 min-w-5 p-0 flex items-center justify-center text-[10px] bg-primary">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[320px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              Bộ lọc sản phẩm
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return null;
}
