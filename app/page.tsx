'use client';

import { useState } from 'react';
import { Nav } from '@/components/Nav';
import { DiscoverPage } from '@/components/pages/DiscoverPage';
import { DrinksPage } from '@/components/pages/DrinksPage';
import { ImportPage } from '@/components/pages/ImportPage';
import { HistoryPage } from '@/components/pages/HistoryPage';
import { Recipe } from '@/lib/types';

export default function Home() {
  const [page, setPage] = useState('discover');
  const [cookedRecipes, setCookedRecipes] = useState<Recipe[]>([]);

  const handleCooked = (recipe: Recipe) => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setCookedRecipes(prev => [{ ...recipe, cookedDate: today }, ...prev]);
    setPage('history');
  };

  return (
    <>
      <Nav activePage={page} onPageChange={setPage} />
      {page === 'discover' && <DiscoverPage onCooked={handleCooked} />}
      {page === 'drinks' && <DrinksPage />}
      {page === 'import' && <ImportPage onCooked={handleCooked} />}
      {page === 'history' && (
        <HistoryPage
          cookedRecipes={cookedRecipes}
          onClear={() => setCookedRecipes([])}
        />
      )}
    </>
  );
}
