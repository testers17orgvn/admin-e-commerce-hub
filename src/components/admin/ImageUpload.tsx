import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}

export function ImageUpload({ value, onChange, folder = 'general', label = 'Hình ảnh' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file tối đa 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      onChange(publicUrl);
      toast.success('Upload thành công');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Lỗi upload ảnh');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      
      {value ? (
        <div className="relative group">
          <img 
            src={value} 
            alt="Preview" 
            className="w-full h-40 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            id={`upload-${folder}`}
          />
          
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">Đang upload...</span>
            </div>
          ) : (
            <label 
              htmlFor={`upload-${folder}`}
              className="flex flex-col items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <Upload className="h-8 w-8" />
              <span className="text-sm">Click để upload ảnh</span>
              <span className="text-xs">PNG, JPG, WEBP (max 5MB)</span>
            </label>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setShowUrlInput(!showUrlInput)}
        >
          <ImageIcon className="h-3 w-3 mr-1" />
          {showUrlInput ? 'Ẩn URL' : 'Hoặc nhập URL'}
        </Button>
      </div>

      {showUrlInput && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://store.vsm.org.vn/image.jpg"
          className="text-sm"
        />
      )}
    </div>
  );
}
