'use client';

import { useState } from 'react';
import { IngredientInput } from '@/components/IngredientInput';
import { callClaude } from '@/hooks/useClaude';
import { Drink, DrinkFilters } from '@/lib/types';
import { extractJSONArray } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';

export function DrinksPage({ onMade }: { onMade: (drink: Drink) => void }) {
  const { isPaid, startCheckout } = useSubscription();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [filters, setFilters] = useState<DrinkFilters>({ goals: [] });
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paywalled, setPaywalled] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);

  const pill = (label: string, active: boolean, onClick: () => void) => (
    <button key={label} className={`filter-pill${active ? ' active' : ''}`} onClick={onClick}>{label}</button>
  );

  const toggleGoal = (g: string) => setFilters(f => ({
    ...f, goals: f.goals.includes(g) ? f.goals.filter(x => x !== g) : [...f.goals, g],
  }));

  const [ingError, setIngError] = useState(false);

  const findDrinks = async () => {
    if (!ingredients.length) {
      setIngError(true);
      setTimeout(() => setIngError(false), 3000);
      return;
    }
    setLoading(true); setError(''); setPaywalled(false); setDrinks([]);

    const filterParts: string[] = [];
    if (filters.type) filterParts.push(`Type must be: ${filters.type}`);
    if (filters.goals.length) filterParts.push(`Must meet health goals: ${filters.goals.join(', ')}`);
    if (filters.ingCount) filterParts.push(`Total ingredient count: ${filters.ingCount}`);
    const filterBlock = filterParts.length ? 'FILTERS:\n' + filterParts.map((f, i) => `${i+1}. ${f}`).join('\n') : '';

    const prompt = `You are a drinks assistant. Generate as many unique drink recipes as possible (aim for 15, minimum 8).

USER'S INGREDIENTS: ${ingredients.join(', ')}

${filterBlock}

INSTRUCTIONS:
- Use SOME of the user's ingredients — not necessarily all.
- Every ingredient MUST include an exact measurement (e.g. "60ml rum", "1 tbsp honey", "1 cup soda water").
- matchingIngredients: only user's ingredients used.
- Sort from most user ingredients used to fewest.

Return ONLY a valid JSON array, no markdown:
[{"title":"Drink Name","type":"Alcoholic|Non-Alcoholic","time":"5 min","timeNum":5,"desc":"One sentence.","goals":["LOW CALORIE"],"matchingIngredients":["lime"],"ingredients":["60ml rum","1 lime, juiced","1 cup soda water"],"steps":["Step 1.","Step 2."]}]`;

    try {
      const data = await callClaude([{ role: 'user', content: prompt }], { maxTokens: 6000, feature: 'drinks' });
      const text = (data.content || []).map((c: { text?: string }) => c.text || '').join('');
      const arr = extractJSONArray(text);
      if (!arr) throw new Error('No drinks found');
      const enriched = arr
        .filter((r: unknown): r is Drink => {
          if (typeof r !== 'object' || r === null) return false;
          const d = r as Record<string, unknown>;
          return typeof d.title === 'string' && Array.isArray(d.ingredients);
        })
        .map((r: Drink, i: number) => {
          const ingText = (r.ingredients || []).join(' ').toLowerCase();
          const matched = ingredients.filter(ing => ingText.includes(ing.toLowerCase()));
          return { ...r, id: `ai-drink-${Date.now()}-${i}`, matchCount: matched.length, matchingIngredients: matched };
        })
        .sort((a: Drink, b: Drink) => (b.matchCount! - a.matchCount!));
      setDrinks(enriched);
    } catch (err: unknown) {
      const code = (err as Error & { code?: string }).code;
      if (code === 'free_limit_reached' || code === 'paid_feature') setPaywalled(true);
      else setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="hero drinks-hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-badge">🍹 Drinks & Cocktails</div>
          <h1>What can you <span>mix?</span></h1>
          <p>Enter your ingredients and discover cocktails, mocktails and healthy drinks.</p>
        </div>
      </div>

      {!isPaid ? (
        <div style={{ maxWidth: 640, margin: '32px auto', padding: '0 24px' }}>
          <div style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', borderRadius: 16, padding: '40px 24px', textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍹</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Drinks are a Pro Feature</div>
            <p style={{ fontSize: 14, opacity: 0.85, marginBottom: 24, lineHeight: 1.6, maxWidth: 400, margin: '0 auto 24px' }}>
              Upgrade to Pantrify Pro to generate cocktails, mocktails and healthy drinks — plus unlimited recipe searches and Smart Grocery.
            </p>
            <button onClick={startCheckout} style={{ background: 'white', color: '#6d28d9', border: 'none', borderRadius: 99, padding: '13px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              ✦ Upgrade to Pro
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="search-section">
            <IngredientInput ingredients={ingredients} onChange={setIngredients} />
          </div>

          <div className="filters-section">
            <div className="filters-card">
              <div className="filters-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
                Filter Drinks
              </div>
              <div className="filter-group">
                <div className="filter-label">Type</div>
                <div className="filter-pills">
                  {['Alcoholic','Non-Alcoholic'].map(t => pill(t, filters.type === t, () => setFilters(f => ({ ...f, type: f.type === t ? undefined : t }))))}
                </div>
              </div>
              <hr className="filter-sep" />
              <div className="filter-group">
                <div className="filter-label">Ingredients Needed</div>
                <div className="filter-pills">
                  {['2–3','4–6','7+'].map(t => pill(t, filters.ingCount === t, () => setFilters(f => ({ ...f, ingCount: f.ingCount === t ? undefined : t }))))}
                </div>
              </div>
              <hr className="filter-sep" />
              <div className="filter-group">
                <button className="filter-dropdown-header" onClick={() => setGoalsOpen(!goalsOpen)} aria-expanded={goalsOpen}>
                  <span className="filter-label" style={{ marginBottom: 0 }}>Health Goals</span>
                  {filters.goals.length > 0 && <span className="filter-dropdown-meta visible">{filters.goals.length}</span>}
                  <svg className="filter-dropdown-chevron" style={{ transform: goalsOpen ? 'rotate(180deg)' : undefined }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                {goalsOpen && (
                  <div className="filter-pills" style={{ paddingTop: 10 }}>
                    {['Low Calorie','High Protein','Antioxidant','Hydrating','Low Sugar','Relaxing','Energy Boost','Immunity'].map(g => pill(g, filters.goals.includes(g), () => toggleGoal(g)))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="find-btn-wrap">
            <button className="find-btn drinks-find-btn" onClick={findDrinks} disabled={loading}>
              🍹 Find Drinks
            </button>
            <button className="clear-filters-btn" onClick={() => { setFilters({ goals: [] }); setGoalsOpen(false); setIngredients([]); setDrinks([]); setError(''); setPaywalled(false); }}>Clear All</button>
          </div>

          {ingError && (
            <div style={{
              position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
              background: '#1f2937', color: 'white', borderRadius: 12,
              padding: '14px 24px', fontSize: 14, fontWeight: 600,
              zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' as const,
            }}>
              🍹 Add at least one ingredient first!
            </div>
          )}

          {paywalled && (
            <div style={{ maxWidth: 640, margin: '0 auto 16px', padding: '0 24px' }}>
              <div style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const, color: 'white' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🔒 Upgrade to unlock drinks</div>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>Pro includes unlimited drinks, recipes, imports & smart grocery.</div>
                </div>
                <button onClick={startCheckout} style={{ background: 'white', color: '#6d28d9', border: 'none', borderRadius: 99, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const }}>✦ Upgrade</button>
              </div>
            </div>
          )}

          {(loading || drinks.length > 0 || error) && (
            <div className="results-section">
              <div className="results-header">
                <div className="results-header-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M8 22h8M12 11v11M5 11h14l-1.5-7h-11L5 11z"/></svg>
                </div>
                Drink Suggestions
              </div>
              <div className="results-grid">
                {loading && <div style={{ gridColumn: '1/-1' }}><div className="loading-spinner"><div className="spinner" /><div className="loading-text">Finding drinks…</div></div></div>}
                {!loading && error && <div style={{ gridColumn: '1/-1' }} className="empty-state"><div className="empty-state-icon">⚠️</div><p>{error}</p></div>}
                {!loading && !error && drinks.length === 0 && <div style={{ gridColumn: '1/-1' }} className="empty-state"><div className="empty-state-icon">🔍</div><p>No drinks found. Try different ingredients or filters.</p></div>}
                {drinks.map(r => (
                  <div key={r.id} className="recipe-card" onClick={() => setSelectedDrink(r)}>
                    <div className="recipe-card-header">
                      <div className="recipe-card-tags">
                        <span className="tag-pill" style={{ background: '#e0e7ff', color: '#4338ca' }}>✦ AI</span>
                        {r.matchCount! > 0 ? <span className="tag-pill" style={{ background: '#dcfce7', color: '#16a34a' }}>✓ {r.matchCount}/{r.ingredients.length}</span> : null}
                        <span className="tag-pill">{r.type}</span>
                      </div>
                      <div className="time-badge">⏱ {r.time}</div>
                    </div>
                    <div className="recipe-card-body">
                      <h3>{r.title}</h3>
                      <p>{r.desc}</p>
                      <div className="recipe-card-footer">
                        <div className="ingredients-bar"><span>Ingredients you have</span><span>{r.matchCount} of {r.ingredients.length}</span></div>
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.round((r.matchCount! / r.ingredients.length) * 100)}%` }} /></div>
                        <div className="diet-tags">{(r.goals || []).map(g => <span key={g} className="diet-tag">{g}</span>)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {selectedDrink && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setSelectedDrink(null); }}>
          <div className="modal">
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)' }}>
              <button className="modal-close" onClick={() => setSelectedDrink(null)}>✕</button>
              <div className="modal-header-tags">
                <span className="modal-header-tag" style={{ background: 'rgba(99,102,241,0.3)' }}>✦ AI Generated</span>
                <span className="modal-header-tag">{selectedDrink.type}</span>
              </div>
              <div className="modal-title">{selectedDrink.title}</div>
            </div>
            <div className="modal-body">
              <div className="modal-meta"><span>⏱ {selectedDrink.time}</span><span>🥤 {selectedDrink.ingredients.length} ingredients</span></div>
              <p className="modal-desc">{selectedDrink.desc}</p>
              <div className="modal-section-title"><span>🧑</span> Ingredients</div>
              <ul className="modal-ingredients">
                {selectedDrink.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
              </ul>
              <div className="modal-section-title"><span>🌿</span> Instructions</div>
              <div className="modal-steps">
                {selectedDrink.steps.map((step, i) => (
                  <div key={i} className="modal-step"><div className="modal-step-num">{i + 1}</div><div>{step}</div></div>
                ))}
              </div>
            </div>
            <button className="cooked-btn" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', margin: '0 24px 24px', borderRadius: 12, width: 'calc(100% - 48px)' }} onClick={() => { onMade(selectedDrink); setSelectedDrink(null); }}>
              🍹 I Made It!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
