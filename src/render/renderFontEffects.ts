import type { FontEffectRenderContext, IFontEffect } from '../effects';

export interface FontRenderOptions {
  boldWeight: number;
  effects: IFontEffect[];
  fontFamily: string;
  fontSize: number;
  italic: boolean;
  text: string;
}

export function createBufferCanvas(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

export function configureTextContext(
  ctx: CanvasRenderingContext2D,
  options: FontRenderOptions,
) {
  const italic = options.italic ? 'italic ' : '';
  const weight =
    options.boldWeight !== 400 ? `${options.boldWeight} ` : '';
  ctx.font = `${italic}${weight}${options.fontSize}px "${options.fontFamily}"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
}

export function drawTextEffects(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  options: FontRenderOptions,
) {
  if (options.text.length === 0) return;

  const mainCanvas = createBufferCanvas(w, h);
  const mainContext = mainCanvas.getContext('2d')!;
  configureTextContext(mainContext, options);

  const createConfiguredBuffer = () => {
    const canvas = createBufferCanvas(w, h);
    configureTextContext(canvas.getContext('2d')!, options);
    return canvas;
  };

  const renderEffects = (
    effects: IFontEffect[],
    context: CanvasRenderingContext2D,
  ) => {
    const renderContext: FontEffectRenderContext = {
      text: options.text,
      position: { x: w / 2, y: h / 2 },
      width: w,
      height: h,
      context,
      createBufferCanvas: createConfiguredBuffer,
      configureTextContext: (nextContext) =>
        configureTextContext(nextContext, options),
      renderEffects,
    };

    for (const effect of effects) {
      if (!effect.visible) continue;
      effect.draw(renderContext);
    }
  };

  renderEffects(options.effects, mainContext);
  ctx.drawImage(mainCanvas, 0, 0);
}
