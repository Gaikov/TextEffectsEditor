import type { IFontEffect } from '../../effects';
import { fontStore } from '../../store/fontStore';
import { UndoArrayChange, UndoPropertyChange, undoService } from '../../undo';

export function previewEffectColor<T extends IFontEffect & { color: string }>(
  effect: T,
  value: string,
) {
  if (effect.color === value) return;

  effect.color = value;
  fontStore.touchEffects();
}

export function commitEffectColor<T extends IFontEffect & { color: string }>(
  effect: T,
  previousValue: string,
  nextValue: string,
  label: string,
) {
  if (previousValue === nextValue) return;

  undoService.record(
    new UndoPropertyChange(
      effect,
      'color',
      previousValue,
      nextValue,
      label,
      fontStore.touchEffects,
    ),
  );
}

export function previewColorArrayValue(
  colors: string[],
  nextColors: string[],
) {
  colors.splice(0, colors.length, ...nextColors);
  fontStore.touchEffects();
}

export function commitColorArrayChange(
  colors: string[],
  previousValue: string[],
  nextValue: string[],
  label: string,
) {
  if (
    previousValue.length === nextValue.length &&
    previousValue.every((item, index) => item === nextValue[index])
  ) {
    return;
  }

  undoService.record(
    new UndoArrayChange(
      colors,
      previousValue,
      nextValue,
      label,
      fontStore.touchEffects,
    ),
  );
}
