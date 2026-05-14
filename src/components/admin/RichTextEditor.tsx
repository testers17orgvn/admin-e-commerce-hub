import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Palette,
  Undo,
  Redo,
  Type,
  Minus,
  Upload,
  Video,
  Loader2,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
];

const HIGHLIGHT_COLORS = [
  '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ff0000', '#0000ff',
  '#ffc0cb', '#ffa500', '#98fb98', '#87ceeb', '#dda0dd', '#f0e68c',
];

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'rounded-lg max-w-full' },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: { class: 'rounded-lg overflow-hidden my-4' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
    }
  };

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
    }
  };

  const addYoutube = () => {
    if (youtubeUrl) {
      editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
      setYoutubeUrl('');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Chỉ chấp nhận file ảnh'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Ảnh tối đa 10MB'); return; }

    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `blogs/content/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { error } = await supabase.storage.from('images').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
      editor.chain().focus().setImage({ src: publicUrl }).run();
      toast.success('Đã chèn ảnh');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi upload ảnh');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) { toast.error('Chỉ chấp nhận file video'); return; }
    if (file.size > 100 * 1024 * 1024) { toast.error('Video tối đa 100MB'); return; }

    setUploadingVideo(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `blogs/videos/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { error } = await supabase.storage.from('images').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
      // Insert as HTML video tag
      editor.chain().focus().insertContent(
        `<div class="my-4"><video controls class="rounded-lg w-full max-w-2xl mx-auto" src="${publicUrl}"></video></div>`
      ).run();
      toast.success('Đã chèn video');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi upload video');
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
      <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />

      {/* Toolbar */}
      <div className="border-b p-2 bg-muted/30 flex flex-wrap gap-1 items-center">
        {/* Undo/Redo */}
        <Toggle size="sm" pressed={false} onPressedChange={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={false} onPressedChange={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Headings */}
        <Toggle size="sm" pressed={editor.isActive('heading', { level: 1 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('heading', { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('heading', { level: 3 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('paragraph')} onPressedChange={() => editor.chain().focus().setParagraph().run()}>
          <Type className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text formatting */}
        <Toggle size="sm" pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('underline')} onPressedChange={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('strike')} onPressedChange={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="h-4 w-4" />
        </Toggle>

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Palette className="h-4 w-4" /></Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2">
            <p className="text-xs font-medium mb-2">Màu chữ</p>
            <div className="grid grid-cols-10 gap-1">
              {COLORS.map((color) => (
                <button key={color} className="w-5 h-5 rounded border border-muted-foreground/20 hover:scale-110 transition-transform" style={{ backgroundColor: color }} onClick={() => editor.chain().focus().setColor(color).run()} />
              ))}
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => editor.chain().focus().unsetColor().run()}>Xóa màu</Button>
          </PopoverContent>
        </Popover>

        {/* Highlight */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Highlighter className="h-4 w-4" /></Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <p className="text-xs font-medium mb-2">Highlight</p>
            <div className="grid grid-cols-6 gap-1">
              {HIGHLIGHT_COLORS.map((color) => (
                <button key={color} className="w-6 h-6 rounded border border-muted-foreground/20 hover:scale-110 transition-transform" style={{ backgroundColor: color }} onClick={() => editor.chain().focus().toggleHighlight({ color }).run()} />
              ))}
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => editor.chain().focus().unsetHighlight().run()}>Xóa highlight</Button>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <Toggle size="sm" pressed={editor.isActive({ textAlign: 'left' })} onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive({ textAlign: 'center' })} onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive({ textAlign: 'right' })} onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive({ textAlign: 'justify' })} onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}>
          <AlignJustify className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
        <Toggle size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Quote & Code & HR */}
        <Toggle size="sm" pressed={editor.isActive('blockquote')} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('codeBlock')} onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={false} onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Link */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={editor.isActive('link') ? 'secondary' : 'ghost'} size="sm" className="h-8 w-8 p-0">
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3">
            <p className="text-sm font-medium mb-2">Chèn liên kết</p>
            <div className="flex gap-2">
              <Input placeholder="https://store.vsm.org.vn" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addLink()} />
              <Button size="sm" onClick={addLink}>Thêm</Button>
            </div>
            {editor.isActive('link') && (
              <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => editor.chain().focus().unsetLink().run()}>Xóa liên kết</Button>
            )}
          </PopoverContent>
        </Popover>

        {/* Image - URL + Upload */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3">
            <p className="text-sm font-medium mb-2">Chèn hình ảnh</p>
            <div className="space-y-3">
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}>
                <Upload className="h-4 w-4" />
                {uploadingImage ? 'Đang upload...' : 'Upload từ máy'}
              </Button>
              <div className="flex gap-2">
                <Input placeholder="Hoặc nhập URL ảnh" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addImage()} />
                <Button size="sm" onClick={addImage}>Thêm</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Video Upload */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {uploadingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3">
            <p className="text-sm font-medium mb-2">Chèn video</p>
            <div className="space-y-3">
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => videoInputRef.current?.click()} disabled={uploadingVideo}>
                <Upload className="h-4 w-4" />
                {uploadingVideo ? 'Đang upload...' : 'Upload video từ máy'}
              </Button>
              <p className="text-xs text-muted-foreground">MP4, WebM, MOV (tối đa 100MB)</p>
            </div>
          </PopoverContent>
        </Popover>

        {/* YouTube */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <YoutubeIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3">
            <p className="text-sm font-medium mb-2">Chèn video YouTube</p>
            <div className="flex gap-2">
              <Input placeholder="https://youtube.com/watch?v=..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addYoutube()} />
              <Button size="sm" onClick={addYoutube}>Thêm</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}