import { type Dispatch, type SetStateAction, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  AnchorButton,
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  Menu,
  MenuDivider,
  MenuItem,
  Popover,
  PopoverInteractionKind,
} from '@blueprintjs/core';
import type { AuthUser } from '../auth/authClient';
import NumberInput from './NumberInput';
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

const ABOUT_ROW_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '110px minmax(0, 1fr)',
  gap: 10,
  lineHeight: '24px',
};

const ABOUT_LABEL_STYLE: React.CSSProperties = {
  color: '#A7B6C2',
  whiteSpace: 'nowrap',
};

const ABOUT_LINK_STYLE: React.CSSProperties = {
  color: '#8ABBFF',
};

const LICENSE_PARAGRAPH_STYLE: React.CSSProperties = {
  marginTop: 0,
};

const DEVELOPER_SITE_URL = 'https://grom-games.com';
const FONT_EFFECTS_MODULE_URL = 'https://www.npmjs.com/package/grom-font-effects';
const DONATION_EMAIL = 'grom.games@gmail.com';
const PAYPAL_DONATE_URL =
  'https://www.paypal.com/donate/?business=grom.games%40gmail.com&currency_code=USD';

interface Props {
  authUser: AuthUser | null;
  checkerboardTheme: CheckerboardTheme;
  onAddToGlobalGallery: () => void;
  onAddToLocalGallery: () => void;
  onCenterView: () => void;
  onCopyToClipboard: () => void;
  onExport: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onNewDocument: () => void;
  onOpenGlobalGallery: () => void;
  onOpenLocalGallery: () => void;
  onOpenLogin: () => void;
  onResetZoom: () => void;
  onSaveSettings: () => void;
  onSetCheckerboardTheme: (theme: CheckerboardTheme) => void;
  onSignOut: () => void;
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
  authUser,
  checkerboardTheme,
  onAddToGlobalGallery,
  onAddToLocalGallery,
  onCenterView,
  onCopyToClipboard,
  onExport,
  onExportJson,
  onImportJson,
  onNewDocument,
  onOpenGlobalGallery,
  onOpenLocalGallery,
  onOpenLogin,
  onResetZoom,
  onSaveSettings,
  onSetCheckerboardTheme,
  onSignOut,
}: Props) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [licenseOpen, setLicenseOpen] = useState(false);

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
          text="Gallery"
          content={
            <Menu>
              <MenuItem
                icon="add-to-artifact"
                text="Add To Local Gallery"
                onClick={onAddToLocalGallery}
              />
              <MenuItem
                icon="grid-view"
                text="Show Local Gallery"
                onClick={onOpenLocalGallery}
              />
              <MenuDivider />
              <MenuItem
                icon="cloud-upload"
                text="Add To Global Gallery"
                onClick={onAddToGlobalGallery}
              />
              <MenuItem
                icon="cloud-download"
                text="Show Global Gallery"
                onClick={onOpenGlobalGallery}
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
        <MenuBarItem
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          text="Account"
          content={
            <Menu>
              {authUser ? (
                <>
                  <MenuItem
                    icon="user"
                    text={authUser.displayName || authUser.email}
                    disabled
                  />
                  <MenuItem
                    icon="envelope"
                    text={authUser.email}
                    disabled
                  />
                  <MenuItem
                    icon={authUser.role === 'admin' ? 'shield' : 'person'}
                    text={`Role: ${authUser.role}`}
                    disabled
                  />
                  <MenuDivider />
                  <MenuItem
                    icon="log-out"
                    text="Sign out"
                    onClick={onSignOut}
                  />
                </>
              ) : (
                <MenuItem
                  icon="log-in"
                  text="Sign in"
                  onClick={onOpenLogin}
                />
              )}
            </Menu>
          }
        />
        <MenuBarItem
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          text="Help"
          content={
            <Menu>
              <MenuItem
                icon="endorsed"
                text="License"
                onClick={() => setLicenseOpen(true)}
              />
              <MenuItem
                icon="info-sign"
                text="About"
                onClick={() => setAboutOpen(true)}
              />
            </Menu>
          }
        />
      </div>
      <div style={TOOLBAR_STYLE}>
        <div style={FIELD_STYLE}>
          <span style={LABEL_STYLE}>Width</span>
          <NumberInput
            small
            style={INPUT_STYLE}
            value={fontStore.canvasWidth}
            onChange={fontStore.setCanvasWidth}
            min={1}
            max={4096}
            allowFloat={false}
            fill
          />
        </div>
        <div style={FIELD_STYLE}>
          <span style={LABEL_STYLE}>Height</span>
          <NumberInput
            small
            style={INPUT_STYLE}
            value={fontStore.canvasHeight}
            onChange={fontStore.setCanvasHeight}
            min={1}
            max={4096}
            allowFloat={false}
            fill
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
      <Dialog
        isOpen={licenseOpen}
        onClose={() => setLicenseOpen(false)}
        title="License"
      >
        <DialogBody>
          <p style={LICENSE_PARAGRAPH_STYLE}>
            The hosted Text Effects Editor application is free for everyone to
            use. Images and JSON presets created with the application belong to
            their creators.
          </p>
          <p>
            The source code is licensed under the PolyForm Noncommercial License
            1.0.0. Personal, educational, hobby, and other non-commercial use of
            the source code is allowed with attribution to Roman Gaikov / GROm
            Games.
          </p>
          <p>
            Commercial use of the source code, modified versions, forks, hosted
            copies, or integration into paid products or services requires a
            separate commercial license agreement.
          </p>
          <div style={ABOUT_ROW_STYLE}>
            <span style={ABOUT_LABEL_STYLE}>Contact</span>
            <a
              href={`mailto:${DONATION_EMAIL}`}
              style={ABOUT_LINK_STYLE}
            >
              {DONATION_EMAIL}
            </a>
          </div>
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <AnchorButton
                href="https://polyformproject.org/licenses/noncommercial/1.0.0"
                rel="noreferrer"
                target="_blank"
                text="PolyForm License"
              />
              <Button text="Close" onClick={() => setLicenseOpen(false)} />
            </>
          }
        />
      </Dialog>
      <Dialog
        isOpen={aboutOpen}
        onClose={() => setAboutOpen(false)}
        title="About Text Effects Editor"
      >
        <DialogBody>
          <div style={ABOUT_ROW_STYLE}>
            <span style={ABOUT_LABEL_STYLE}>Version</span>
            <span>v{__APP_VERSION__}</span>
          </div>
          <div style={ABOUT_ROW_STYLE}>
            <span style={ABOUT_LABEL_STYLE}>Developer</span>
            <span>Roman Gaikov</span>
          </div>
          <div style={ABOUT_ROW_STYLE}>
            <span style={ABOUT_LABEL_STYLE}>Website</span>
            <a
              href={DEVELOPER_SITE_URL}
              rel="noreferrer"
              style={ABOUT_LINK_STYLE}
              target="_blank"
            >
              grom-games.com
            </a>
          </div>
          <div style={ABOUT_ROW_STYLE}>
            <span style={ABOUT_LABEL_STYLE}>Effects</span>
            <span>
              Text rendering by{' '}
              <a
                href={FONT_EFFECTS_MODULE_URL}
                rel="noreferrer"
                style={ABOUT_LINK_STYLE}
                target="_blank"
              >
                grom-font-effects
              </a>
            </span>
          </div>
          <div style={ABOUT_ROW_STYLE}>
            <span style={ABOUT_LABEL_STYLE}>Donations</span>
            <a
              href={PAYPAL_DONATE_URL}
              rel="noreferrer"
              style={ABOUT_LINK_STYLE}
              target="_blank"
            >
              PayPal: {DONATION_EMAIL}
            </a>
          </div>
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <AnchorButton
                href={DEVELOPER_SITE_URL}
                rel="noreferrer"
                target="_blank"
                text="Website"
              />
              <AnchorButton
                href={FONT_EFFECTS_MODULE_URL}
                rel="noreferrer"
                target="_blank"
                text="Module"
              />
              <AnchorButton
                href={PAYPAL_DONATE_URL}
                intent="primary"
                rel="noreferrer"
                target="_blank"
                text="Donate"
              />
              <Button text="Close" onClick={() => setAboutOpen(false)} />
            </>
          }
        />
      </Dialog>
    </div>
  );
});
