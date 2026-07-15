import type { TextPosition } from '../store/fontStore';

export type FontEffectType =
  | 'group'
  | 'fill'
  | 'stroke'
  | 'shadow'
  | 'innerShadow'
  | 'glow'
  | 'blur'
  | 'compositeBlend'
  | 'patternFill'
  | 'noise'
  | 'gradientFill'
  | 'wave'
  | 'distort';

export interface FontEffectRenderContext {
  text: string;
  position: TextPosition;
  width: number;
  height: number;
  context: CanvasRenderingContext2D;
  createBufferCanvas: () => HTMLCanvasElement;
  configureTextContext: (context: CanvasRenderingContext2D) => void;
  renderEffects: (
    effects: IFontEffect[],
    context: CanvasRenderingContext2D,
  ) => void;
}

export interface IFontEffect {
  id: string;
  type: FontEffectType;
  visible: boolean;
  collapsed: boolean;
  opacity: number;
  draw: (renderContext: FontEffectRenderContext) => void;
}
