'use client';

import { useState } from 'react';
import { containsBannedWord } from '@/lib/utils';

interface IngredientInputProps {
  ingredients: string[];
  onChange: (ingredients: string[]) => void;
  placeholder?: string;
  inputId?: string;
}

export function IngredientInput({ ingredients, onChange, placeholder, inputId }: IngredientInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const add = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (containsBannedWord(trimmed)) {
      setError('That ingredient name is not allowed.');
      setTimeout(() => setError(''), 2500);
      setValue('');
      return;
    }
    if (ingredients.includes(trimmed)) { setValue(''); return; }
    onChange(Array.from(ingredients, trimmed));
    setValue('');
    setError('');
  };

  return (
    <div className="search-card">
      <div className="search-row">
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add(); }}
          placeholder={placeholder ?? 'Type an ingredient (e.g. Garlic) and press Enter…'}
        />
        <button className="search-add-btn" onClick={add}>+</button>
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6, fontWeight: 600 }}>{error}</div>}
      {ingredients.length > 0 && (
        <div className="ingredients-pills">
          {ingredients.map((ing, i) => (
            <div key={i} className="ing-pill">
              {ing}
              <button onClick={() => onChange(ingredients.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
