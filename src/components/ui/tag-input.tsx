"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string[];
  onChange: (tags: string[]) => void;
  containerClassName?: string;
}

export const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  ({ value, onChange, className, containerClassName, ...props }, ref) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const newTag = inputValue.trim();
        if (newTag && !value.includes(newTag)) {
          onChange([...value, newTag]);
        }
        setInputValue('');
      } else if (e.key === 'Backspace' && inputValue === '') {
        e.preventDefault();
        const newTags = value.slice(0, -1);
        onChange(newTags);
      }
    };

    const removeTag = (tagToRemove: string) => {
      onChange(value.filter(tag => tag !== tagToRemove));
    };

    return (
      <div className={cn("tag-input-container", containerClassName)}>
        {value.map((tag) => (
          <span key={tag} className="tag">
            {tag}
            <X className="tag-remove" onClick={() => removeTag(tag)} />
          </span>
        ))}
        <input
          ref={ref}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn("tag-input", className)}
          {...props}
        />
      </div>
    );
  }
);

TagInput.displayName = 'TagInput';