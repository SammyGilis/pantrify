'use client';

import { useState, useEffect } from 'react';
import { Recipe } from '@/lib/types';
import { callClaude } from '@/hooks/useClaude';
import { useSubscription } from '@/hooks/useSubscription';
import { categorize, parseIngName } from '@/lib/utils';

interface Props {
  cookedRecipes: Recipe[];
  onClear: () => void;
}

interface GroceryItem { name: string; category: string; reason: string; }

export function HistoryPage({ cookedRecipes, onClear }: Props) {
  const { isPaid, startCheckout } = useSubscription();
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [groceryLoading, setGroceryLoading] = useState(false);

  useEffect(() => {
    if (cookedRecipes.length >= 5) loadGrocery();
  }, [cookedRecipes.length]);

  const loadGrocery = async () => {
    setGroceryLoading(true);
    try {
      const cuisines = [...new Set(cookedRecipes.map(r => r.cuisine).filter(Boolean))];
      const meals = [...new Set(cookedRecipes.map(r => r.meal).filter(Boolean))];
      const diets = [...new Set(cookedRecipes.flatMap(r => r.diet || []))];
      const allIngs = cookedRecipes.flatMap(r => (r.ingredients || []).map(i => parseIngName(i)));
      const titles = cookedRecipes.map(r => r.title).slice(0, 10);

      const prompt = `You are a smart grocery assistant. Based on this cooking history, recommend exactly 10 ingredients to buy.

Recipes cooked: ${titles.join(', ')}
Cuisines: ${cuisines.join(', ') || 'varied'}
Meal types: ${meals.join(', ') || 'varied'}
Dietary patterns: ${diets.join(', ') || 'none'}
Ingredients used: ${[...new Set(allIngs)].slice(0, 40).join(', ')}

Focus on: versatile staples, ingredients across multiple cuisines, pantry gaps, frequently used items.

Return ONLY a valid JSON array, no markdown:
[{"name":"Ingredient","category":"PRODUCE|PANTRY|PROTEIN|DAIRY|SPICE|GRAIN|CONDIMENT|SEAFOOD|MEAT","reason":"One concise sentence max 15 words."}]`;

      const data = await callClaude([{ role: 'user', content: prompt }], { maxTokens: 1000, feature: 'grocery' });
      const text = (data.content || []).map((c: { text?: string }) => c.text || '').join('');
      const clean = text.replace(/```json|```/g, '').trim();
      const arr = JSON.parse(clean.match(/\[[\s\S]*\]/)![0]);
      setGroceryItems(arr.slice(0, 10));
    } catch {
      // Fallback to frequency-based
      const ingMap: Record<string, { name: string; count: number; cat: string }> = {};
      cookedRecipes.forEach(r => {
        (r.ingredients || []).forEach(raw => {
          const name = parseIngName(raw);
          const key = name.toLowerCase();
          if (!ingMap[key]) ingMap[key] = { name, count: 0, cat: categorize(name) };
          ingMap[key].count++;
        });
      });
      const sorted = Object.values(ingMap).sort((a, b) => b.count - a.count).slice(0, 10);
      setGroceryItems(sorted.map(item => ({ name: item.name, category: item.cat, reason: `Used ${item.count} time${item.count !== 1 ? 's' : ''} in your recipes.` })));
    } finally {
      setGroceryLoading(false);
    }
  };

  const remaining = 5 - cookedRecipes.length;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 32px' }}>
      {/* History */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Cooking History</h2>
        {cookedRecipes.length > 0 && (
          <button className="clear-history-btn" onClick={() => { onClear(); setGroceryItems([]); }}>
            🗑 Clear History
          </button>
        )}
      </div>

      {cookedRecipes.length === 0 ? (
        <div className="empty-state" style={{ marginBottom: 32 }}>
          <div className="empty-state-icon">🍽</div>
          <p>No recipes cooked yet. Find a recipe and click &quot;Cooked It!&quot; to track it here.</p>
        </div>
      ) : (
        <div className="history-list" style={{ marginBottom: 32 }}>
          {cookedRecipes.map((r, i) => (
            <div key={i} className="history-card">
              <div className="history-card-body" style={{ marginLeft: 0 }}>
                <h3>{r.title}</h3>
                <p>{r.desc}</p>
                <div className="history-card-meta">
                  <div className="history-card-meta-left">
                    <span>⏱ {r.time}</span>
                    <span>🏷 {r.cuisine || ""} {r.meal ? `• ${r.meal}` : ''}</span>
                  </div>
                  {r.cookedDate && <span className="cooked-date">Cooked {r.cookedDate}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Smart Grocery */}
      <div style={{ background: 'var(--white)', borderRadius: 16, padding: 20, border: '1px solid var(--border)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 28, height: 28, background: 'var(--green-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🛒</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Smart Grocery List</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>AI-curated based on your cooking habits</div>
          </div>
        </div>

        {!isPaid ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🛒</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Smart Grocery is a Pro Feature</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>Upgrade to Pro to unlock AI-curated grocery lists, drink recipes, and unlimited searches.</p>
            <button onClick={startCheckout} style={{ background: 'var(--green-dark)', color: 'white', border: 'none', borderRadius: 99, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              ✦ Upgrade to Pro
            </button>
          </div>
        ) : cookedRecipes.length < 5 ? (
          <div className="grocery-empty">
            Cook <strong>{remaining} more recipe{remaining !== 1 ? 's' : ''}</strong> to unlock your Smart Grocery list.
            <span style={{ fontSize: 11, marginTop: 6, display: 'block', color: 'var(--text-light)' }}>{cookedRecipes.length}/5 recipes cooked</span>
            <div style={{ marginTop: 10, background: 'var(--border)', borderRadius: 99, height: 4, overflow: 'hidden' }}>
              <div style={{ width: `${(cookedRecipes.length / 5) * 100}%`, height: '100%', background: 'var(--green-dark)', borderRadius: 99, transition: 'width 0.4s' }} />
            </div>
          </div>
        ) : groceryLoading ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Analysing your cooking history…</div>
          </div>
        ) : (
          <div className="grocery-list">
            {groceryItems.map((item, i) => (
              <div key={i} className="grocery-item">
                <div className="grocery-item-name">{item.name}</div>
                <div className="grocery-item-detail">
                  <span className="grocery-cat">{item.category}</span>
                  <span className="grocery-reason">— {item.reason}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
