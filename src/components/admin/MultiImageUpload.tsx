import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, X, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder: string;
  label?: string;
  maxImages?: number;
}

export function MultiImageUpload({ value = [], onChange, folder, label = 'Hình ảnh', maxImages = 10 }: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - value.length;
    if (remainingSlots <= 0) {
      toast.error(`Tối đa ${maxImages} hình ảnh`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        if (!file.type.startsWith('image/')) {
          toast.error('Chỉ chấp nhận file ảnh');
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error('File quá lớn (tối đa 5MB)');
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { error } = await supabase.storage.from('images').upload(filePath, file);
        if (error) {
          toast.error('Lỗi upload: ' + error.message);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.length > 0) {
        onChange([...value, ...uploadedUrls]);
        toast.success(`Đã upload ${uploadedUrls.length} hình`);
      }
    } catch (error) {
      toast.error('Lỗi upload');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = value.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">{label}</label>
      
      {/* Image Grid */}
      <div className="grid grid-cols-4 gap-3">
        {value.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted group">
            <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
            {index === 0 && (
              <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                Chính
              </span>
            )}
          </div>
        ))}
        
        {/* Add Button */}
        {value.length < maxImages && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 bg-muted/50">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Plus className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Thêm ảnh</span>
              </>
            )}
          </label>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        {value.length}/{maxImages} hình • Ảnh đầu tiên là ảnh chính
      </p>
    </div>
  );
}
