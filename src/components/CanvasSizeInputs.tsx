import { type Dispatch, type SetStateAction, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Button,
  Menu,
  MenuDivider,
  MenuItem,
  NumericInput,
  Popover,
  PopoverInteractionKind,
} from '@blueprintjs/core';
import { fontStore } from '../store/fontStore';
import { undoService } from '../undo';
import type { CheckerboardTheme } from '../viewPreferences';

const ROOT_STYLE: React.CSSProperties = {
  background: '#252a31',
  borderBottom: '1px solid #383e47',
};

const MENU_BAR_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: 26,
  padding: '0 8px',
  gap: 2,
};

const TOOLBAR_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: 34,
  padding: '4px 8px',
  gap: 8,
  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
};

const MENU_TARGET_STYLE: React.CSSProperties = {
  appearance: 'none',
  border: 0,
  borderRadius: 2,
  background: 'transparent',
  color: '#F6F7F9',
  cursor: 'default',
  font: 'inherit',
  fontSize: 13,
  lineHeight: '22px',
  padding: '0 8px',
};

const ACTIVE_MENU_TARGET_STYLE: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.12)',
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

const BUTTON_STYLE: React.CSSProperties = {
  minWidth: 0,
};

const SHORTCUT_STYLE: React.CSSProperties = {
  color: '#A7B6C2',
  fontSize: 12,
};

interface Props {
  checkerboardTheme: CheckerboardTheme;
  onAddToGallery: () => void;
  onCenterView: () => void;
  onCopyToClipboard: () => void;
  onExport: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onNewDocument: () => void;
  onOpenGallery: () => void;
  onResetZoom: () => void;
  onSaveSettings: () => void;
  onSetCheckerboardTheme: (theme: CheckerboardTheme) => void;
}

function Shortcut({ children }: { children: string }) {
  return <span style={SHORTCUT_STYLE}>{children}</span>;
}

interface MenuBarItemProps {
  activeMenu: string | null;
  content: React.JSX.Element;
  setActiveMenu: Dispatch<SetStateAction<string | null>>;
  text: string;
}

function MenuBarItem({
  activeMenu,
  content,
  setActiveMenu,
  text,
}: MenuBarItemProps) {
  const active = activeMenu === text;

  return (
    <Popover
      content={content}
      isOpen={active}
      interactionKind={PopoverInteractionKind.HOVER}
      hoverCloseDelay={180}
      hoverOpenDelay={80}
      onInteraction={(nextOpen) => {
        setActiveMenu((currentMenu) => {
          if (nextOpen) return text;
          return currentMenu === text ? null : currentMenu;
        });
      }}
      placement="bottom-start"
      usePortal={false}
    >
      <button
        type="button"
        role="menuitem"
        aria-label={`${text} menu`}
        onMouseEnter={() => setActiveMenu(text)}
        style={{
          ...MENU_TARGET_STYLE,
          ...(active ? ACTIVE_MENU_TARGET_STYLE : null),
        }}
      >
        {text}
      </button>
    </Popover>
  );
}

export default observer(function CanvasSizeInputs({
  checkerboardTheme,
  onAddToGallery,
  onCenterView,
  onCopyToClipboard,
  onExport,
  onExportJson,
  onImportJson,
  onNewDocument,
  onOpenGallery,
  onResetZoom,
  onSaveSettings,
  onSetCheckerboardTheme,
}: Props) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  return (
    <div style={ROOT_STYLE}>
      <div role="menubar" style={MENU_BAR_STYLE}>
        <MenuBarItem
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          text="File"
          content={
            <Menu>
              <MenuItem
                icon="document"
                text="New"
                labelElement={<Shortcut>Ctrl/Cmd+N</Shortcut>}
                onClick={onNewDocument}
              />
              <MenuDivider />
              <MenuItem
                icon="floppy-disk"
                text="Save Settings"
                labelElement={<Shortcut>Ctrl/Cmd+S</Shortcut>}
                onClick={onSaveSettings}
              />
              <MenuDivider />
              <MenuItem
                icon="document-open"
                text="Import JSON"
                labelElement={<Shortcut>Ctrl/Cmd+O</Shortcut>}
                onClick={onImportJson}
              />
              <MenuItem
                icon="document-share"
                text="Export JSON"
                labelElement={<Shortcut>Ctrl/Cmd+Shift+E</Shortcut>}
                onClick={onExportJson}
              />
              <MenuItem
                icon="media"
                text="Export PNG"
                labelElement={<Shortcut>Ctrl/Cmd+E</Shortcut>}
                onClick={onExport}
              />
              <MenuDivider />
              <MenuItem
                icon="clipboard"
                text="Copy to Clipboard"
                labelElement={<Shortcut>Ctrl/Cmd+Shift+C</Shortcut>}
                onClick={onCopyToClipboard}
              />
              <MenuDivider />
              <MenuItem
                icon="add-to-artifact"
                text="Add To Gallery"
                onClick={onAddToGallery}
              />
              <MenuItem
                icon="grid-view"
                text="Gallery"
                onClick={onOpenGallery}
              />
            </Menu>
          }
        />
        <MenuBarItem
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          text="Edit"
          content={
            <Menu>
              <MenuItem
                icon="undo"
                text="Undo"
                labelElement={<Shortcut>Ctrl/Cmd+Z</Shortcut>}
                disabled={!undoService.canUndo}
                onClick={() => undoService.undo()}
              />
              <MenuItem
                icon="redo"
                text="Redo"
                labelElement={<Shortcut>Ctrl/Cmd+Shift+Z</Shortcut>}
                disabled={!undoService.canRedo}
                onClick={() => undoService.redo()}
              />
              <MenuItem
                icon="redo"
                text="Redo Alternate"
                labelElement={<Shortcut>Ctrl/Cmd+Y</Shortcut>}
                disabled={!undoService.canRedo}
                onClick={() => undoService.redo()}
              />
            </Menu>
          }
        />
        <MenuBarItem
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          text="View"
          content={
            <Menu>
              <MenuItem text="Checkerboard">
                <MenuItem
                  icon={checkerboardTheme === 'light' ? 'tick' : 'blank'}
                  text="Light"
                  onClick={() => onSetCheckerboardTheme('light')}
                />
                <MenuItem
                  icon={checkerboardTheme === 'dark' ? 'tick' : 'blank'}
                  text="Dark"
                  onClick={() => onSetCheckerboardTheme('dark')}
                />
              </MenuItem>
              <MenuDivider />
              <MenuItem
                icon="locate"
                text="Center View"
                labelElement={<Shortcut>Ctrl/Cmd+Shift+0</Shortcut>}
                onClick={onCenterView}
              />
              <MenuItem
                icon="zoom-to-fit"
                text="Reset Zoom"
                labelElement={<Shortcut>Ctrl/Cmd+0</Shortcut>}
                onClick={onResetZoom}
              />
            </Menu>
          }
        />
      </div>
      <div style={TOOLBAR_STYLE}>
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
        <Button
          small
          icon="locate"
          text="Center"
          aria-label="Center View"
          title="Center View (Ctrl/Cmd+Shift+0)"
          style={BUTTON_STYLE}
          onClick={onCenterView}
        />
        <Button
          small
          icon="zoom-to-fit"
          text="Reset"
          aria-label="Reset Zoom"
          title="Reset Zoom (Ctrl/Cmd+0)"
          style={BUTTON_STYLE}
          onClick={onResetZoom}
        />
      </div>
    </div>
  );
});
