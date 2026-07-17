import type { SerializedFontEffect } from '../effects';

export interface GenerateEffectsInput {
  canvasHeight: number;
  canvasWidth: number;
  fontSize: number;
  prompt: string;
  text: string;
}

export interface GenerateEffectsResult {
  effects: SerializedFontEffect[];
}

async function readJson<T>(response: Response): Promise<T> {
  const value = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      typeof value?.error === 'string' ? value.error : 'Request failed',
    );
  }
  return value as T;
}

export async function generateEffectsWithAI(
  input: GenerateEffectsInput,
): Promise<GenerateEffectsResult> {
  return readJson<GenerateEffectsResult>(await fetch('/api/ai/effects/generate', {
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  }));
}
