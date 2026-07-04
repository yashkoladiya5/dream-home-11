import { useState } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagInput({ tags, onChange, placeholder = 'Add tag...' }: TagInputProps) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput('');
    }
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 min-h-[42px] focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-brand-600/10 px-2.5 py-1 text-sm font-medium text-brand-400 border border-brand-500/20"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="ml-0.5 rounded-full p-0.5 text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder-slate-500 outline-none"
      />
    </div>
  );
}
