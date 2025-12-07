import { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
  colorMode?: boolean;
}

const PRESET_COLORS = [
  { name: 'Đỏ', value: '#EF4444' },
  { name: 'Xanh dương', value: '#3B82F6' },
  { name: 'Xanh lá', value: '#22C55E' },
  { name: 'Vàng', value: '#EAB308' },
  { name: 'Tím', value: '#A855F7' },
  { name: 'Hồng', value: '#EC4899' },
  { name: 'Cam', value: '#F97316' },
  { name: 'Đen', value: '#000000' },
  { name: 'Trắng', value: '#FFFFFF' },
  { name: 'Xám', value: '#6B7280' },
  { name: 'Nâu', value: '#92400E' },
  { name: 'Navy', value: '#1E3A5F' },
];

export function TagInput({ value = [], onChange, placeholder = 'Nhập và Enter...', label, colorMode = false }: TagInputProps) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput('');
    }
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addPresetColor = (colorName: string) => {
    if (!value.includes(colorName)) {
      onChange([...value, colorName]);
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      
      {/* Tags Display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag, index) => {
            const color = colorMode ? PRESET_COLORS.find(c => c.name === tag) : null;
            return (
              <Badge 
                key={index} 
                variant="secondary" 
                className="gap-1 pr-1"
                style={color ? { backgroundColor: color.value, color: color.value === '#FFFFFF' || color.value === '#EAB308' ? '#000' : '#fff' } : {}}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Color Presets */}
      {colorMode && (
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.filter(c => !value.includes(c.name)).map((color) => (
            <button
              key={color.name}
              type="button"
              onClick={() => addPresetColor(color.name)}
              className="w-6 h-6 rounded-full border-2 border-border hover:scale-110 transition-transform"
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
      </div>
    </div>
  );
}
