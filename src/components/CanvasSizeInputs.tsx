import { observer } from 'mobx-react-lite';
import { Button, NumericInput, Tooltip } from '@blueprintjs/core';
import { fontStore } from '../store/fontStore';

const BAR_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 8px',
  background: '#252a31',
  borderBottom: '1px solid #383e47',
};

const FIELD_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  whiteSpace: 'nowrap',
  height: 24,
};

const LABEL_STYLE: React.CSSProperties = {
  lineHeight: '24px',
};

const INPUT_STYLE: React.CSSProperties = {
  width: 148,
};

const ACTIONS_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const ICON_BUTTON_STYLE: React.CSSProperties = {
  minWidth: 30,
};

interface Props {
  onCenterView: () => void;
  onResetZoom: () => void;
}

export default observer(function CanvasSizeInputs({
  onCenterView,
  onResetZoom,
}: Props) {
  return (
    <div style={BAR_STYLE}>
      <div style={FIELD_STYLE}>
        <span style={LABEL_STYLE}>Width</span>
        <NumericInput
          small
          style={INPUT_STYLE}
          value={fontStore.canvasWidth}
          onValueChange={fontStore.setCanvasWidth}
          min={1}
          max={4096}
          clampValueOnBlur
          fill
          buttonPosition="none"
        />
      </div>
      <div style={FIELD_STYLE}>
        <span style={LABEL_STYLE}>Height</span>
        <NumericInput
          small
          style={INPUT_STYLE}
          value={fontStore.canvasHeight}
          onValueChange={fontStore.setCanvasHeight}
          min={1}
          max={4096}
          clampValueOnBlur
          fill
          buttonPosition="none"
        />
      </div>
      <div style={ACTIONS_STYLE}>
        <Tooltip content="Center View" compact>
          <Button
            small
            icon="locate"
            aria-label="Center View"
            style={ICON_BUTTON_STYLE}
            onClick={onCenterView}
          />
        </Tooltip>
        <Tooltip content="Reset Zoom" compact>
          <Button
            small
            icon="zoom-to-fit"
            aria-label="Reset Zoom"
            style={ICON_BUTTON_STYLE}
            onClick={onResetZoom}
          />
        </Tooltip>
      </div>
    </div>
  );
});
