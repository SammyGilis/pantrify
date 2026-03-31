'use client';

import { useState } from 'react';
import { IngredientInput } from '@/components/IngredientInput';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeModal } from '@/components/RecipeModal';
import { PaywallBanner } from '@/components/PaywallBanner';
import { callClaude } from '@/hooks/useClaude';
import { Recipe, Filters } from '@/lib/types';
import { extractJSONArray } from '@/lib/utils';
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
  const [filters, setFilters] = useState<Filters>({ diets: [] });
  const [openRegion, setOpenRegion] = useState('');
  const [dietOpen, setDietOpen] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paywalled, setPaywalled] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const toggleFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(f => ({ ...f, [key]: f[key] === value ? undefined : value }));
  };

  const toggleDiet = (d: string) => {
    setFilters(f => ({
      ...f,
      diets: f.diets.includes(d) ? f.diets.filter(x => x !== d) : [...f.diets, d],
    }));
  };

  const clearFilters = () => {
    setFilters({ diets: [] });
    setOpenRegion('');
    setDietOpen(false);
  };

  const findRecipes = async () => {
    if (!ingredients.length) return;
    setLoading(true);
    setError('');
    setPaywalled(false);
    setRecipes([]);

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

    const filterBlock = filterParts.length
      ? 'FILTERS TO FOLLOW:\n' + filterParts.map((f, i) => `${i + 1}. ${f}`).join('\n')
      : '';

    const prompt = `You are a recipe assistant and nutritionist. Generate as many unique recipes as possible (aim for 20, minimum 10).

USER'S INGREDIENTS: ${ingredients.join(', ')}

${filterBlock}

INSTRUCTIONS:
- Use SOME of the user's ingredients — not necessarily all. Pick whichever work well for each dish.
- You may add other common ingredients to complete the recipe.
- Every recipe must follow ALL filters above.
- Every ingredient MUST include an exact measurement scaled for ${servings} serving${servings !== 1 ? 's' : ''}.
- matchingIngredients: only ingredients from the user's list that you used.
- Sort from most user ingredients used to fewest.
- When a recipe uses olive oil, use exactly 1 tbsp.
- ${MACRO_PROMPT_RULES}

Return ONLY a valid JSON array, no markdown:
[{"title":"Name","cuisine":"Italian","meal":"Dinner","difficulty":"Easy","time":"25 min","timeNum":25,"servings":${servings},"desc":"One sentence.","diet":["VEGETARIAN"],"source":"@handle","sourceType":"instagram","macros":{"calories":520,"protein":24,"carbs":68,"fat":14},"matchingIngredients":["garlic"],"ingredients":["3 cloves garlic, minced","200g pasta","1 tbsp olive oil"],"steps":["Step 1.","Step 2."]}]`;

    try {
      const data = await callClaude([{ role: 'user', content: prompt }], { maxTokens: 8000 });
      const text = (data.content || []).map((c: { text?: string }) => c.text || '').join('');
      const arr = extractJSONArray(text);
      if (!arr) throw new Error('No recipes found in response');

      const enriched: Recipe[] = arr
        .filter((r: unknown): r is Recipe => {
          if (typeof r !== 'object' || r === null) return false;
          const rec = r as Record<string, unknown>;
          return typeof rec.title === 'string' && Array.isArray(rec.ingredients);
        })
        .map((r: Recipe, i: number) => {
          const ingText = (r.ingredients || []).join(' ').toLowerCase();
          const matched = ingredients.filter(ing => ingText.includes(ing.toLowerCase()));
          return {
            ...r,
            id: `ai-${Date.now()}-${i}`,
            matchCount: matched.length,
            matchRatio: matched.length / ((r.ingredients || []).length || 1),
            matchingIngredients: matched,
          };
        })
        .sort((a: Recipe, b: Recipe) => (b.matchCount! - a.matchCount!) || (b.matchRatio! - a.matchRatio!));

      setRecipes(enriched);
    } catch (err: unknown) {
      if (err instanceof Error && (err as Error & { code?: string }).code === 'free_limit_reached') {
        setPaywalled(true);
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const pill = (label: string, active: boolean, onClick: () => void) => (
    <button key={label} className={`filter-pill${active ? ' active' : ''}`} onClick={onClick}>{label}</button>
  );

  return (
    <>
      {/* Hero */}
      <div className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-badge">✦ Zero-Waste Cooking, Simplified</div>
          <h1>What&apos;s in your <span>pantry?</span></h1>
          <p>Type your ingredients and we&apos;ll find recipes that use what you already have.</p>
        </div>
      </div>

      {/* Ingredient Input */}
      <div className="search-section">
        <IngredientInput ingredients={ingredients} onChange={setIngredients} />
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-card">
          <div className="filters-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
            Filter Recipes
          </div>

          {/* Meal Type */}
          <div className="filter-group">
            <div className="filter-label">Meal Type</div>
            <div className="filter-pills">
              {['Breakfast','Lunch','Dinner','Snack','Dessert'].map(m => pill(m, filters.meal === m, () => toggleFilter('meal', m)))}
            </div>
          </div>
          <hr className="filter-sep" />

          {/* Cuisine */}
          <div className="filter-group">
            <div className="filter-label">Cuisine</div>
            <div className="cuisine-regions">
              {Object.keys(REGIONS).map(region => (
                <button
                  key={region}
                  className={`region-pill${openRegion === region ? ' active' : ''}`}
                  onClick={() => { setOpenRegion(openRegion === region ? '' : region); setFilters(f => ({ ...f, region: openRegion === region ? undefined : region, country: undefined })); }}
                >
                  {region.charAt(0).toUpperCase() + region.slice(1).replace('-', ' ')}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
              ))}
            </div>
            {openRegion && (
              <div className="sub-region-wrap open">
                <div className="sub-region">
                  <div className="sub-region-inner">
                    <div className="sub-region-label">{openRegion.replace('-', ' ')} — Pick a Country</div>
                    <div className="filter-pills">
                      {REGIONS[openRegion].map(c => pill(c, filters.country === c, () => setFilters(f => ({ ...f, country: f.country === c ? undefined : c }))))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <hr className="filter-sep" />

          {/* Cook Time */}
          <div className="filter-group">
            <div className="filter-label">Cook Time</div>
            <div className="filter-pills">
              {['10 Min','20 Min','30 Min','45 Min','60 Min','90 Min','2+ Hrs'].map(t => pill(t, filters.cookTime === t, () => toggleFilter('cookTime', t)))}
            </div>
          </div>
          <hr className="filter-sep" />

          {/* Ingredients Needed */}
          <div className="filter-group">
            <div className="filter-label">Ingredients Needed</div>
            <div className="filter-pills">
              {['3–6','7–9','10+'].map(t => pill(t, filters.ingCount === t, () => toggleFilter('ingCount', t)))}
            </div>
          </div>
          <hr className="filter-sep" />

          {/* Difficulty */}
          <div className="filter-group">
            <div className="filter-label">Difficulty</div>
            <div className="filter-pills">
              {['Easy','Intermediate','Advanced'].map(d => pill(d, filters.difficulty === d, () => toggleFilter('difficulty', d)))}
            </div>
          </div>
          <hr className="filter-sep" />

          {/* Servings */}
          <div className="filter-group">
            <div className="filter-label">Servings</div>
            <div className="filter-pills">
              {[1,2,4,6,8,10].map(n => pill(n === 10 ? '10+' : String(n), filters.servings === n, () => setFilters(f => ({ ...f, servings: f.servings === n ? undefined : n }))))}
            </div>
          </div>
          <hr className="filter-sep" />

          {/* Dietary Goals */}
          <div className="filter-group">
            <button className="filter-dropdown-header" onClick={() => setDietOpen(!dietOpen)} aria-expanded={dietOpen}>
              <span className="filter-label" style={{ marginBottom: 0 }}>Dietary Goals</span>
              {filters.diets.length > 0 && <span className="filter-dropdown-meta visible">{filters.diets.length}</span>}
              <svg className="filter-dropdown-chevron" style={{ transform: dietOpen ? 'rotate(180deg)' : undefined }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            {dietOpen && (
              <div className="filter-dropdown-body open">
                <div className="filter-pills" style={{ paddingTop: 10 }}>
                  {['Low Fat','High Protein','Low Calorie','Low Carb','Vegan','Vegetarian','Gluten-Free','Dairy-Free','Keto','Paleo'].map(d => pill(d, filters.diets.includes(d), () => toggleDiet(d)))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Find Button */}
      <div className="find-btn-wrap">
        <button className="find-btn" onClick={findRecipes} disabled={loading || !ingredients.length}>
          🍽 Find Delicious Meals
        </button>
        <button className="clear-filters-btn" onClick={clearFilters}>Clear Filters</button>
      </div>

      {/* Paywall */}
      {paywalled && <PaywallBanner />}

      {/* Results */}
      {(loading || recipes.length > 0 || error) && (
        <div className="results-section">
          <div className="results-header">
            <div className="results-header-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
            </div>
            Suggested For You
          </div>
          <div className="results-grid">
            {loading && (
              <div style={{ gridColumn: '1/-1' }}>
                <div className="loading-spinner">
                  <div className="spinner" />
                  <div className="loading-text">Finding recipes…</div>
                </div>
              </div>
            )}
            {!loading && error && (
              <div style={{ gridColumn: '1/-1' }} className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <p>{error}</p>
              </div>
            )}
            {!loading && !error && recipes.length === 0 && (
              <div style={{ gridColumn: '1/-1' }} className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <p>No recipes found. Try different ingredients or loosen your filters.</p>
              </div>
            )}
            {recipes.map(r => (
              <RecipeCard key={r.id} recipe={r} onClick={() => setSelectedRecipe(r)} />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onCooked={r => { setSelectedRecipe(null); onCooked(r); }}
        />
      )}
    </>
  );
}
