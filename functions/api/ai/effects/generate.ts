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
const MAX_GENERATION_ATTEMPTS = 3;

const DRAW_EFFECT_TYPES = new Set([
  'fill',
  'stroke',
  'gradientFill',
  'patternFill',
]);

const BUFFER_EFFECT_TYPES = new Set([
  'shadow',
  'innerShadow',
  'glow',
  'blur',
  'wave',
  'distort',
  'noise',
  'compositeBlend',
]);

const COLOR_WORDS = [
  'black',
  'blue',
  'cyan',
  'gold',
  'green',
  'orange',
  'pink',
  'purple',
  'red',
  'teal',
  'white',
  'yellow',
];

const WHITE_COLORS = new Set(['#fff', '#ffffff']);

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

function readChildren(effect: SerializedFontEffect) {
  return Array.isArray(effect.children)
    ? (effect.children.filter(isRecord) as SerializedFontEffect[])
    : [];
}

function walkEffects(
  effects: SerializedFontEffect[],
  callback: (effect: SerializedFontEffect) => void,
) {
  effects.forEach((effect) => {
    callback(effect);
    if (effect.type === 'group') {
      walkEffects(readChildren(effect), callback);
    }
  });
}

function isVisible(effect: SerializedFontEffect) {
  return effect.visible !== false;
}

function isLogoPrompt(prompt: string) {
  const normalized = prompt.toLowerCase();
  return /\b(cartoon|game|gaming|logo|sticker|mascot)\b/.test(normalized);
}

function promptMentionsSpecificColor(prompt: string) {
  const normalized = prompt.toLowerCase();
  return COLOR_WORDS.some((color) => new RegExp(`\\b${color}\\b`).test(normalized));
}

function isWhiteColor(value: unknown) {
  return typeof value === 'string' && WHITE_COLORS.has(value.toLowerCase());
}

function drawSignature(effect: SerializedFontEffect) {
  if (effect.type === 'fill') {
    return `fill:${String(effect.color ?? '').toLowerCase()}`;
  }
  if (effect.type === 'stroke') {
    return `stroke:${String(effect.color ?? '').toLowerCase()}:${String(
      effect.lineWidth ?? '',
    )}`;
  }
  if (effect.type === 'gradientFill') {
    return `gradient:${Array.isArray(effect.colors) ? effect.colors.join(',') : ''}`;
  }
  if (effect.type === 'patternFill') {
    return `pattern:${String(effect.patternType ?? '')}`;
  }
  return effect.type;
}

function visibleDrawSignatures(effects: SerializedFontEffect[]) {
  return effects
    .filter(isVisible)
    .filter((effect) => DRAW_EFFECT_TYPES.has(effect.type))
    .map(drawSignature);
}

function maxStrokeWidth(effects: SerializedFontEffect[]) {
  let maxWidth = 0;
  walkEffects(effects, (effect) => {
    if (isVisible(effect) && effect.type === 'stroke') {
      maxWidth = Math.max(maxWidth, readNumber(effect.lineWidth, 0));
    }
  });
  return maxWidth;
}

function hasVisibleType(effects: SerializedFontEffect[], type: string) {
  let found = false;
  walkEffects(effects, (effect) => {
    if (isVisible(effect) && effect.type === type) found = true;
  });
  return found;
}

function inspectEffectQuality(
  effects: SerializedFontEffect[],
  prompt: string,
): string[] {
  const issues: string[] = [];
  const wantsLogo = isLogoPrompt(prompt);

  walkEffects(effects, (effect) => {
    if (
      isVisible(effect) &&
      effect.type === 'compositeBlend' &&
      effect.operation === 'source-over'
    ) {
      issues.push('compositeBlend with operation source-over is a no-op.');
    }
  });

  if (wantsLogo) {
    if (!hasVisibleType(effects, 'gradientFill') && !hasVisibleType(effects, 'patternFill')) {
      issues.push(
        'Cartoon/game logo prompts should use gradientFill or patternFill instead of only plain fill.',
      );
    }

    if (maxStrokeWidth(effects) < 12) {
      issues.push('Cartoon/game logo prompts need at least one thick outline stroke, lineWidth >= 12.');
    }

    const visibleRootGroups = effects.filter(
      (effect) => isVisible(effect) && effect.type === 'group',
    );
    if (visibleRootGroups.length > 1) {
      const signatures = visibleRootGroups.map((group) =>
        visibleDrawSignatures(readChildren(group)).slice(0, 2).join('|'),
      );
      const uniqueSignatures = new Set(signatures.filter(Boolean));
      if (uniqueSignatures.size < signatures.filter(Boolean).length) {
        issues.push(
          'Avoid multiple root groups that redraw the same fill/stroke stack; use one main logo group.',
        );
      }
    }

    const lastVisibleRoot = effects.filter(isVisible).at(-1);
    if (
      promptMentionsSpecificColor(prompt) &&
      lastVisibleRoot?.type === 'group'
    ) {
      const childEffects = readChildren(lastVisibleRoot).filter(isVisible);
      const firstChild = childEffects[0];
      if (
        firstChild?.type === 'fill' &&
        isWhiteColor(firstChild.color) &&
        childEffects.every((effect) =>
          effect.type === 'fill' ||
          (effect.type === 'compositeBlend' && effect.operation === 'source-over'),
        )
      ) {
        issues.push(
          'Do not add a final white fill group over a colored logo; it covers the requested color.',
        );
      }
    }
  }

  return issues;
}

function inspectEffectOrder(
  effects: SerializedFontEffect[],
  path = 'effects',
): { issues: string[]; producesPixels: boolean } {
  const issues: string[] = [];
  let producesPixels = false;

  effects.forEach((effect, index) => {
    if (effect.visible === false) return;

    const effectPath = `${path}[${index}] ${effect.type}`;
    if (effect.type === 'group') {
      const children = readChildren(effect);
      const childResult = inspectEffectOrder(children, `${effectPath}.children`);
      issues.push(...childResult.issues);
      if (childResult.producesPixels) {
        producesPixels = true;
      } else {
        issues.push(`${effectPath} renders no visible pixels.`);
      }
      return;
    }

    if (DRAW_EFFECT_TYPES.has(effect.type)) {
      producesPixels = true;
      return;
    }

    if (BUFFER_EFFECT_TYPES.has(effect.type)) {
      if (!producesPixels) {
        issues.push(
          `${effectPath} is a buffer effect before any drawing effect in the same group.`,
        );
      }
      return;
    }

    issues.push(`${effectPath} has an unsupported effect type.`);
  });

  return { issues, producesPixels };
}

function validateEffectSemantics(effects: SerializedFontEffect[]) {
  const result = inspectEffectOrder(effects);
  if (!result.producesPixels) {
    result.issues.push('The root effect stack renders no visible pixels.');
  }
  return result.issues;
}

function validateGeneratedEffects(
  effects: SerializedFontEffect[],
  prompt: string,
) {
  return [
    ...validateEffectSemantics(effects),
    ...inspectEffectQuality(effects, prompt),
  ];
}

function buildSystemPrompt() {
  return `You generate JSON presets for Text Effects Editor.
Return JSON only: {"effects":[...]}.
Use only supported effect types:
group, fill, stroke, gradientFill, patternFill, noise, shadow, innerShadow, glow, blur, wave, distort, compositeBlend.
Every effect should include visible, collapsed, and opacity when supported.
Prefer readable layered text. Use groups for complex styles. Keep the result under ${MAX_EFFECTS} total effects.

Rendering is ordered and groups start with an empty buffer:
- Drawing effects are fill, stroke, gradientFill, and patternFill. They draw text pixels.
- Buffer effects are shadow, innerShadow, glow, blur, wave, distort, noise, and compositeBlend. They transform pixels already drawn earlier in the SAME group.
- Never put shadow/glow/blur/noise/distort/compositeBlend as the first visible child of a group. It renders nothing.
- To make text with shadow/glow, use a group like [fill or gradientFill, stroke if needed, shadow or glow]. Do not create an empty "Shadow Layer" containing only shadow.
- If a root fill exists outside a group, buffer effects inside a separate group cannot see that root fill.

Quality rules:
- For cartoon/game/logo prompts, prefer one main root group with a rich stack, not multiple similar root groups.
- For cartoon/game/logo prompts, prefer gradientFill or patternFill over a single flat fill.
- For cartoon/game/logo prompts, use thick outline strokes: usually 14-36 px.
- Do not use compositeBlend with operation "source-over"; it has no visible effect.
- Do not add a final white fill over a colored logo unless the user asked for white text.

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
compositeBlend: { "type":"compositeBlend", "opacity":0.35, "operation":"overlay" }
group: { "type":"group", "name":"Layer", "visible":true, "collapsed":false, "opacity":1, "children":[...] }`;
}

function buildUserPrompt(input: {
  canvasHeight: number;
  canvasWidth: number;
  fontSize: number;
  prompt: string;
  text: string;
}, previousIssues: string[] = []) {
  const feedback =
    previousIssues.length > 0
      ? `\nPrevious JSON was rejected because:\n${previousIssues
          .slice(0, 6)
          .map((issue) => `- ${issue}`)
          .join('\n')}\nGenerate a corrected effect stack.`
      : '';

  return `Text: ${JSON.stringify(input.text)}
Font size: ${input.fontSize}
Canvas: ${input.canvasWidth}x${input.canvasHeight}
User style description: ${input.prompt}
${feedback}

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
    let previousIssues: string[] = [];

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
      const result = await env.AI.run(MODEL, {
        max_tokens: 1800,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt(input, previousIssues) },
        ],
        response_format: { type: 'json_object' },
        temperature: attempt === 0 ? 0.7 : 0.45,
      });
      const response =
        typeof result.response === 'string' ? result.response : '';
      const parsed = JSON.parse(extractJson(response));
      const effects = validateEffects(parsed);
      if (effects.length === 0) {
        previousIssues = ['No valid supported effects were generated.'];
        continue;
      }

      const semanticIssues = validateGeneratedEffects(effects, input.prompt);
      if (semanticIssues.length === 0) {
        return json({ effects });
      }

      previousIssues = semanticIssues;
    }

    return error('AI generated effects with invalid ordering.', 502);
  } catch (caughtError) {
    console.warn('AI effect generation failed.', caughtError);
    return error('Unable to generate effects.', 502);
  }
};
