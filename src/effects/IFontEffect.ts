import type { TextPosition } from '../store/fontStore';

export type FontEffectType = 'fill' | 'stroke';

export interface IFontEffect {
  id: string;
  type: FontEffectType;
  draw: (
    text: string,
    context: CanvasRenderingContext2D,
    position: TextPosition,
  ) => void;
}
