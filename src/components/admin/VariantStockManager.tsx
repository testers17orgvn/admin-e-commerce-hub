import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Package, Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VariantStock {
  id?: string;
  product_id: string;
  color: string | null;
  size: string | null;
  stock: number;
}

interface VariantStockManagerProps {
  productId: string;
  colors: string[];
  sizes: string[];
  totalStock: number;
  onTotalStockChange?: (newTotal: number) => void;
}

export function VariantStockManager({ 
  productId, 
  colors, 
  sizes, 
  totalStock,
  onTotalStockChange 
}: VariantStockManagerProps) {
  const [variantStocks, setVariantStocks] = useState<VariantStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Generate all possible variants
  const generateVariants = (): VariantStock[] => {
    const variants: VariantStock[] = [];
    
    if (colors.length === 0 && sizes.length === 0) {
      return [];
    }
    
    if (colors.length > 0 && sizes.length > 0) {
      colors.forEach(color => {
        sizes.forEach(size => {
          variants.push({
            product_id: productId,
            color,
            size,
            stock: 0
          });
        });
      });
    } else if (colors.length > 0) {
      colors.forEach(color => {
        variants.push({
          product_id: productId,
          color,
          size: null,
          stock: 0
        });
      });
    } else if (sizes.length > 0) {
      sizes.forEach(size => {
        variants.push({
          product_id: productId,
          color: null,
          size,
          stock: 0
        });
      });
    }
    
    return variants;
  };

  // Fetch existing variant stocks
  const fetchVariantStocks = async () => {
    if (!productId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('product_variant_stock')
      .select('*')
      .eq('product_id', productId);

    if (error) {
      console.error('Error fetching variant stocks:', error);
      setLoading(false);
      return;
    }

    const generatedVariants = generateVariants();
    
    // Merge existing data with generated variants
    const mergedVariants = generatedVariants.map(variant => {
      const existing = data?.find(d => 
        d.color === variant.color && d.size === variant.size
      );
      return existing ? { ...variant, id: existing.id, stock: existing.stock } : variant;
    });

    setVariantStocks(mergedVariants);
    setLoading(false);
  };

  useEffect(() => {
    if (productId && (colors.length > 0 || sizes.length > 0)) {
      fetchVariantStocks();
    } else {
      setVariantStocks([]);
    }
  }, [productId, colors.join(','), sizes.join(',')]);

  const updateVariantStock = (index: number, newStock: number) => {
    setVariantStocks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], stock: Math.max(0, newStock) };
      return updated;
    });
  };

  // Distribute total stock evenly
  const distributeEvenly = () => {
    if (variantStocks.length === 0) return;
    
    const perVariant = Math.floor(totalStock / variantStocks.length);
    const remainder = totalStock % variantStocks.length;
    
    setVariantStocks(prev => prev.map((variant, index) => ({
      ...variant,
      stock: perVariant + (index < remainder ? 1 : 0)
    })));
  };

  const saveVariantStocks = async () => {
    setSaving(true);
    
    try {
      for (const variant of variantStocks) {
        if (variant.id) {
          // Update existing
          await supabase
            .from('product_variant_stock')
            .update({ stock: variant.stock })
            .eq('id', variant.id);
        } else {
          // Insert new
          await supabase
            .from('product_variant_stock')
            .upsert({
              product_id: variant.product_id,
              color: variant.color,
              size: variant.size,
              stock: variant.stock
            }, { onConflict: 'product_id,color,size' });
        }
      }
      
      // Update total stock in products table
      const newTotal = variantStocks.reduce((sum, v) => sum + v.stock, 0);
      await supabase
        .from('products')
        .update({ stock: newTotal })
        .eq('id', productId);
      
      onTotalStockChange?.(newTotal);
      toast.success('Đã lưu tồn kho biến thể');
      fetchVariantStocks();
    } catch (error) {
      toast.error('Lỗi khi lưu');
      console.error(error);
    }
    
    setSaving(false);
  };

  const calculatedTotal = variantStocks.reduce((sum, v) => sum + v.stock, 0);
  const hasVariants = colors.length > 0 || sizes.length > 0;

  if (!hasVariants) {
    return (
      <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Package className="h-5 w-5" />
          <span className="text-sm">Thêm màu sắc hoặc kích thước để quản lý tồn kho theo biến thể</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-accent" />
          <h4 className="font-medium">Tồn kho theo biến thể</h4>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={distributeEvenly}
            disabled={loading || totalStock === 0}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Phân bổ đều ({totalStock})
          </Button>
          <Button 
            type="button" 
            variant="hero" 
            size="sm" 
            onClick={saveVariantStocks}
            disabled={saving || loading}
          >
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Đang lưu...' : 'Lưu tồn kho'}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {colors.length > 0 && <TableHead>Màu sắc</TableHead>}
              {sizes.length > 0 && <TableHead>Kích thước</TableHead>}
              <TableHead className="text-right">Số lượng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : (
              variantStocks.map((variant, index) => (
                <TableRow key={`${variant.color}-${variant.size}`}>
                  {colors.length > 0 && (
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <span className={cn(
                          "w-3 h-3 rounded-full",
                          variant.color === 'Đỏ' && 'bg-red-500',
                          variant.color === 'Xanh dương' && 'bg-blue-500',
                          variant.color === 'Xanh lá' && 'bg-green-500',
                          variant.color === 'Vàng' && 'bg-yellow-500',
                          variant.color === 'Đen' && 'bg-black',
                          variant.color === 'Trắng' && 'bg-white border border-gray-300',
                          variant.color === 'Hồng' && 'bg-pink-500',
                          variant.color === 'Tím' && 'bg-purple-500',
                          variant.color === 'Cam' && 'bg-orange-500',
                          variant.color === 'Xám' && 'bg-gray-500',
                          variant.color === 'Nâu' && 'bg-amber-700',
                          variant.color === 'Navy' && 'bg-blue-900',
                        )} />
                        {variant.color}
                      </Badge>
                    </TableCell>
                  )}
                  {sizes.length > 0 && (
                    <TableCell>
                      <Badge variant="secondary">{variant.size}</Badge>
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min={0}
                      value={variant.stock}
                      onChange={(e) => updateVariantStock(index, parseInt(e.target.value) || 0)}
                      className="w-24 ml-auto text-right"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg",
        calculatedTotal === totalStock 
          ? "bg-green-500/10 text-green-700 dark:text-green-400" 
          : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
      )}>
        {calculatedTotal === totalStock ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <span className="text-sm">
          Tổng biến thể: <strong>{calculatedTotal}</strong> 
          {calculatedTotal !== totalStock && (
            <> (Khác với tồn kho gốc: {totalStock})</>
          )}
        </span>
      </div>
    </div>
  );
}
