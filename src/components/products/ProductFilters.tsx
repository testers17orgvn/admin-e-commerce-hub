import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SlidersHorizontal, X, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterState {
  colors: string[];
  sizes: string[];
  tags: string[];
  priceRange: [number, number];
  isHot: boolean;
  hasDiscount: boolean;
}

interface ProductFiltersProps {
  availableColors: string[];
  availableSizes: string[];
  availableTags: string[];
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

export function ProductFilters({
  availableColors,
  availableSizes,
  availableTags,
  maxPrice,
  filters,
  onFiltersChange,
  onReset,
  isMobileOnly = false,
  isDesktopOnly = false,
}: ProductFiltersProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
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

  const FilterContent = () => (
    <div className="space-y-6">
      <Accordion type="multiple" defaultValue={['price', 'colors', 'sizes', 'tags', 'special']} className="w-full">
        {/* Price Range */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-semibold">Khoảng giá</AccordionTrigger>
          <AccordionContent>
            <div className="px-2 py-4 space-y-4">
              <Slider
                value={filters.priceRange}
                min={0}
                max={maxPrice}
                step={50000}
                onValueChange={(value) => onFiltersChange({ ...filters, priceRange: value as [number, number] })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatPrice(filters.priceRange[0])}</span>
                <span>{formatPrice(filters.priceRange[1])}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Colors */}
        {availableColors.length > 0 && (
          <AccordionItem value="colors">
            <AccordionTrigger className="text-sm font-semibold">Màu sắc</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2 py-2">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => toggleColor(color)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all",
                      filters.colors.includes(color) 
                        ? "border-accent bg-accent/10 text-accent" 
                        : "border-border hover:border-accent/50"
                    )}
                  >
                    <span className={cn("w-3 h-3 rounded-full", colorMap[color] || 'bg-gray-400')} />
                    {color}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Sizes */}
        {availableSizes.length > 0 && (
          <AccordionItem value="sizes">
            <AccordionTrigger className="text-sm font-semibold">Kích thước</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2 py-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={cn(
                      "px-3 py-1.5 rounded-md border text-xs font-medium transition-all min-w-[40px]",
                      filters.sizes.includes(size) 
                        ? "border-accent bg-accent text-accent-foreground" 
                        : "border-border hover:border-accent/50"
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
          <AccordionItem value="tags">
            <AccordionTrigger className="text-sm font-semibold">Tags</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2 py-2">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={filters.tags.includes(tag) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all",
                      filters.tags.includes(tag) && "bg-accent hover:bg-accent/80"
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
        <AccordionItem value="special">
          <AccordionTrigger className="text-sm font-semibold">Đặc biệt</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 py-2">
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
                  Đang giảm giá
                </Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {activeFiltersCount > 0 && (
        <Button variant="outline" className="w-full" onClick={onReset}>
          <X className="h-4 w-4 mr-2" />
          Xóa bộ lọc ({activeFiltersCount})
        </Button>
      )}
    </div>
  );

  // Desktop only mode
  if (isDesktopOnly) {
    return (
      <div className="w-64 flex-shrink-0">
        <div className="sticky top-24 bg-card rounded-lg border p-4">
          <h3 className="font-display font-bold text-lg mb-4">Bộ lọc</h3>
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
          <Button variant="outline" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Bộ lọc
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Bộ lọc sản phẩm</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Default: render both
  return (
    <>
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 bg-card rounded-lg border p-4">
          <h3 className="font-display font-bold text-lg mb-4">Bộ lọc</h3>
          <FilterContent />
        </div>
      </div>
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Bộ lọc
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Bộ lọc sản phẩm</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}