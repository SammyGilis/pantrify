'use client';

import { useState, useRef } from 'react';
import { RecipeModal } from '@/components/RecipeModal';
import { RecipeCard } from '@/components/RecipeCard';
import { callClaude } from '@/hooks/useClaude';
import { useSubscription } from '@/hooks/useSubscription';
import { Recipe, Filters } from '@/lib/types';
import { extractJSONArray, containsBannedWord } from '@/lib/utils';
import { MACRO_PROMPT_RULES } from '@/lib/constants';

const REGIONS: Record<string, string[]> = {
  europe: ['Italian','French','Spanish','Greek','British','German','Portuguese','Scandinavian','Dutch','Polish','Belgian','Swiss'],
  'middle-east': ['Lebanese','Palestinian','Israeli','Turkish','Iranian','Jordanian','Saudi Arabian','Syrian','Iraqi','Yemeni'],
  asia: ['Japanese','Chinese','Korean','Thai','Indian','Vietnamese'],
  africa: ['Ethiopian','Moroccan','Egyptian','Nigerian'],
  americas: ['American','Mexican','Brazilian','Peruvian','Argentinian'],
  oceania: ['Australian','New Zealand'],
};

interface Props { onCooked: (r: Recipe) => void; }

export function DiscoverPage({ onCooked }: Props) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [filters, setFilters] = useState<Filters>({ diets: [] });
  const [openRegion, setOpenRegion] = useState('');
  const [dietOpen, setDietOpen] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paywalled, setPaywalled] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startCheckout } = useSubscription();

  const pill = (label: string, active: boolean, onClick: () => void) => (
    <button key={label} className={`filter-pill${active ? ' active' : ''}`} onClick={onClick}>{label}</button>
  );

  const addIngredient = () => {
    const val = input.trim();
    if (!val || containsBannedWord(val)) { setInput(''); return; }
    if (!ingredients.includes(val)) setIngredients(prev => [...prev, val]);
    setInput('');
  };

  const toggleFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(f => ({ ...f, [key]: f[key] === value ? undefined : value }));
  };

  const toggleDiet = (d: string) => {
    setFilters(f => ({ ...f, diets: f.diets.includes(d) ? f.diets.filter(x => x !== d) : [...f.diets, d] }));
  };

  const clearFilters = () => { setFilters({ diets: [] }); setOpenRegion(''); setDietOpen(false); };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setScanMsg('Scanning photo for ingredients…');

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1];
      try {
        const res = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            feature: 'recipes',
            max_tokens: 800,
            messages: [{
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type: file.type, data: base64 } },
                { type: 'text', text: 'Identify every food ingredient or product in this photo. Return ONLY a JSON array of ingredient names, nothing else. Example: ["chicken breast","garlic","olive oil","pasta"]. Be specific. If you see packaged products, identify the main ingredient.' }
              ]
            }]
          })
        });
        const data = await res.json();
        const text = (data.content || []).filter((c: {type: string}) => c.type === 'text').map((c: {text?: string}) => c.text || '').join('');
        const match = text.replace(/```json|```/g,'').trim().match(/\[[\s\S]*\]/);
        if (match) {
          const found: string[] = JSON.parse(match[0]);
          const newIngs = found.filter(f => f && !ingredients.includes(f) && !containsBannedWord(f));
          setIngredients(prev => [...prev, ...newIngs]);
          setScanMsg(`Found ${newIngs.length} ingredient${newIngs.length !== 1 ? 's' : ''}!`);
          setTimeout(() => setScanMsg(''), 3000);
        }
      } catch { setScanMsg('Could not scan photo. Try again.'); setTimeout(() => setScanMsg(''), 3000); }
      finally { setScanning(false); }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const findRecipes = async () => {
    if (!ingredients.length) return;
    setLoading(true); setError(''); setPaywalled(false); setRecipes([]);

    const servings = filters.servings ?? 4;
    const filterParts: string[] = [];
    if (filters.country) filterParts.push(`Cuisine must be: ${filters.country}`);
    else if (filters.region) filterParts.push(`Cuisine must be from region: ${filters.region}`);
    if (filters.meal) filterParts.push(`Meal type must be: ${filters.meal}`);
    if (filters.cookTime) filterParts.push(`Cook time must be ${filters.cookTime} or under`);
    if (filters.diets.length) filterParts.push(`Must meet ALL dietary requirements: ${filters.diets.join(', ')}`);
    if (filters.ingCount) filterParts.push(`Total ingredient count: ${filters.ingCount}`);
    if (filters.difficulty) filterParts.push(`Difficulty must be: ${filters.difficulty}`);
    filterParts.push(`Each recipe must be sized for ${servings} serving${servings !== 1 ? 's' : ''}`);
    const filterBlock = filterParts.length ? 'FILTERS TO FOLLOW:\n' + filterParts.map((f, i) => `${i+1}. ${f}`).join('\n') : '';

    const prompt = `You are a recipe assistant and nutritionist. Generate as many unique recipes as possible (aim for 20, minimum 10).

USER'S INGREDIENTS: ${ingredients.join(', ')}

${filterBlock}

INSTRUCTIONS:
- Use SOME of the user's ingredients — pick whichever work well together.
- You may add common ingredients to complete the recipe.
- Every recipe must follow ALL filters above.
- Every ingredient MUST include an exact measurement scaled for ${servings} serving${servings !== 1 ? 's' : ''}.
- matchingIngredients: only ingredients from the user's list that you used.
- Sort from most user ingredients used to fewest.
- When a recipe uses olive oil, use exactly 1 tbsp.
- ${MACRO_PROMPT_RULES}

Return ONLY a valid JSON array, no markdown:
[{"title":"Name","cuisine":"Italian","meal":"Dinner","difficulty":"Easy","time":"25 min","timeNum":25,"servings":${servings},"desc":"One sentence.","diet":["VEGETARIAN"],"source":"","sourceType":"","macros":{"calories":520,"protein":24,"carbs":68,"fat":14},"matchingIngredients":["garlic"],"ingredients":["3 cloves garlic minced","200g dry pasta","1 tbsp olive oil"],"steps":["Step 1.","Step 2."]}]`;

    try {
      const data = await callClaude([{ role: 'user', content: prompt }], { maxTokens: 8000, feature: 'recipes' });
      const text = (data.content || []).map((c: { text?: string }) => c.text || '').join('');
      const arr = extractJSONArray(text);
      if (!arr) throw new Error('No recipes found');
      const enriched: Recipe[] = (arr as Recipe[])
        .filter(r => r && r.title && Array.isArray(r.ingredients))
        .map((r, i) => {
          const ingText = r.ingredients.join(' ').toLowerCase();
          const matched = ingredients.filter(ing => ingText.includes(ing.toLowerCase()));
          return { ...r, id: `ai-${Date.now()}-${i}`, matchCount: matched.length, matchRatio: matched.length / (r.ingredients.length || 1), matchingIngredients: matched };
        })
        .sort((a, b) => (b.matchCount! - a.matchCount!) || (b.matchRatio! - a.matchRatio!));
      setRecipes(enriched);
    } catch (err: unknown) {
      const e = err as { code?: string; status?: number; message?: string };
      if (e.code === 'free_limit_reached' || e.status === 402) setPaywalled(true);
      else setError(e.message || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-badge">✦ Zero-Waste Cooking, Simplified</div>
          <h1>What&apos;s in your <span>pantry?</span></h1>
          <p>Type your ingredients, or scan a photo of your fridge or pantry.</p>
        </div>
      </div>

      <div className="search-section">
        <div className="search-card">
          <div className="search-row">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Type an ingredient and press Enter…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addIngredient()}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              title="Scan photo for ingredients"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 8, color: scanning ? 'var(--green-dark)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', transition: 'color 0.15s', flexShrink: 0 }}
            >
              {scanning ? (
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
            <button className="search-add-btn" onClick={addIngredient}>+</button>
          </div>
          {scanMsg && <div style={{ fontSize: 12, color: 'var(--green-dark)', fontWeight: 600, marginTop: 8, paddingLeft: 2 }}>✓ {scanMsg}</div>}
          {ingredients.length > 0 && (
            <div className="ingredients-pills">
              {ingredients.map((ing, i) => (
                <span key={i} className="ing-pill">
                  {ing}
                  <button onClick={() => setIngredients(prev => prev.filter((_, j) => j !== i))}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="filters-section">
        <div className="filters-card">
          <div className="filters-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
            Filter Recipes
          </div>

          <div className="filter-group">
            <div className="filter-label">Meal Type</div>
            <div className="filter-pills">
              {['Breakfast','Lunch','Dinner','Snack','Dessert'].map(m => pill(m, filters.meal === m, () => toggleFilter('meal', m)))}
            </div>
          </div>
          <hr className="filter-sep" />

          <div className="filter-group">
            <div className="filter-label">Cuisine</div>
            <div className="cuisine-regions">
              {Object.keys(REGIONS).map(region => (
                <button key={region} className={`region-pill${openRegion === region ? ' active' : ''}`}
                  onClick={() => { setOpenRegion(openRegion === region ? '' : region); setFilters(f => ({ ...f, region: openRegion === region ? undefined : region, country: undefined })); }}>
                  {region.charAt(0).toUpperCase() + region.slice(1).replace('-', ' ')}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
              ))}
            </div>
            {openRegion && (
              <div className="sub-region-wrap open">
                <div className="sub-region-inner">
                  <div className="sub-region-label">{openRegion.replace('-', ' ')} — Pick a Country</div>
                  <div className="filter-pills">
                    {REGIONS[openRegion].map(c => pill(c, filters.country === c, () => setFilters(f => ({ ...f, country: f.country === c ? undefined : c }))))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <hr className="filter-sep" />

          <div className="filter-group">
            <div className="filter-label">Cook Time</div>
            <div className="filter-pills">
              {['10 Min','20 Min','30 Min','45 Min','60 Min','90 Min','2+ Hrs'].map(t => pill(t, filters.cookTime === t, () => toggleFilter('cookTime', t)))}
            </div>
          </div>
          <hr className="filter-sep" />

          <div className="filter-group">
            <div className="filter-label">Ingredients Needed</div>
            <div className="filter-pills">
              {['3–6','7–9','10+'].map(t => pill(t, filters.ingCount === t, () => toggleFilter('ingCount', t)))}
            </div>
          </div>
          <hr className="filter-sep" />

          <div className="filter-group">
            <div className="filter-label">Difficulty</div>
            <div className="filter-pills">
              {['Easy','Intermediate','Advanced'].map(d => pill(d, filters.difficulty === d, () => toggleFilter('difficulty', d)))}
            </div>
          </div>
          <hr className="filter-sep" />

          <div className="filter-group">
            <div className="filter-label">Servings</div>
            <div className="filter-pills">
              {[1,2,4,6,8,10].map(n => pill(n === 10 ? '10+' : String(n), filters.servings === n, () => setFilters(f => ({ ...f, servings: f.servings === n ? undefined : n }))))}
            </div>
          </div>
          <hr className="filter-sep" />

          <div className="filter-group">
            <button className="filter-dropdown-header" onClick={() => setDietOpen(!dietOpen)} aria-expanded={dietOpen}>
              <span className="filter-label" style={{ marginBottom: 0 }}>Dietary Goals</span>
              {filters.diets.length > 0 && <span className="filter-dropdown-meta visible">{filters.diets.length}</span>}
              <svg className="filter-dropdown-chevron" style={{ transform: dietOpen ? 'rotate(180deg)' : undefined }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            {dietOpen && (
              <div className="filter-pills" style={{ paddingTop: 10 }}>
                {['Low Fat','High Protein','Low Calorie','Low Carb','Vegan','Vegetarian','Gluten-Free','Dairy-Free','Keto','Paleo'].map(d => pill(d, filters.diets.includes(d), () => toggleDiet(d)))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="find-btn-wrap">
        <button className="find-btn" onClick={findRecipes} disabled={loading || !ingredients.length}>
          {loading ? '⏳ Searching…' : '🍽 Find Delicious Meals'}
        </button>
        <button className="clear-filters-btn" onClick={clearFilters}>Clear Filters</button>
      </div>

      {paywalled && (
        <div style={{ maxWidth: 700, margin: '0 auto 16px', padding: '0 24px' }}>
          <div style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const, color: 'white' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🔒 Free limit reached</div>
              <div style={{ fontSize: 13, opacity: 0.85 }}>You&apos;ve used your 3 free searches this week. Upgrade for unlimited access.</div>
            </div>
            <button onClick={startCheckout} style={{ background: 'white', color: '#6d28d9', border: 'none', borderRadius: 99, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const }}>✦ Upgrade to Pro</button>
          </div>
        </div>
      )}

      {(loading || recipes.length > 0 || error) && (
        <div className="results-section">
          <div className="results-header">
            <div className="results-header-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
            </div>
            Suggested For You
          </div>
          <div className="results-grid">
            {loading && <div style={{ gridColumn: '1/-1' }}><div className="loading-spinner"><div className="spinner" /><div className="loading-text">Finding recipes…</div></div></div>}
            {!loading && error && <div style={{ gridColumn: '1/-1' }} className="empty-state"><div className="empty-state-icon">⚠️</div><p>{error}</p></div>}
            {!loading && !error && recipes.length === 0 && <div style={{ gridColumn: '1/-1' }} className="empty-state"><div className="empty-state-icon">🔍</div><p>No recipes found. Try different ingredients or loosen your filters.</p></div>}
            {recipes.map(r => <RecipeCard key={r.id} recipe={r} onClick={() => setSelectedRecipe(r)} />)}
          </div>
        </div>
      )}

      {selectedRecipe && (
        <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} onCooked={r => { setSelectedRecipe(null); onCooked(r); }} />
      )}
    </>
  );
}
