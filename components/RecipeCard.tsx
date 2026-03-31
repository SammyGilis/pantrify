'use client';

import { Recipe } from '@/lib/types';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  const totalIng = recipe.ingredients.length;
  const have = recipe.matchCount || 0;
  const pct = Math.round((have / totalIng) * 100);
  const diffColor = recipe.difficulty === 'Easy' ? '#dcfce7' : recipe.difficulty === 'Intermediate' ? '#fef9c3' : '#fee2e2';
  const diffText = recipe.difficulty === 'Easy' ? '#16a34a' : recipe.difficulty === 'Intermediate' ? '#b45309' : '#dc2626';
  const diffEmoji = recipe.difficulty === 'Easy' ? '🟢' : recipe.difficulty === 'Intermediate' ? '🟡' : '🔴';

  return (
    <div className="recipe-card" onClick={onClick}>
      <div className="recipe-card-header">
        <div className="recipe-card-tags">
          <span className="tag-pill" style={{ background: '#e0e7ff', color: '#4338ca' }}>✦ AI</span>
          {have > 0
            ? <span className="tag-pill" style={{ background: '#dcfce7', color: '#16a34a' }}>✓ {have}/{totalIng}</span>
            : <span className="tag-pill" style={{ color: 'var(--text-muted)' }}>0/{totalIng} match</span>
          }
          {recipe.difficulty && <span className="tag-pill" style={{ background: diffColor, color: diffText }}>{diffEmoji} {recipe.difficulty}</span>}
          {recipe.servings && <span className="tag-pill" style={{ background: '#ede9fe', color: '#7c3aed' }}>👥 {recipe.servings}</span>}
          <span className="tag-pill">{recipe.cuisine}</span>
          <span className="tag-pill">{recipe.meal}</span>
        </div>
        <div className="time-badge">⏱ {recipe.time}</div>
      </div>
      <div className="recipe-card-body">
        <h3>{recipe.title}</h3>
        <p>{recipe.desc}</p>
        <div className="recipe-card-footer">
          <div className="ingredients-bar">
            <span>Ingredients you have</span>
            <span>{have} of {totalIng}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="diet-tags">
            {(recipe.diet || []).map(d => <span key={d} className="diet-tag">{d}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
