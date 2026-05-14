import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, Lock } from 'lucide-react';

export interface ContactFormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  placeholder: string;
  required: boolean;
  enabled: boolean;
  isBuiltin: boolean; // built-in fields can't be deleted
  options?: string[]; // for select type
  halfWidth?: boolean;
}

export const DEFAULT_FORM_FIELDS: ContactFormField[] = [
  { id: 'name', label: 'Họ tên', type: 'text', placeholder: 'Nguyễn Văn A', required: true, enabled: true, isBuiltin: true, halfWidth: true },
  { id: 'email', label: 'Email', type: 'email', placeholder: 'email@vsm.org.vn', required: true, enabled: true, isBuiltin: true, halfWidth: true },
  { id: 'phone', label: 'Số điện thoại', type: 'tel', placeholder: '0909 123 456', required: false, enabled: true, isBuiltin: true, halfWidth: true },
  { id: 'subject', label: 'Tiêu đề', type: 'text', placeholder: 'Tiêu đề tin nhắn', required: false, enabled: true, isBuiltin: true, halfWidth: true },
  { id: 'message', label: 'Nội dung', type: 'textarea', placeholder: 'Nhập nội dung tin nhắn...', required: true, enabled: true, isBuiltin: true, halfWidth: false },
];

interface Props {
  fields: ContactFormField[];
  onChange: (fields: ContactFormField[]) => void;
}

export function ContactFormFieldManager({ fields, onChange }: Props) {
  const [newFieldLabel, setNewFieldLabel] = useState('');

  const updateField = (index: number, updates: Partial<ContactFormField>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeField = (index: number) => {
    if (fields[index].isBuiltin) return;
    onChange(fields.filter((_, i) => i !== index));
  };

  const addField = () => {
    if (!newFieldLabel.trim()) return;
    const id = 'custom_' + Date.now();
    onChange([
      ...fields,
      {
        id,
        label: newFieldLabel.trim(),
        type: 'text',
        placeholder: '',
        required: false,
        enabled: true,
        isBuiltin: false,
        halfWidth: true,
      },
    ]);
    setNewFieldLabel('');
  };

  const moveField = (from: number, to: number) => {
    if (to < 0 || to >= fields.length) return;
    const updated = [...fields];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cấu hình trường biểu mẫu liên hệ</CardTitle>
          <CardDescription>
            Bật/tắt, thêm trường tùy chỉnh và sắp xếp thứ tự hiển thị trên form liên hệ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                field.enabled ? 'bg-background' : 'bg-muted/50 opacity-60'
              }`}
            >
              {/* Move buttons */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveField(index, index - 1)}
                  className="text-muted-foreground hover:text-foreground text-xs p-0.5"
                  disabled={index === 0}
                >
                  ▲
                </button>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <button
                  onClick={() => moveField(index, index + 1)}
                  className="text-muted-foreground hover:text-foreground text-xs p-0.5"
                  disabled={index === fields.length - 1}
                >
                  ▼
                </button>
              </div>

              {/* Enable toggle */}
              <Switch
                checked={field.enabled}
                onCheckedChange={(checked) => updateField(index, { enabled: checked })}
              />

              {/* Label */}
              <div className="flex-1 min-w-0">
                <Input
                  value={field.label}
                  onChange={(e) => updateField(index, { label: e.target.value })}
                  className="h-8 text-sm font-medium"
                  placeholder="Tên trường"
                />
              </div>

              {/* Type selector */}
              <Select
                value={field.type}
                onValueChange={(v) => updateField(index, { type: v as ContactFormField['type'] })}
              >
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="tel">Điện thoại</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                  <SelectItem value="select">Dropdown</SelectItem>
                </SelectContent>
              </Select>

              {/* Placeholder */}
              <Input
                value={field.placeholder}
                onChange={(e) => updateField(index, { placeholder: e.target.value })}
                className="h-8 text-xs w-36 hidden md:block"
                placeholder="Placeholder..."
              />

              {/* Required toggle */}
              <label className="flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(index, { required: e.target.checked })}
                  className="rounded"
                />
                Bắt buộc
              </label>

              {/* Half width toggle */}
              <label className="flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap hidden lg:flex">
                <input
                  type="checkbox"
                  checked={field.halfWidth ?? false}
                  onChange={(e) => updateField(index, { halfWidth: e.target.checked })}
                  className="rounded"
                />
                ½ rộng
              </label>

              {/* Delete / Lock */}
              {field.isBuiltin ? (
                <Badge variant="outline" className="text-xs gap-1">
                  <Lock className="h-3 w-3" /> Mặc định
                </Badge>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeField(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {/* Select options editor */}
          {fields.map((field, index) =>
            field.type === 'select' && field.enabled ? (
              <div key={`opts-${field.id}`} className="ml-10 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-medium mb-2">Tùy chọn cho "{field.label}" (mỗi dòng 1 giá trị):</p>
                <textarea
                  className="w-full text-sm border rounded-md p-2 bg-background min-h-[60px]"
                  value={(field.options || []).join('\n')}
                  onChange={(e) =>
                    updateField(index, {
                      options: e.target.value.split('\n').filter((s) => s.trim()),
                    })
                  }
                  placeholder="Tùy chọn 1&#10;Tùy chọn 2&#10;Tùy chọn 3"
                />
              </div>
            ) : null
          )}

          {/* Add new field */}
          <div className="flex gap-2 pt-4 border-t">
            <Input
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              placeholder="Tên trường mới (VD: Mã số thuế, Công ty...)"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && addField()}
            />
            <Button onClick={addField} disabled={!newFieldLabel.trim()} className="gap-1">
              <Plus className="h-4 w-4" /> Thêm trường
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
