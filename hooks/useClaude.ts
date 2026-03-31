'use client';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | unknown[];
}

export async function callClaude(
  messages: ClaudeMessage[],
  options: { maxTokens?: number; useSearch?: boolean } = {}
) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      max_tokens: options.maxTokens ?? 8000,
      tools: options.useSearch
        ? [{ type: 'web_search_20250305', name: 'web_search' }]
        : undefined,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // Re-export the structured error so callers can check err.error === 'free_limit_reached'
    throw Object.assign(new Error(err.message || `API error ${res.status}`), { code: err.error, status: res.status });
  }

  return res.json();
}
