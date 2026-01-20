import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Video, Upload, Link, Loader2, X, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}

export function VideoUpload({ value, onChange, folder = 'videos', label = 'Video review sản phẩm' }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<string>(value?.includes('supabase') ? 'upload' : 'url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Vui lòng chọn file video');
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video không được vượt quá 100MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await supabase.storage
        .from('product-videos')
        .upload(filePath, file);

      clearInterval(progressInterval);

      if (error) {
        // If bucket doesn't exist, try general bucket
        const { data: data2, error: error2 } = await supabase.storage
          .from('products')
          .upload(filePath, file);

        if (error2) {
          throw error2;
        }

        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);
        
        setUploadProgress(100);
        onChange(urlData.publicUrl);
        toast.success('Upload video thành công!');
      } else {
        const { data: urlData } = supabase.storage
          .from('product-videos')
          .getPublicUrl(filePath);
        
        setUploadProgress(100);
        onChange(urlData.publicUrl);
        toast.success('Upload video thành công!');
      }
    } catch (error: any) {
      toast.error('Lỗi upload video: ' + error.message);
    }

    setUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearVideo = () => {
    onChange('');
  };

  const renderPreview = () => {
    if (!value) return null;

    const youtubeId = getYouTubeId(value);
    
    if (youtubeId) {
      return (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={clearVideo}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
        <video
          src={value}
          controls
          className="w-full h-full"
        />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8"
          onClick={clearVideo}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Video className="h-4 w-4 text-accent" />
        {label}
      </Label>

      {value ? (
        renderPreview()
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload từ máy
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-2">
              <Link className="h-4 w-4" />
              Nhập URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-3">
            <div className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              uploading ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
            )}>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              
              {uploading ? (
                <div className="space-y-3">
                  <Loader2 className="h-10 w-10 mx-auto text-accent animate-spin" />
                  <div className="text-sm text-muted-foreground">
                    Đang upload... {uploadProgress}%
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-full w-fit mx-auto">
                    <Play className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Kéo thả video hoặc click để chọn</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      MP4, WebM, MOV (tối đa 100MB)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Chọn video
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="url" className="mt-3 space-y-2">
            <Input
              placeholder="https://www.youtube.com/watch?v=... hoặc URL video trực tiếp"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Hỗ trợ YouTube, Vimeo hoặc link video trực tiếp (.mp4)
            </p>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
