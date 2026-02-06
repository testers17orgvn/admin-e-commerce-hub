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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { GripVertical, Layout, Sparkles, Grid, Mail, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { HomepageSection, useHomepageSections } from '@/hooks/useHomepageSections';

const sectionIcons: Record<string, React.ReactNode> = {
  hero: <Layout className="h-5 w-5 text-accent" />,
  featured: <Sparkles className="h-5 w-5 text-accent" />,
  categories: <Grid className="h-5 w-5 text-accent" />,
  newsletter: <Mail className="h-5 w-5 text-accent" />,
};

interface SortableSectionProps {
  section: HomepageSection;
  onToggle: (id: string, enabled: boolean) => void;
}

function SortableSection({ section, onToggle }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 rounded-lg border bg-card ${
        isDragging ? 'shadow-lg ring-2 ring-accent opacity-90' : ''
      } ${!section.enabled ? 'opacity-50' : ''}`}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>

      <div className="flex items-center gap-3 flex-1">
        {sectionIcons[section.id]}
        <span className="font-medium">{section.name}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {section.enabled ? 'Hiển thị' : 'Ẩn'}
        </span>
        <Switch
          checked={section.enabled}
          onCheckedChange={(checked) => onToggle(section.id, checked)}
        />
      </div>
    </div>
  );
}

export function HomepageSectionManager() {
  const { sections, saveSections } = useHomepageSections();
  const [localSections, setLocalSections] = useState<HomepageSection[]>(sections);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          order: index,
        }));
        return newItems;
      });
      setHasChanges(true);
    }
  };

  const handleToggle = (id: string, enabled: boolean) => {
    setLocalSections((items) =>
      items.map((item) => (item.id === id ? { ...item, enabled } : item))
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await saveSections(localSections);
    if (success) {
      toast.success('Đã lưu thứ tự section');
      setHasChanges(false);
    } else {
      toast.error('Lỗi khi lưu');
    }
    setSaving(false);
  };

  const handleReset = () => {
    setLocalSections(sections);
    setHasChanges(false);
  };

  // Update local when original changes
  if (JSON.stringify(sections) !== JSON.stringify(localSections) && !hasChanges) {
    setLocalSections(sections);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Sắp xếp Section Trang chủ
            </CardTitle>
            <CardDescription>
              Kéo thả để thay đổi thứ tự hiển thị các section trên trang chủ
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Hoàn tác
              </Button>
            )}
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={saving || !hasChanges}
              className="bg-accent hover:bg-accent/90"
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Đang lưu...' : 'Lưu thứ tự'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localSections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {localSections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p>💡 <strong>Mẹo:</strong> Kéo thả các section để thay đổi thứ tự. Bạn cũng có thể ẩn/hiện từng section.</p>
        </div>
      </CardContent>
    </Card>
  );
}
