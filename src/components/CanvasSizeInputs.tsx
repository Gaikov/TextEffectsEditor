import { observer } from 'mobx-react-lite';
import { NumericInput, Label } from '@blueprintjs/core';
import { fontStore } from '../store/fontStore';

const BAR_STYLE: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  padding: '4px 8px',
  background: '#252a31',
  borderBottom: '1px solid #383e47',
};

export default observer(function CanvasSizeInputs() {
  return (
    <div style={BAR_STYLE}>
      <Label>
        Width
        <NumericInput
          small
          value={fontStore.canvasWidth}
          onValueChange={fontStore.setCanvasWidth}
          min={1}
          max={4096}
          clampValueOnBlur
          fill
          buttonPosition="none"
        />
      </Label>
      <Label>
        Height
        <NumericInput
          small
          value={fontStore.canvasHeight}
          onValueChange={fontStore.setCanvasHeight}
          min={1}
          max={4096}
          clampValueOnBlur
          fill
          buttonPosition="none"
        />
      </Label>
    </div>
  );
});
