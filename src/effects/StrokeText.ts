import { makeAutoObservable } from 'mobx';
import type { TextPosition } from '../store/fontStore';
import { createEffectId } from './effectId';
import type { FontEffectType, IFontEffect } from './IFontEffect';

export class StrokeText implements IFontEffect {
  id = createEffectId();
  type: FontEffectType = 'stroke';
  color = '#10161A';
  xOffset = 0;
  yOffset = 0;
  lineWidth = 2;
  lineCap: CanvasLineCap = 'butt';
  lineJoin: CanvasLineJoin = 'miter';
  miterLimit = 10;
  lineDash: number[] = [];
  lineDashOffset = 0;

  constructor() {
    makeAutoObservable(this, { draw: false });
  }

  draw(text: string, context: CanvasRenderingContext2D, position: TextPosition) {
    context.save();
    context.strokeStyle = this.color;
    context.lineWidth = this.lineWidth;
    context.lineCap = this.lineCap;
    context.lineJoin = this.lineJoin;
    context.miterLimit = this.miterLimit;
    context.setLineDash(this.lineDash);
    context.lineDashOffset = this.lineDashOffset;
    context.strokeText(
      text,
      position.x + this.xOffset,
      position.y + this.yOffset,
    );
    context.restore();
  }
}
