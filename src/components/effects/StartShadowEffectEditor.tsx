import { observer } from 'mobx-react-lite';
import type { StartShadowEffect } from '../../effects';
import { EffectEditorFrame } from './EffectEditorFrame';
import type { EffectEditorProps } from './effectEditorRegistry';

export const StartShadowEffectEditor = observer(
  function StartShadowEffectEditor({
    effect,
    index,
    count,
  }: EffectEditorProps<StartShadowEffect>) {
    return (
      <EffectEditorFrame
        effect={effect}
        index={index}
        count={count}
        title="Start Shadow"
      />
    );
  },
);
