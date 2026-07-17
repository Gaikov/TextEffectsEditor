import { error, json } from '../../../_lib/http';
import { requireUser } from '../../../_lib/session';
import type { Env } from '../../../_lib/types';
import {
  deserializeFontEffect,
  serializeFontEffect,
  type IFontEffect,
  type SerializedFontEffect,
} from '../../../../src/effects';

const MODEL = '@cf/meta/llama-3.1-8b-instruct-fp8';
const MAX_PROMPT_LENGTH = 600;
const MAX_EFFECTS = 18;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readNumber(value: unknown, fallback: number) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();

  const firstObject = trimmed.indexOf('{');
  const lastObject = trimmed.lastIndexOf('}');
  if (firstObject !== -1 && lastObject > firstObject) {
    return trimmed.slice(firstObject, lastObject + 1);
  }

  return trimmed;
}

function readEffects(value: unknown) {
  if (Array.isArray(value)) return value;
  if (isRecord(value) && Array.isArray(value.effects)) return value.effects;
  return null;
}

function validateEffects(value: unknown): SerializedFontEffect[] {
  const rawEffects = readEffects(value);
  if (!rawEffects) return [];

  const effects = rawEffects
    .slice(0, MAX_EFFECTS)
    .map(deserializeFontEffect)
    .filter((effect): effect is IFontEffect => effect !== null)
    .map(serializeFontEffect)
    .filter((effect): effect is SerializedFontEffect => effect !== null);

  return effects;
}

function buildSystemPrompt() {
  return `You generate JSON presets for Text Effects Editor.
Return JSON only: {"effects":[...]}.
Use only supported effect types:
group, fill, stroke, gradientFill, patternFill, noise, shadow, innerShadow, glow, blur, wave, distort, compositeBlend.
Every effect should include visible, collapsed, and opacity when supported.
Prefer readable layered text. Use groups for complex styles. Keep the result under ${MAX_EFFECTS} total effects.

Useful shapes:
fill: { "type":"fill", "color":"#00B050", "opacity":1, "xOffset":0, "yOffset":0 }
stroke: { "type":"stroke", "color":"#FFFFFF", "opacity":1, "lineWidth":18, "xOffset":0, "yOffset":0, "lineCap":"round", "lineJoin":"round", "miterLimit":10, "lineDash":[], "lineDashOffset":0 }
gradientFill: { "type":"gradientFill", "opacity":1, "direction":"vertical", "colors":["#FFFFFF","#00D8FF","#145DBF"], "xOffset":0, "yOffset":0 }
glow: { "type":"glow", "color":"#FFD700", "opacity":0.8, "blur":18, "spread":2 }
shadow: { "type":"shadow", "color":"#000000", "opacity":0.45, "xOffset":0, "yOffset":0, "shadowBlur":10, "shadowOffsetX":8, "shadowOffsetY":10 }
innerShadow: { "type":"innerShadow", "color":"#000000", "opacity":0.35, "xOffset":0, "yOffset":0, "shadowBlur":6, "shadowOffsetX":4, "shadowOffsetY":4 }
patternFill: { "type":"patternFill", "opacity":1, "patternType":"stripes", "foregroundColor":"#FFFFFF", "backgroundColor":"#106BA3", "backgroundOpacity":1, "cellSize":16, "thickness":6, "rotation":-45, "scale":1, "xOffset":0, "yOffset":0 }
noise: { "type":"noise", "opacity":0.25, "noiseType":"fractal", "foregroundColor":"#FFFFFF", "backgroundColor":"#000000", "backgroundOpacity":0, "seed":1, "scale":1, "density":0.5, "contrast":0.75, "grainSize":2, "octaves":4, "persistence":0.5, "lacunarity":2, "rotation":0, "stretchX":1, "stretchY":1, "monochrome":false, "invert":false, "threshold":0, "softness":0.25 }
blur: { "type":"blur", "opacity":1, "radius":3, "iterations":1 }
wave: { "type":"wave", "opacity":1, "direction":"horizontal", "amplitude":8, "wavelength":120, "phase":0 }
distort: { "type":"distort", "opacity":1, "noiseType":"fractal", "strength":8, "grainSize":80, "scale":1, "xAmount":1, "yAmount":1, "rotation":0, "octaves":4, "persistence":0.5, "lacunarity":2, "seed":1 }
compositeBlend: { "type":"compositeBlend", "opacity":1, "operation":"source-over" }
group: { "type":"group", "name":"Layer", "visible":true, "collapsed":false, "opacity":1, "children":[...] }`;
}

function buildUserPrompt(input: {
  canvasHeight: number;
  canvasWidth: number;
  fontSize: number;
  prompt: string;
  text: string;
}) {
  return `Text: ${JSON.stringify(input.text)}
Font size: ${input.fontSize}
Canvas: ${input.canvasWidth}x${input.canvasHeight}
User style description: ${input.prompt}

Generate a polished editable effect stack. Return only JSON.`;
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const user = await requireUser(env, request);
  if (!user) return error('Authentication required.', 401);
  if (!env.AI) return error('Workers AI is not configured.', 501);

  const value = await request.json().catch(() => null);
  if (!isRecord(value)) return error('Invalid payload.');

  const prompt = String(value.prompt ?? '').trim();
  if (!prompt) return error('Prompt is required.');
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return error(`Prompt must be ${MAX_PROMPT_LENGTH} characters or less.`);
  }

  const input = {
    canvasHeight: readNumber(value.canvasHeight, 800),
    canvasWidth: readNumber(value.canvasWidth, 1200),
    fontSize: readNumber(value.fontSize, 180),
    prompt,
    text: String(value.text ?? 'Hello World').slice(0, 120),
  };

  try {
    const result = await env.AI.run(MODEL, {
      max_tokens: 1800,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });
    const response = typeof result.response === 'string' ? result.response : '';
    const parsed = JSON.parse(extractJson(response));
    const effects = validateEffects(parsed);
    if (effects.length === 0) {
      return error('AI did not generate valid effects.', 502);
    }

    return json({ effects });
  } catch (caughtError) {
    console.warn('AI effect generation failed.', caughtError);
    return error('Unable to generate effects.', 502);
  }
};
