'use client';

import { Recipe } from '@/lib/types';

interface RecipeModalProps {
  recipe: Recipe | null;
  onClose: () => void;
  onCooked: (recipe: Recipe) => void;
}

export function RecipeModal({ recipe, onClose, onCooked }: RecipeModalProps) {
  if (!recipe) return null;

  const liveMatch = (recipe.matchingIngredients || []).length;
  const totalIng = recipe.ingredients.length;
  const pct = Math.round((liveMatch / totalIng) * 100);
  const matching = new Set((recipe.matchingIngredients || []).map(x => x.toLowerCase()));
  const m = recipe.macros;
  const diffColor = recipe.difficulty === 'Easy' ? '#16a34a' : recipe.difficulty === 'Intermediate' ? '#d97706' : '#dc2626';

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>✕</button>
          <div className="modal-header-tags">
            <span className="modal-header-tag" style={{ background: 'rgba(99,102,241,0.3)' }}>✦ AI Generated</span>
            {recipe.cuisine && <span className="modal-header-tag">{recipe.cuisine}</span>}
            {recipe.meal && <span className="modal-header-tag">{recipe.meal}</span>}
            {recipe.difficulty && (
              <span className="modal-header-tag" style={{ background: `${diffColor}44` }}>
                {recipe.difficulty === 'Easy' ? '🟢' : recipe.difficulty === 'Intermediate' ? '🟡' : '🔴'} {recipe.difficulty}
              </span>
            )}
          </div>
          <div className="modal-title">{recipe.title}</div>
        </div>

        <div className="modal-body">
          <div className="modal-meta">
            <span>⏱ {recipe.time}</span>
            <span>🍽 {totalIng} ingredients</span>
            {recipe.servings && <span>👥 {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>}
          </div>

          <p className="modal-desc">{recipe.desc}</p>

          <div className="modal-progress-wrap">
            <div className="modal-progress-label">
              <span>Ingredients you have</span>
              <span>{liveMatch} / {totalIng}</span>
            </div>
            <div className="modal-progress-bar">
              <div style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="modal-diet-tags">
            {(recipe.diet || []).map(d => <span key={d} className="modal-diet-tag">{d}</span>)}
          </div>

          {m && (
            <div className="macro-bar">
              <div className="macro-item">
                <div className="macro-val">{Math.round(m.calories)}</div>
                <div className="macro-label">Calories<br /><span style={{ fontSize: 9, color: 'var(--text-light)' }}>per serving</span></div>
              </div>
              <div className="macro-divider" />
              <div className="macro-item"><div className="macro-val">{Math.round(m.protein)}g</div><div className="macro-label">Protein</div></div>
              <div className="macro-divider" />
              <div className="macro-item"><div className="macro-val">{Math.round(m.carbs)}g</div><div className="macro-label">Carbs</div></div>
              <div className="macro-divider" />
              <div className="macro-item"><div className="macro-val">{Math.round(m.fat)}g</div><div className="macro-label">Fat</div></div>
            </div>
          )}

          <div className="modal-section-title"><span>🧑</span> Ingredients</div>
          <ul className="modal-ingredients">
            {recipe.ingredients.map((ing, i) => {
              const isMatch = matching.size > 0 && [...matching].some(m => ing.toLowerCase().includes(m));
              return (
                <li key={i} className={isMatch ? 'ing-matched' : ''}>
                  {ing}{isMatch && <span className="ing-check"> ✓</span>}
                </li>
              );
            })}
          </ul>

          <div className="modal-section-title"><span>🌿</span> Instructions</div>
          <div className="modal-steps">
            {recipe.steps.map((step, i) => (
              <div key={i} className="modal-step">
                <div className="modal-step-num">{i + 1}</div>
                <div>{step}</div>
              </div>
            ))}
          </div>
        </div>

        <button className="cooked-btn" onClick={() => onCooked(recipe)}>
          ✓ Cooked It!
        </button>
      </div>
    </div>
  );
}
