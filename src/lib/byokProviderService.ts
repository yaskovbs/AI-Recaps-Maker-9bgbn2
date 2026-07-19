import type { APIKeysData } from './apiKeysService';

export interface WebSearchResult {
  title: string;
  link: string;
  snippet: string;
}

function providerError(provider: string, status: number, payload: unknown): Error {
  const message = (payload as { error?: { message?: string } })?.error?.message;
  const serialized = JSON.stringify(payload).toLowerCase();
  if (status === 429 || serialized.includes('quota')) return new Error(`${provider} quota is exhausted.`);
  if (status === 401 || status === 403) return new Error(`${provider} rejected the API key or its API restrictions.`);
  return new Error(message || `${provider} request failed.`);
}

export async function generateGeminiText(apiKey: string, prompt: string, systemInstruction?: string): Promise<string> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw providerError('Gemini', response.status, payload);
  const text = (payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
    .candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
  if (!text) throw new Error('Gemini returned an empty response.');
  return text;
}

export async function searchWeb(keys: Pick<APIKeysData, 'googleSearch' | 'searchEngineId'>, query: string): Promise<WebSearchResult[]> {
  if (!keys.googleSearch || !keys.searchEngineId) throw new Error('Google Search requires both an API key and Search Engine ID.');
  const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(keys.googleSearch)}&cx=${encodeURIComponent(keys.searchEngineId)}&q=${encodeURIComponent(query)}&num=5`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw providerError('Google Search', response.status, payload);
  return ((payload as { items?: Array<{ title?: string; link?: string; snippet?: string }> }).items || []).map(item => ({
    title: item.title || '', link: item.link || '', snippet: item.snippet || '',
  }));
}
