'use client';

import { useState, useEffect } from 'react';
import { Nav } from '@/components/Nav';
import { DiscoverPage } from '@/components/pages/DiscoverPage';
import { DrinksPage } from '@/components/pages/DrinksPage';
import { ImportPage } from '@/components/pages/ImportPage';
import { HistoryPage } from '@/components/pages/HistoryPage';
import { Recipe } from '@/lib/types';

const HISTORY_KEY = 'pantrify_history';

export default function Home() {
  const [page, setPage] = useState('discover');
  const [cookedRecipes, setCookedRecipes] = useState<Recipe[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) setCookedRecipes(JSON.parse(saved));
    } catch {}
    setHistoryLoaded(true);
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (!historyLoaded) return;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(cookedRecipes));
    } catch {}
  }, [cookedRecipes, historyLoaded]);

  const handleCooked = (recipe: Recipe) => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setCookedRecipes(prev => [{ ...recipe, cookedDate: today }, ...prev]);
    setPage('history');
  };

  const handleClear = () => {
    if (!confirm('Clear all cooked recipe history? This will also reset your Smart Grocery list.')) return;
    setCookedRecipes([]);
  };

  return (
    <>
      <Nav activePage={page} onPageChange={setPage} />

      {/* Keep all pages mounted but hide inactive ones — preserves state when switching tabs */}
      <div style={{ display: page === 'discover' ? 'block' : 'none' }}>
        <DiscoverPage onCooked={handleCooked} />
      </div>
      <div style={{ display: page === 'drinks' ? 'block' : 'none' }}>
        <DrinksPage />
      </div>
      <div style={{ display: page === 'import' ? 'block' : 'none' }}>
        <ImportPage onCooked={handleCooked} />
      </div>
      <div style={{ display: page === 'history' ? 'block' : 'none' }}>
        <HistoryPage
          cookedRecipes={cookedRecipes}
          onClear={handleClear}
        />
      </div>
    </>
  );
}
