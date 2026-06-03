import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SlidersHorizontal, X, Flame, Tag, Palette, Ruler, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ProductFilterSettings,
  defaultProductFilterSettings,
  ACCENT_CLASSES,
  FilterStyle,
} from '@/hooks/useProductFilterSettings';

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
  isHorizontal?: boolean;
  settings?: ProductFilterSettings;
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

const styleClasses = (style: FilterStyle) => {
  switch (style) {
    case 'minimal':
      return { container: 'bg-card border border-border/60 rounded-xl', chipRadius: 'rounded-md', sliceBtn: 'rounded-md' };
    case 'pill':
      return { container: 'bg-card border border-border rounded-3xl', chipRadius: 'rounded-full', sliceBtn: 'rounded-full' };
    case 'glass':
      return { container: 'bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-lg shadow-black/5', chipRadius: 'rounded-full', sliceBtn: 'rounded-full' };
    case 'neon':
      return { container: 'bg-card border-2 border-primary/40 rounded-2xl shadow-[0_0_30px_-10px_hsl(var(--primary)/0.5)]', chipRadius: 'rounded-md', sliceBtn: 'rounded-md' };
    case 'card':
      return { container: 'bg-card border border-border rounded-2xl shadow-md', chipRadius: 'rounded-lg', sliceBtn: 'rounded-lg' };
    case 'rounded':
    default:
      return { container: 'bg-card border border-border rounded-2xl shadow-sm', chipRadius: 'rounded-full', sliceBtn: 'rounded-lg' };
  }
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
  isHorizontal = false,
  settings = defaultProductFilterSettings,
}: ProductFiltersProps) {
  const [minInput, setMinInput] = useState('');
  const [maxInput, setMaxInput] = useState('');

  const accent = ACCENT_CLASSES[settings.accent];
  const sc = styleClasses(settings.style);

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

  // --- Reusable section blocks ---
  const PriceSection = () => (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {PRICE_PRESETS.map((preset) => {
          const isActive = filters.priceRange[0] === preset.min && filters.priceRange[1] === Math.min(preset.max, maxPrice);
          return (
            <button
              key={preset.label}
              onClick={() => applyPricePreset(preset.min, preset.max)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-all border',
                sc.chipRadius,
                isActive
                  ? cn(accent.bg, 'text-white border-transparent shadow-sm')
                  : 'bg-muted/40 text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input type="number" placeholder="Từ" value={minInput} onChange={(e) => setMinInput(e.target.value)} className="h-8 text-xs pr-6" />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">K</span>
        </div>
        <span className="text-muted-foreground text-xs">—</span>
        <div className="relative flex-1">
          <Input type="number" placeholder="Đến" value={maxInput} onChange={(e) => setMaxInput(e.target.value)} className="h-8 text-xs pr-6" />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">K</span>
        </div>
        <Button size="sm" variant="secondary" className="h-8 px-3 text-xs" onClick={applyCustomPrice}>OK</Button>
      </div>
      {(filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
        <div className={cn('flex items-center justify-between rounded-lg px-3 py-1.5', accent.soft)}>
          <span className={cn('text-xs font-medium', accent.text)}>
            {formatPrice(filters.priceRange[0])} — {formatPrice(filters.priceRange[1])}
          </span>
          <button onClick={() => { onFiltersChange({ ...filters, priceRange: [0, maxPrice] }); setMinInput(''); setMaxInput(''); }} className="text-muted-foreground hover:text-foreground">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );

  const ColorsSection = () => (
    <div className="flex flex-wrap gap-2">
      {availableColors.map((color) => {
        const active = filters.colors.includes(color);
        return (
          <button
            key={color}
            onClick={() => toggleColor(color)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 border text-xs transition-all',
              sc.chipRadius,
              active ? cn(accent.border, accent.soft, accent.text, 'font-medium') : 'border-border hover:border-foreground/30 text-muted-foreground'
            )}
          >
            <span className={cn('w-3 h-3 rounded-full shrink-0', colorMap[color] || 'bg-gray-400')} />
            {color}
          </button>
        );
      })}
    </div>
  );

  const SizesSection = () => (
    <div className="flex flex-wrap gap-1.5">
      {availableSizes.map((size) => {
        const active = filters.sizes.includes(size);
        return (
          <button
            key={size}
            onClick={() => toggleSize(size)}
            className={cn(
              'px-3 py-1.5 border text-xs font-medium transition-all min-w-[36px] text-center',
              sc.sliceBtn,
              active ? cn(accent.bg, accent.border, 'text-white shadow-sm') : 'border-border hover:border-foreground/30 text-muted-foreground'
            )}
          >
            {size}
          </button>
        );
      })}
    </div>
  );

  const TagsSection = () => (
    <div className="flex flex-wrap gap-1.5">
      {availableTags.map((tag) => {
        const active = filters.tags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={cn(
              'px-2.5 py-1 text-xs transition-all border',
              sc.chipRadius,
              active ? cn(accent.bg, 'text-white border-transparent') : 'border-border bg-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );

  const SpecialSection = () => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Checkbox id="hot" checked={filters.isHot} onCheckedChange={(checked) => onFiltersChange({ ...filters, isHot: !!checked })} />
        <Label htmlFor="hot" className="flex items-center gap-1.5 text-sm cursor-pointer">
          <Flame className="h-4 w-4 text-orange-500" /> Hàng Hot
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="discount" checked={filters.hasDiscount} onCheckedChange={(checked) => onFiltersChange({ ...filters, hasDiscount: !!checked })} />
        <Label htmlFor="discount" className="text-sm cursor-pointer">🏷️ Đang giảm giá</Label>
      </div>
    </div>
  );

  const ActiveChips = () => {
    if (!settings.show_active_chips || activeFiltersCount === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {filters.colors.map((c) => (
          <Badge key={`c-${c}`} variant="secondary" className={cn('gap-1 cursor-pointer', sc.chipRadius)} onClick={() => toggleColor(c)}>
            {c} <X className="h-3 w-3" />
          </Badge>
        ))}
        {filters.sizes.map((s) => (
          <Badge key={`s-${s}`} variant="secondary" className={cn('gap-1 cursor-pointer', sc.chipRadius)} onClick={() => toggleSize(s)}>
            Size {s} <X className="h-3 w-3" />
          </Badge>
        ))}
        {filters.tags.map((t) => (
          <Badge key={`t-${t}`} variant="secondary" className={cn('gap-1 cursor-pointer', sc.chipRadius)} onClick={() => toggleTag(t)}>
            {t} <X className="h-3 w-3" />
          </Badge>
        ))}
        {filters.isHot && (
          <Badge variant="secondary" className={cn('gap-1 cursor-pointer', sc.chipRadius)} onClick={() => onFiltersChange({ ...filters, isHot: false })}>
            Hot <X className="h-3 w-3" />
          </Badge>
        )}
        {filters.hasDiscount && (
          <Badge variant="secondary" className={cn('gap-1 cursor-pointer', sc.chipRadius)} onClick={() => onFiltersChange({ ...filters, hasDiscount: false })}>
            Giảm giá <X className="h-3 w-3" />
          </Badge>
        )}
        <button onClick={onReset} className="text-xs text-muted-foreground hover:text-foreground underline ml-1">
          Xoá tất cả
        </button>
      </div>
    );
  };

  // Vertical accordion content (sidebar / drawer)
  const VerticalContent = () => (
    <div className="space-y-1">
      <ActiveChips />
      <Accordion type="multiple" defaultValue={['price', 'colors', 'sizes', 'tags', 'special']} className="w-full">
        {settings.show_price && (
          <AccordionItem value="price" className="border-b-0">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
              <span className="flex items-center gap-2"><Tag className={cn('w-4 h-4', accent.text)} />Khoảng giá</span>
            </AccordionTrigger>
            <AccordionContent className="pb-2"><PriceSection /></AccordionContent>
          </AccordionItem>
        )}
        {settings.show_colors && availableColors.length > 0 && (
          <AccordionItem value="colors" className="border-b-0">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
              <span className="flex items-center gap-2"><Palette className={cn('w-4 h-4', accent.text)} />Màu sắc</span>
            </AccordionTrigger>
            <AccordionContent className="pb-2"><ColorsSection /></AccordionContent>
          </AccordionItem>
        )}
        {settings.show_sizes && availableSizes.length > 0 && (
          <AccordionItem value="sizes" className="border-b-0">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
              <span className="flex items-center gap-2"><Ruler className={cn('w-4 h-4', accent.text)} />Kích thước</span>
            </AccordionTrigger>
            <AccordionContent className="pb-2"><SizesSection /></AccordionContent>
          </AccordionItem>
        )}
        {settings.show_tags && availableTags.length > 0 && (
          <AccordionItem value="tags" className="border-b-0">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Tags</AccordionTrigger>
            <AccordionContent className="pb-2"><TagsSection /></AccordionContent>
          </AccordionItem>
        )}
        {settings.show_special && (
          <AccordionItem value="special" className="border-b-0">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Đặc biệt</AccordionTrigger>
            <AccordionContent className="pb-2"><SpecialSection /></AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
      {activeFiltersCount > 0 && (
        <Button variant="outline" className="w-full mt-2 rounded-full" onClick={onReset}>
          <X className="h-4 w-4 mr-2" /> Xóa bộ lọc ({activeFiltersCount})
        </Button>
      )}
    </div>
  );

  // Horizontal mode — popover-per-section chips
  if (isHorizontal) {
    const PopBtn = ({ label, icon: Icon, count, children }: { label: string; icon?: React.ComponentType<{ className?: string }>; count: number; children: React.ReactNode }) => (
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'inline-flex items-center gap-1.5 px-3 h-9 text-xs font-medium border transition-all',
              sc.chipRadius,
              count > 0 ? cn(accent.border, accent.soft, accent.text) : 'border-border bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
            {count > 0 && <span className={cn('ml-0.5 inline-flex items-center justify-center text-[10px] h-4 min-w-4 px-1 rounded-full', accent.bg, 'text-white')}>{count}</span>}
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="start">
          {children}
        </PopoverContent>
      </Popover>
    );

    const priceActive = filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice ? 1 : 0;

    return (
      <div className={cn('p-3 md:p-4 mb-5', sc.container)}>
        <ActiveChips />
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
            <SlidersHorizontal className={cn('w-4 h-4', accent.text)} />
            Bộ lọc:
          </div>
          {settings.show_price && (
            <PopBtn label="Khoảng giá" icon={Tag} count={priceActive}><PriceSection /></PopBtn>
          )}
          {settings.show_colors && availableColors.length > 0 && (
            <PopBtn label="Màu sắc" icon={Palette} count={filters.colors.length}><ColorsSection /></PopBtn>
          )}
          {settings.show_sizes && availableSizes.length > 0 && (
            <PopBtn label="Size" icon={Ruler} count={filters.sizes.length}><SizesSection /></PopBtn>
          )}
          {settings.show_tags && availableTags.length > 0 && (
            <PopBtn label="Tags" count={filters.tags.length}><TagsSection /></PopBtn>
          )}
          {settings.show_special && (
            <PopBtn label="Đặc biệt" icon={Flame} count={(filters.isHot ? 1 : 0) + (filters.hasDiscount ? 1 : 0)}><SpecialSection /></PopBtn>
          )}
          {activeFiltersCount > 0 && (
            <button onClick={onReset} className={cn('ml-auto inline-flex items-center gap-1 px-3 h-9 text-xs font-medium border border-border hover:border-destructive hover:text-destructive transition-colors', sc.chipRadius)}>
              <X className="w-3.5 h-3.5" /> Xoá ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>
    );
  }

  // Desktop sidebar mode
  if (isDesktopOnly) {
    return (
      <div className="w-[260px] flex-shrink-0">
        <div className={cn('p-5', sc.container, settings.sticky && 'sticky top-24')}>
          <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2">
            <SlidersHorizontal className={cn('w-4 h-4', accent.text)} />
            Bộ lọc
            {activeFiltersCount > 0 && (
              <Badge className={cn('ml-auto text-[10px]', accent.bg, 'text-white border-transparent')}>
                {activeFiltersCount}
              </Badge>
            )}
          </h3>
          <VerticalContent />
        </div>
      </div>
    );
  }

  // Mobile drawer
  if (isMobileOnly) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className={cn('gap-2', sc.chipRadius)}>
            <SlidersHorizontal className="h-4 w-4" />
            Bộ lọc
            {activeFiltersCount > 0 && (
              <Badge className={cn('ml-1 h-5 min-w-5 p-0 flex items-center justify-center text-[10px] border-transparent text-white', accent.bg)}>
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[320px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className={cn('w-4 h-4', accent.text)} /> Bộ lọc sản phẩm
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4"><VerticalContent /></div>
        </SheetContent>
      </Sheet>
    );
  }

  return null;
}
