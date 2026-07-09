import { makeAutoObservable } from 'mobx';
import { createEffectId } from './effectId';
import { isRecord, readOpacity, type SerializedFontEffect } from './effectSnapshot';
import type {
  FontEffectRenderContext,
  FontEffectType,
  IFontEffect,
} from './IFontEffect';

export class GroupEffect implements IFontEffect {
  id = createEffectId();
  type: FontEffectType = 'group';
  opacity = 1;
  children: IFontEffect[] = [];

  constructor(children: IFontEffect[] = []) {
    this.children = children;
    makeAutoObservable(this, { draw: false });
  }

  addEffect(effect: IFontEffect) {
    this.children.push(effect);
  }

  removeEffect(effectOrId: IFontEffect | string) {
    const id = typeof effectOrId === 'string' ? effectOrId : effectOrId.id;
    this.children = this.children.filter((effect) => effect.id !== id);
  }

  moveEffect(effectOrId: IFontEffect | string, direction: 'up' | 'down') {
    const id = typeof effectOrId === 'string' ? effectOrId : effectOrId.id;
    const index = this.children.findIndex((effect) => effect.id === id);
    if (index === -1) return;

    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= this.children.length) return;

    const nextChildren = [...this.children];
    const [effect] = nextChildren.splice(index, 1);
    nextChildren.splice(nextIndex, 0, effect);
    this.children = nextChildren;
  }

  draw(renderContext: FontEffectRenderContext) {
    const groupCanvas = renderContext.createBufferCanvas();
    const groupContext = groupCanvas.getContext('2d');
    if (!groupContext) return;

    renderContext.configureTextContext(groupContext);
    renderContext.renderEffects(this.children, groupContext);

    renderContext.context.save();
    renderContext.context.globalAlpha = this.opacity;
    renderContext.context.drawImage(groupCanvas, 0, 0);
    renderContext.context.restore();
  }
}

export interface SerializedGroupEffect extends SerializedFontEffect {
  type: 'group';
  opacity: number;
  children: SerializedFontEffect[];
}

export function serializeGroupEffect(
  effect: GroupEffect,
  serializeChild: (effect: IFontEffect) => SerializedFontEffect | null,
): SerializedGroupEffect {
  return {
    type: 'group',
    opacity: effect.opacity,
    children: effect.children
      .map(serializeChild)
      .filter((child): child is SerializedFontEffect => child !== null),
  };
}

export function readGroupChildren(value: unknown) {
  return isRecord(value) && Array.isArray(value.children)
    ? value.children
    : [];
}

export function applySerializedGroupFields(
  effect: GroupEffect,
  value: unknown,
) {
  if (!isRecord(value)) return;
  effect.opacity = readOpacity(value.opacity, effect.opacity);
}
