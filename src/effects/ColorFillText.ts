import { makeAutoObservable } from 'mobx';
import type { TextPosition } from '../store/fontStore';
import { createEffectId } from './effectId';
import type { FontEffectType, IFontEffect } from './IFontEffect';

export class ColorFillText implements IFontEffect {
  id = createEffectId();
  type: FontEffectType = 'fill';
  color = '#10161A';
  xOffset = 0;
  yOffset = 0;

  constructor() {
    makeAutoObservable(this, { draw: false });
  }

  draw(text: string, context: CanvasRenderingContext2D, position: TextPosition) {
    context.save();
    context.fillStyle = this.color;
    context.fillText(
      text,
      position.x + this.xOffset,
      position.y + this.yOffset,
    );
    context.restore();
  }
}
