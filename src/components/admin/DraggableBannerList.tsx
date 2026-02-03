import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { GripVertical, Pencil, Trash2, Eye, EyeOff, ExternalLink, Play, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  position: number;
  is_active: boolean;
  page_location: string;
  display_type: string;
  autoplay_interval: number;
  show_navigation: boolean;
  show_indicators: boolean;
}

interface SortableBannerItemProps {
  banner: Banner;
  onEdit: (banner: Banner) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, current: boolean) => void;
  getPageLabel: (value: string) => string;
  getDisplayLabel: (value: string) => string;
}

function SortableBannerItem({
  banner,
  onEdit,
  onDelete,
  onToggleActive,
  getPageLabel,
  getDisplayLabel,
}: SortableBannerItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "transition-all duration-200",
        isDragging && "shadow-2xl scale-[1.02] z-50 bg-card border-accent",
        !banner.is_active && "opacity-60"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="p-2 hover:bg-muted rounded-lg cursor-grab active:cursor-grabbing transition-colors touch-none"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Image Preview */}
          {banner.image_url ? (
            <div className="relative w-32 h-20 rounded-lg overflow-hidden flex-shrink-0 group">
              <img 
                src={banner.image_url} 
                alt={banner.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-charcoal/40 to-transparent" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Eye className="h-5 w-5 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-32 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold truncate">{banner.title}</h3>
              <Badge 
                variant={banner.is_active ? "default" : "secondary"} 
                className="text-xs"
              >
                {banner.is_active ? (
                  <><Eye className="h-3 w-3 mr-1" /> Hiển thị</>
                ) : (
                  <><EyeOff className="h-3 w-3 mr-1" /> Ẩn</>
                )}
              </Badge>
            </div>
            {banner.subtitle && (
              <p className="text-sm text-muted-foreground truncate mb-2">
                {banner.subtitle}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                📍 {getPageLabel(banner.page_location)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {banner.display_type === 'carousel' ? (
                  <><Play className="h-3 w-3 mr-1" /> Carousel</>
                ) : (
                  getDisplayLabel(banner.display_type)
                )}
              </Badge>
              {banner.display_type === 'carousel' && (
                <Badge variant="secondary" className="text-xs">
                  ⏱️ {banner.autoplay_interval / 1000}s
                </Badge>
              )}
              {banner.link_url && (
                <Badge variant="secondary" className="text-xs">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Có liên kết
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Switch
              checked={banner.is_active}
              onCheckedChange={() => onToggleActive(banner.id, banner.is_active)}
            />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onEdit(banner)}
              className="hover:bg-accent/10"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onDelete(banner.id)}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DraggableBannerListProps {
  banners: Banner[];
  onReorder: (banners: Banner[]) => void;
  onEdit: (banner: Banner) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, current: boolean) => void;
  getPageLabel: (value: string) => string;
  getDisplayLabel: (value: string) => string;
}

export function DraggableBannerList({
  banners,
  onReorder,
  onEdit,
  onDelete,
  onToggleActive,
  getPageLabel,
  getDisplayLabel,
}: DraggableBannerListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = banners.findIndex((b) => b.id === active.id);
      const newIndex = banners.findIndex((b) => b.id === over.id);

      const newBanners = arrayMove(banners, oldIndex, newIndex).map((banner, index) => ({
        ...banner,
        position: index,
      }));

      onReorder(newBanners);
    }
  };

  if (banners.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chưa có banner nào</h3>
          <p className="text-muted-foreground">
            Thêm banner mới để bắt đầu tạo slideshow cho trang web của bạn
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={banners.map(b => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {banners.map((banner) => (
            <SortableBannerItem
              key={banner.id}
              banner={banner}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
              getPageLabel={getPageLabel}
              getDisplayLabel={getDisplayLabel}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
