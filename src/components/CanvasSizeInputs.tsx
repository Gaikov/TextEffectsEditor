import { observer } from 'mobx-react-lite';
import {
  Button,
  Menu,
  MenuDivider,
  MenuItem,
  NumericInput,
  Popover,
  Tooltip,
} from '@blueprintjs/core';
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

const FILE_ACTION_STYLE: React.CSSProperties = {
  marginLeft: 'auto',
};

const BUTTON_STYLE: React.CSSProperties = {
  minWidth: 0,
};

interface Props {
  onCenterView: () => void;
  onExport: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onResetZoom: () => void;
  onSaveSettings: () => void;
}

export default observer(function CanvasSizeInputs({
  onCenterView,
  onExport,
  onExportJson,
  onImportJson,
  onResetZoom,
  onSaveSettings,
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
            text="Center"
            aria-label="Center View"
            style={BUTTON_STYLE}
            onClick={onCenterView}
          />
        </Tooltip>
        <Tooltip content="Reset Zoom" compact>
          <Button
            small
            icon="zoom-to-fit"
            text="Reset"
            aria-label="Reset Zoom"
            style={BUTTON_STYLE}
            onClick={onResetZoom}
          />
        </Tooltip>
      </div>
      <Popover
        content={
          <Menu>
            <MenuItem
              icon="floppy-disk"
              text="Save Settings"
              onClick={onSaveSettings}
            />
            <MenuDivider />
            <MenuItem
              icon="document-open"
              text="Import JSON"
              onClick={onImportJson}
            />
            <MenuItem
              icon="document-share"
              text="Export JSON"
              onClick={onExportJson}
            />
            <MenuItem
              icon="media"
              text="Export PNG"
              onClick={onExport}
            />
          </Menu>
        }
        placement="bottom-end"
      >
        <Button
          small
          icon="folder-open"
          text="File"
          aria-label="Open file actions"
          rightIcon="caret-down"
          style={{ ...BUTTON_STYLE, ...FILE_ACTION_STYLE }}
        />
      </Popover>
    </div>
  );
});
