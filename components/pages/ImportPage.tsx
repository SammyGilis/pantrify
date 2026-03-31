'use client';

import { useState } from 'react';
import { Recipe } from '@/lib/types';
import { detectPlatform, extractJSON } from '@/lib/utils';
import { callClaude } from '@/hooks/useClaude';
import { RecipeModal } from '@/components/RecipeModal';
import { PaywallBanner } from '@/components/PaywallBanner';

interface Props { onCooked: (r: Recipe) => void; }

const EXAMPLES = {
  tiktok: 'https://www.tiktok.com/@gordonramsayofficial/video/7123456789',
  instagram: 'https://www.instagram.com/reel/ABC123xyz/',
  youtube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  web: 'https://www.seriouseats.com/best-slow-cooked-bolognese-sauce-recipe',
};

export function ImportPage({ onCooked }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const [paywalled, setPaywalled] = useState(false);
  const [result, setResult] = useState<Recipe | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  const platform = url ? detectPlatform(url) : { name: 'Web', icon: '🌐', type: 'web' };

  const schema = (u: string, type: string) =>
    `{"title":"Recipe Name","cuisine":"Italian","meal":"Dinner","time":"30 min","servings":4,"desc":"Short description.","diet":[],"source":"${u}","sourceType":"${type}","macros":{"calories":520,"protein":28,"carbs":42,"fat":18},"ingredients":["1 tbsp olive oil","3 cloves garlic, minced","400g chicken breast"],"steps":["Step 1.","Step 2."]}`;

  const importRecipe = async () => {
    if (!url.startsWith('http')) { setError('Please enter a valid URL starting with https://'); return; }
    setLoading(true); setError(''); setPaywalled(false); setResult(null); setSavedMsg(false);

    const loadMsgs = ['Searching for recipe…','Reading content…','Extracting ingredients…','Calculating macros…'];
    let msgIdx = 0;
    setLoadingMsg(loadMsgs[0]);
    const interval = setInterval(() => { msgIdx = (msgIdx + 1) % loadMsgs.length; setLoadingMsg(loadMsgs[msgIdx]); }, 1800);

    try {
      let pageContent = '';

      // Fetch page content via our server-side proxy (avoids CORS)
      if (platform.type === 'web') {
        setLoadingMsg('Reading page…');
        try {
          const r = await fetch('/api/fetch-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
          const j = await r.json();
          if (j.contents && j.contents.length > 300) {
            pageContent = j.contents
              .replace(/<script[\s\S]*?<\/script>/gi, '')
              .replace(/<style[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ').trim().slice(0, 3500);
          }
        } catch { /* continue */ }
      }

      if (platform.type === 'youtube') {
        setLoadingMsg('Fetching transcript…');
        try {
          const r = await fetch('/api/fetch-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
          const j = await r.json();
          const html = j.contents || '';
          const titleM = html.match(/"title"\s*:\s*"([^"\\]+)"/);
          const capM = html.match(/"captionTracks":\[{"baseUrl":"([^"]+)"/);
          if (capM) {
            const capUrl = capM[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
            const cr = await fetch('/api/fetch-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: capUrl }) });
            const cj = await cr.json();
            const transcript = (cj.contents || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3500);
            if (transcript.length > 50) pageContent = `Title: ${titleM?.[1] ?? ''}\nTranscript: ${transcript}`;
          }
        } catch { /* continue */ }
      }

      if (platform.type === 'tiktok') {
        setLoadingMsg('Reading TikTok caption…');
        try {
          const r = await fetch('/api/fetch-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}` }) });
          const j = await r.json();
          if (j.contents?.[0] === '{') {
            const d = JSON.parse(j.contents);
            if (d.title) pageContent = `Creator: @${d.author_name ?? ''}\nCaption: ${d.title}`;
          }
        } catch { /* continue */ }
      }

      if (platform.type === 'instagram') {
        setLoadingMsg('Reading caption…');
        try {
          const r = await fetch('/api/fetch-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
          const j = await r.json();
          const html = j.contents || '';
          const ogM = html.match(/property="og:description"[^>]*content="([^"]+)"/i) || html.match(/content="([^"]+)"[^>]*property="og:description"/i);
          if (ogM) pageContent = `Caption: ${ogM[1]}`;
        } catch { /* continue */ }
      }

      setLoadingMsg('Extracting recipe…');
      const creator = (url.match(/@([\w.]+)/) || [])[1] ?? '';
      const sch = schema(url, platform.type);

      let prompt: string;
      if (pageContent.length > 40 && platform.type === 'web') {
        prompt = `Extract the exact recipe from this page.\n\nURL: ${url}\n\nCONTENT:\n${pageContent}\n\nReturn ONLY this JSON (no markdown):\n${sch}\n\nRULES:\n- Every ingredient MUST have an exact measurement.\n- Calculate macros accurately: look up the nutritional value of each ingredient at the exact quantity listed, sum them all up, then divide by servings. Spices, salt, pepper, herbs = 0 calories. Cross-check: calories must ≈ (protein×4)+(carbs×4)+(fat×9). Never use placeholder macro values.`;
      } else {
        prompt = `Find the exact recipe from this ${platform.name} video: ${url}${creator ? ` by @${creator}` : ''}.${pageContent ? `\n\nContent found: ${pageContent}` : ''}\n\nSearch for the specific video, creator, and recipe. Find the actual dish — do NOT substitute a similar one.\n\nReturn ONLY this JSON (no markdown):\n${sch}\n\nRULES:\n- Every ingredient MUST have an exact measurement. If measurements aren't shown in the video, estimate realistic amounts for the dish.\n- Calculate macros accurately: look up the nutritional value of each ingredient at the exact quantity listed, sum them all up, then divide by servings. Spices, salt, pepper, herbs = 0 calories. Cross-check: calories must ≈ (protein×4)+(carbs×4)+(fat×9). Never use placeholder macro values.`;
      }

      const useSearch = platform.type !== 'web' || pageContent.length < 40;
      const messages: { role: 'user' | 'assistant'; content: string | unknown[] }[] = [{ role: 'user', content: prompt }];

      let data = await callClaude(messages, { maxTokens: 2500, useSearch, feature: 'import' });
      let finalText = '';

      // Handle web_search tool_use loop
      let iterations = 0;
      while (iterations < 4) {
        iterations++;
        const hasToolUse = (data.content || []).some((c: { type: string }) => c.type === 'tool_use');
        if (!hasToolUse) break;
        messages.push({ role: 'assistant', content: data.content });
        const toolResults = (data.content || [])
          .filter((c: { type: string }) => c.type === 'tool_use')
          .map((tb: { id: string }) => ({ type: 'tool_result', tool_use_id: tb.id, content: 'Search complete. Return the exact recipe JSON with measurements for every ingredient.' }));
        messages.push({ role: 'user', content: toolResults });
        data = await callClaude(messages, { maxTokens: 2500, useSearch: true, feature: 'import' });
      }

      finalText = (data.content || []).filter((c: { type: string }) => c.type === 'text').map((c: { text?: string }) => c.text ?? '').join('');
      const recipe = extractJSON(finalText) as Recipe | null;
      if (!recipe?.title) throw new Error('Could not identify the recipe. Try pasting a recipe website link directly.');

      setResult(recipe);
    } catch (err: unknown) {
      if (err instanceof Error && (err as Error & { code?: string }).code === 'free_limit_reached') setPaywalled(true);
      else setError(err instanceof Error ? err.message : 'Could not extract recipe. Try a recipe website link.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <>
      <div className="import-hero">
        <div className="hero-badge">✦ IMPORT FROM ANYWHERE</div>
        <h1>Import any <span>recipe</span></h1>
        <p>Paste a link from TikTok, Instagram, YouTube, or any website and we&apos;ll pull out the full recipe instantly.</p>
      </div>

      <div style={{ padding: '0 32px' }}>
        <div className="import-card">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>Paste your link below</div>
          <p style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 10 }}>💡 Recipe websites work best. For TikTok/Instagram, we&apos;ll search for the recipe by creator.</p>
          <div className="import-url-row">
            <input type="text" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') importRecipe(); }} placeholder="https://..." />
            <button onClick={importRecipe} disabled={loading}>Extract Recipe</button>
          </div>
          <div className="platform-pills">
            {(Object.entries(EXAMPLES) as [string, string][]).map(([p, ex]) => (
              <button key={p} className="platform-pill" onClick={() => setUrl(ex)}>
                {p === 'tiktok' ? '🎵' : p === 'instagram' ? '📸' : p === 'youtube' ? '▶️' : '🌐'} {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {paywalled && <div style={{ maxWidth: 640, margin: '0 auto' }}><PaywallBanner /></div>}

        {error && (
          <div className="import-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {loading && (
          <div className="import-card" style={{ textAlign: 'center', padding: 32 }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{loadingMsg}</div>
          </div>
        )}

        {result && !loading && (
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            {/* Header */}
            <div className="import-result-card">
              <div className="import-result-tags">
                <span className="import-result-tag">{platform.icon} {platform.name}</span>
                {result.cuisine && <span className="import-result-tag">{result.cuisine}</span>}
                {result.meal && <span className="import-result-tag">{result.meal}</span>}
                {result.diet && result.diet.map((d: string) => <span key={d} className="import-result-tag">{d}</span>)}
              </div>
              <div className="import-result-title">{result.title}</div>
              <div className="import-result-meta">
                {result.time && <span>⏱ {result.time}</span>}
                {result.servings && <span>🍽 {result.servings} servings</span>}
                {result.ingredients && <span>📋 {result.ingredients.length} ingredients</span>}
              </div>
              <p className="import-result-desc">{result.desc}</p>
              {savedMsg && <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>✓ Recipe saved to history!</div>}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="import-save-btn" onClick={() => { onCooked({ ...result, id: `import-${Date.now()}` }); setSavedMsg(true); }}>
                  ✓ Save to History
                </button>
                <button className="import-clear-btn" onClick={() => { setResult(null); setUrl(''); setSavedMsg(false); }}>Clear</button>
              </div>
            </div>

            {/* Macros */}
            {result.macros && (
              <div className="macro-bar" style={{ margin: '12px 0' }}>
                <div className="macro-item">
                  <div className="macro-val">{Math.round(result.macros.calories)}</div>
                  <div className="macro-label">Calories<br /><span style={{ fontSize: 9, color: 'var(--text-light)' }}>per serving</span></div>
                </div>
                <div className="macro-divider" />
                <div className="macro-item"><div className="macro-val">{Math.round(result.macros.protein)}g</div><div className="macro-label">Protein</div></div>
                <div className="macro-divider" />
                <div className="macro-item"><div className="macro-val">{Math.round(result.macros.carbs)}g</div><div className="macro-label">Carbs</div></div>
                <div className="macro-divider" />
                <div className="macro-item"><div className="macro-val">{Math.round(result.macros.fat)}g</div><div className="macro-label">Fat</div></div>
              </div>
            )}

            {/* Ingredients */}
            {result.ingredients && result.ingredients.length > 0 && (
              <div style={{ background: 'var(--white)', borderRadius: 16, padding: '20px 24px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div className="modal-section-title" style={{ marginTop: 0 }}>🧑 Ingredients</div>
                <ul className="modal-ingredients">
                  {result.ingredients.map((ing: string, i: number) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Steps */}
            {result.steps && result.steps.length > 0 && (
              <div style={{ background: 'var(--white)', borderRadius: 16, padding: '20px 24px', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div className="modal-section-title" style={{ marginTop: 0 }}>🌿 Instructions</div>
                <div className="modal-steps">
                  {result.steps.map((step: string, i: number) => (
                    <div key={i} className="modal-step">
                      <div className="modal-step-num">{i + 1}</div>
                      <div>{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
