import { Button, HTMLSelect } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import type { GradientFillText } from '../../effects';
import {
  EffectColorInput,
  EffectNumberInput,
  EffectOpacityRow,
  EffectRow,
} from './EffectEditorFields';
import { EffectEditorFrame } from './EffectEditorFrame';
import type { EffectEditorProps } from './effectEditorRegistry';
import styles from '../FontProperties.module.css';

function createInsertedColor(colors: string[]) {
  return colors[colors.length - 1] ?? '#10161A';
}

export const GradientFillTextEditor = observer(function GradientFillTextEditor({
  effect,
  index,
  count,
}: EffectEditorProps<GradientFillText>) {
  return (
    <EffectEditorFrame
      effect={effect}
      index={index}
      count={count}
      title="Gradient Fill"
    >
      {effect.colors.map((color, colorIndex) => (
        <EffectRow
          key={`${colorIndex}-${effect.colors.length}`}
          label={`Color ${colorIndex + 1}`}
        >
          <div className={styles.effectInlineActions}>
            <EffectColorInput
              color={color}
              onChange={(value) => {
                effect.colors = effect.colors.map((item, index) =>
                  index === colorIndex ? value : item,
                );
              }}
            />
            <Button
              small
              minimal
              icon="trash"
              intent="danger"
              aria-label="Delete gradient color"
              disabled={effect.colors.length <= 1}
              onClick={() => {
                effect.colors = effect.colors.filter(
                  (_, index) => index !== colorIndex,
                );
              }}
            />
          </div>
        </EffectRow>
      ))}
      <EffectRow label="Colors">
        <Button
          small
          icon="plus"
          text="Add Color"
          onClick={() => {
            effect.colors = [
              ...effect.colors,
              createInsertedColor(effect.colors),
            ];
          }}
        />
      </EffectRow>
      <EffectOpacityRow
        value={effect.opacity}
        onChange={(value) => {
          effect.opacity = value;
        }}
      />
      <EffectRow label="Direction">
        <HTMLSelect
          fill
          minimal
          value={effect.direction}
          onChange={(e) => {
            effect.direction = e.target.value as GradientFillText['direction'];
          }}
          options={[
            { value: 'horizontal', label: 'Horizontal' },
            { value: 'vertical', label: 'Vertical' },
          ]}
        />
      </EffectRow>
      <EffectRow label="X offset">
        <EffectNumberInput
          value={effect.xOffset}
          onChange={(value) => {
            effect.xOffset = value;
          }}
        />
      </EffectRow>
      <EffectRow label="Y offset">
        <EffectNumberInput
          value={effect.yOffset}
          onChange={(value) => {
            effect.yOffset = value;
          }}
        />
      </EffectRow>
    </EffectEditorFrame>
  );
});
