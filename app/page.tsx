'use client';

import { useState, useEffect } from 'react';
import { Nav } from '@/components/Nav';
import { DiscoverPage } from '@/components/pages/DiscoverPage';
import { DrinksPage } from '@/components/pages/DrinksPage';
import { ImportPage } from '@/components/pages/ImportPage';
import { HistoryPage } from '@/components/pages/HistoryPage';
import { Recipe, Drink } from '@/lib/types';

const HISTORY_KEY = 'pantrify_history';
const DRINKS_HISTORY_KEY = 'pantrify_drinks_history';

export default function Home() {
  const [page, setPage] = useState('discover');
  const [cookedRecipes, setCookedRecipes] = useState<Recipe[]>([]);
  const [madeDrinks, setMadeDrinks] = useState<Drink[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Load both histories from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) setCookedRecipes(JSON.parse(saved));
      const savedDrinks = localStorage.getItem(DRINKS_HISTORY_KEY);
      if (savedDrinks) setMadeDrinks(JSON.parse(savedDrinks));
    } catch {}
    setHistoryLoaded(true);
  }, []);

  // Save recipe history
  useEffect(() => {
    if (!historyLoaded) return;
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(cookedRecipes)); } catch {}
  }, [cookedRecipes, historyLoaded]);

  // Save drinks history
  useEffect(() => {
    if (!historyLoaded) return;
    try { localStorage.setItem(DRINKS_HISTORY_KEY, JSON.stringify(madeDrinks)); } catch {}
  }, [madeDrinks, historyLoaded]);

  const handleCooked = (recipe: Recipe) => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setCookedRecipes(prev => [{ ...recipe, cookedDate: today }, ...prev]);
    setPage('history');
  };

  const handleMadeDrink = (drink: Drink) => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setMadeDrinks(prev => [{ ...drink, cookedDate: today } as Drink & { cookedDate: string }, ...prev]);
    setPage('history');
  };

  const handleDelete = (index: number) => {
    setCookedRecipes(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteDrink = (index: number) => {
    setMadeDrinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    if (!confirm('Clear all cooked recipe history? This will also reset your Smart Grocery list.')) return;
    setCookedRecipes([]);
  };

  const handleClearDrinks = () => {
    if (!confirm('Clear all drink history?')) return;
    setMadeDrinks([]);
  };

  return (
    <>
      <Nav activePage={page} onPageChange={setPage} />
      <div style={{ display: page === 'discover' ? 'block' : 'none' }}>
        <DiscoverPage onCooked={handleCooked} />
      </div>
      <div style={{ display: page === 'drinks' ? 'block' : 'none' }}>
        <DrinksPage onMade={handleMadeDrink} />
      </div>
      <div style={{ display: page === 'import' ? 'block' : 'none' }}>
        <ImportPage onCooked={handleCooked} />
      </div>
      <div style={{ display: page === 'history' ? 'block' : 'none' }}>
        <HistoryPage
          cookedRecipes={cookedRecipes}
          madeDrinks={madeDrinks}
          onClear={handleClear}
          onDelete={handleDelete}
          onClearDrinks={handleClearDrinks}
          onDeleteDrink={handleDeleteDrink}
        />
      </div>
    </>
  );
}
