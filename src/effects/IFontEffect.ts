import type { TextPosition } from '../store/fontStore';

export type FontEffectType =
  | 'fill'
  | 'stroke'
  | 'shadow'
  | 'gradientFill'
  | 'startShadow';
export type FontEffectKind = 'content' | 'post' | 'marker';

export interface ShadowGroup {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
}

export interface EndShadowRenderEffect {
  color: string;
  opacity: number;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  xOffset: number;
  yOffset: number;
}

export interface FontEffectRenderContext {
  text: string;
  position: TextPosition;
  width: number;
  height: number;
  mainCanvas: HTMLCanvasElement;
  mainContext: CanvasRenderingContext2D;
  shadowGroups: ShadowGroup[];
  createBufferCanvas: () => HTMLCanvasElement;
  configureTextContext: (context: CanvasRenderingContext2D) => void;
  startShadowGroup: () => void;
  endShadowGroup: (effect: EndShadowRenderEffect) => void;
  getCurrentTargetContext: () => CanvasRenderingContext2D;
}

export interface IFontEffect {
  id: string;
  type: FontEffectType;
  kind: FontEffectKind;
  opacity: number;
  draw: (renderContext: FontEffectRenderContext) => void;
}
