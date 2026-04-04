import React from 'react';
import { useState, useId } from 'react';
import type { KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';
import { useAppStore } from '../store';
import { Button } from '@base-ui/react/button';
import { Field } from '@base-ui/react/field';

export const AddTask = () => {
  const [title, setTitle] = useState('');
  const inputId = useId();
  const addTask = useAppStore((state) => state.addTask);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (trimmed) {
      addTask(trimmed);
      setTitle('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const canSubmit = title.trim().length > 0;

  return (
    <form 
      onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
      className="flex gap-3"
    >
      <Field.Root className="flex-1">
        <Field.Label htmlFor={inputId} className="sr-only">
          Task title
        </Field.Label>
        <input
          id={inputId}
          type="text"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a new task..."
          className="
            w-full bg-bg-card border border-border rounded-xl px-4 py-4 
            text-text-primary placeholder:text-text-muted
            focus:outline-none focus:border-accent-green focus:ring-2 focus:ring-accent-green/50
            transition-all duration-200 min-h-[56px] text-base
          "
        />
      </Field.Root>
      
      <Button
        type="submit"
        disabled={!canSubmit}
        className="
          px-5 py-4 rounded-xl font-semibold transition-all duration-200 
          min-h-[56px] min-w-[56px]
          bg-accent-green hover:bg-accent-green-hover 
          disabled:bg-bg-hover disabled:text-text-muted
          text-white flex items-center justify-center
          active:scale-95
        "
        aria-label="Add task"
      >
        <Plus className="w-5 h-5" aria-hidden="true" />
      </Button>
    </form>
  );
};
