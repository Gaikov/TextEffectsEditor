import { useCallback, useEffect, useRef, useState } from 'react';
import CanvasSizeInputs from './components/CanvasSizeInputs';
import AddToGalleryDialog from './components/gallery/AddToGalleryDialog';
import EffectsGalleryDialog from './components/gallery/EffectsGalleryDialog';
import FontCanvas, { type FontCanvasHandle } from './components/FontCanvas';
import FontProperties from './components/FontProperties';
import { getCuratedFonts, loadSystemFonts } from './fonts';
import {
  createEffectsGalleryItem,
  loadEffectsGallery,
  saveEffectsGallery,
  type EffectsGalleryItem,
} from './gallery/effectsGallery';
import { fontStore } from './store/fontStore';
import {
  loadSettingsFromLocalStorage,
  saveSettingsToLocalStorage,
} from './store/settingsPersistence';
import { showFailureToast, showSuccessToast } from './toasts/appToaster';
import { undoService } from './undo';
import type { CheckerboardTheme } from './viewPreferences';
import styles from './App.module.css';

const PANEL_WIDTH_KEY = 'fontEffects.propertiesPanelWidth';
const CHECKERBOARD_THEME_KEY = 'fontEffects.checkerboardTheme';
const DEFAULT_PANEL_WIDTH = 240;
const MIN_PANEL_WIDTH = 240;
const MAX_PANEL_WIDTH = 520;
const SETTINGS_FILE_NAME = 'font-effects.json';
const SETTINGS_FILE_TYPES = [
  {
    description: 'FontEffects JSON',
    accept: { 'application/json': ['.json'] },
  },
];
type CommandResult = boolean | null;

function clampPanelWidth(value: number) {
  return Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, value));
}

function loadPanelWidth() {
  const storedValue = window.localStorage.getItem(PANEL_WIDTH_KEY);
  if (storedValue == null) return DEFAULT_PANEL_WIDTH;

  const parsedValue = Number(storedValue);
  return Number.isFinite(parsedValue)
    ? clampPanelWidth(parsedValue)
    : DEFAULT_PANEL_WIDTH;
}

function loadCheckerboardTheme(): CheckerboardTheme {
  const storedValue = window.localStorage.getItem(CHECKERBOARD_THEME_KEY);
  return storedValue === 'dark' ? 'dark' : 'light';
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function isEditableShortcutTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

export default function App() {
  useState(() => {
    loadSettingsFromLocalStorage();
    return undefined;
  });

  const canvasRef = useRef<FontCanvasHandle>(null);
  const jsonImportInputRef = useRef<HTMLInputElement>(null);
  const [fontList, setFontList] = useState<string[]>(getCuratedFonts);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [galleryItems, setGalleryItems] = useState<EffectsGalleryItem[]>(
    loadEffectsGallery,
  );
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [addToGalleryOpen, setAddToGalleryOpen] = useState(false);
  const [checkerboardTheme, setCheckerboardTheme] =
    useState<CheckerboardTheme>(loadCheckerboardTheme);
  const [propertiesPanelWidth, setPropertiesPanelWidth] = useState(loadPanelWidth);
  const [resizingPropertiesPanel, setResizingPropertiesPanel] = useState(false);

  const loadSettingsJsonText = useCallback((text: string) => {
    try {
      return fontStore.loadJSON(JSON.parse(text));
    } catch (error) {
      console.warn('Unable to import FontEffects JSON settings.', error);
      return false;
    }
  }, []);

  const exportSettingsJson = useCallback(async (): Promise<CommandResult> => {
    const blob = new Blob(
      [JSON.stringify(fontStore.toJSON(), null, 2)],
      { type: 'application/json' },
    );
    let writable: FileSystemWritableFileStream | undefined;

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: SETTINGS_FILE_NAME,
          types: SETTINGS_FILE_TYPES,
        });
        writable = await handle.createWritable();
      } catch (error) {
        if (isAbortError(error)) return null;
        console.warn('Unable to open JSON export file picker.', error);
      }
    }

    try {
      if (writable) {
        await writable.write(blob);
        await writable.close();
        return true;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = SETTINGS_FILE_NAME;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.warn('Unable to export FontEffects JSON settings.', error);
      return false;
    }
  }, []);

  const importSettingsJson = useCallback(async (): Promise<CommandResult> => {
    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          multiple: false,
          types: SETTINGS_FILE_TYPES,
        });
        if (!handle) return null;

        const file = await handle.getFile();
        return loadSettingsJsonText(await file.text());
      } catch (error) {
        if (isAbortError(error)) return null;
        console.warn('Unable to import FontEffects JSON settings.', error);
        return false;
      }
    }

    jsonImportInputRef.current?.click();
    return null;
  }, [loadSettingsJsonText]);

  const saveSettings = useCallback(() => {
    if (saveSettingsToLocalStorage()) {
      showSuccessToast('Settings saved');
    } else {
      showFailureToast('Unable to save settings');
    }
  }, []);

  const newDocument = useCallback(() => {
    fontStore.newDocument();
    showSuccessToast('New document created');
  }, []);

  const exportJsonWithFeedback = useCallback(async () => {
    const result = await exportSettingsJson();
    if (result === true) {
      showSuccessToast('JSON exported');
    } else if (result === false) {
      showFailureToast('Unable to export JSON');
    }
  }, [exportSettingsJson]);

  const importJsonWithFeedback = useCallback(async () => {
    const result = await importSettingsJson();
    if (result === true) {
      showSuccessToast('JSON imported');
    } else if (result === false) {
      showFailureToast('Unable to import JSON');
    }
  }, [importSettingsJson]);

  const exportPng = useCallback(async () => {
    const result = await canvasRef.current?.exportPng();
    if (result === true) {
      showSuccessToast('PNG exported');
    } else if (result === false) {
      showFailureToast('Unable to export PNG');
    }
  }, []);

  const copyPngToClipboard = useCallback(async () => {
    const result = await canvasRef.current?.copyPngToClipboard();
    if (result === true) {
      showSuccessToast('PNG copied to clipboard');
    } else {
      showFailureToast('Unable to copy PNG to clipboard');
    }
  }, []);

  const addToGallery = useCallback((name: string) => {
    const effects = fontStore.toJSON().effects;
    if (effects.length === 0) {
      showFailureToast('Nothing to add to gallery');
      return;
    }

    const item = createEffectsGalleryItem(effects, name);
    setGalleryItems((items) => {
      const nextItems = [item, ...items];
      saveEffectsGallery(nextItems);
      return nextItems;
    });
    showSuccessToast('Added to gallery');
  }, []);

  const applyGalleryItem = useCallback((item: EffectsGalleryItem) => {
    if (fontStore.replaceEffectsFromSerialized(item.effects, 'Apply gallery effect')) {
      setGalleryOpen(false);
      showSuccessToast('Gallery item applied');
    } else {
      showFailureToast('Unable to apply gallery item');
    }
  }, []);

  const deleteGalleryItem = useCallback((id: string) => {
    if (!galleryItems.some((item) => item.id === id)) {
      showFailureToast('Unable to delete gallery item');
      return;
    }

    setGalleryItems((items) => {
      const nextItems = items.filter((item) => item.id !== id);
      saveEffectsGallery(nextItems);
      return nextItems;
    });
    showSuccessToast('Gallery item deleted');
  }, [galleryItems]);

  const centerView = useCallback(() => {
    canvasRef.current?.centerView();
  }, []);

  const resetZoom = useCallback(() => {
    canvasRef.current?.resetZoom();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const systemFonts = await loadSystemFonts();
        if (!cancelled) {
          setFontList(systemFonts);
          setFontsLoaded(true);
        }
      } catch {
        if (!cancelled) setFontsLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(PANEL_WIDTH_KEY, String(propertiesPanelWidth));
  }, [propertiesPanelWidth]);

  useEffect(() => {
    window.localStorage.setItem(CHECKERBOARD_THEME_KEY, checkerboardTheme);
  }, [checkerboardTheme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const modifierPressed = e.metaKey || e.ctrlKey;
      if (!modifierPressed) return;

      const key = e.key.toLowerCase();
      const editableTarget = isEditableShortcutTarget(e.target);
      if (key === 'n') {
        e.preventDefault();
        newDocument();
        return;
      }

      if (key === 'c' && e.shiftKey) {
        e.preventDefault();
        void copyPngToClipboard();
        return;
      }

      if (key === 's') {
        e.preventDefault();
        saveSettings();
        return;
      }

      if (key === 'o') {
        e.preventDefault();
        void importJsonWithFeedback();
        return;
      }

      if (key === 'e' && e.shiftKey) {
        e.preventDefault();
        void exportJsonWithFeedback();
        return;
      }

      if (key === 'e') {
        e.preventDefault();
        void exportPng();
        return;
      }

      if (key === '0' && e.shiftKey) {
        e.preventDefault();
        centerView();
        return;
      }

      if (key === '0') {
        e.preventDefault();
        resetZoom();
        return;
      }

      if (editableTarget) return;

      if (key === 'z' && e.shiftKey) {
        e.preventDefault();
        undoService.redo();
        return;
      }

      if (key === 'z') {
        e.preventDefault();
        undoService.undo();
        return;
      }

      if (key === 'y') {
        e.preventDefault();
        undoService.redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    centerView,
    copyPngToClipboard,
    exportPng,
    exportJsonWithFeedback,
    importJsonWithFeedback,
    newDocument,
    resetZoom,
    saveSettings,
  ]);

  useEffect(() => {
    if (!resizingPropertiesPanel) return;

    const handlePointerMove = (e: PointerEvent) => {
      setPropertiesPanelWidth(clampPanelWidth(window.innerWidth - e.clientX));
    };
    const stopResize = () => setResizingPropertiesPanel(false);

    document.body.classList.add(styles.resizingPropertiesPanel);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResize);
    window.addEventListener('pointercancel', stopResize);

    return () => {
      document.body.classList.remove(styles.resizingPropertiesPanel);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResize);
      window.removeEventListener('pointercancel', stopResize);
    };
  }, [resizingPropertiesPanel]);

  return (
    <div className={styles.root}>
      <CanvasSizeInputs
        onAddToGallery={() => setAddToGalleryOpen(true)}
        onCenterView={centerView}
        onCopyToClipboard={() => {
          void copyPngToClipboard();
        }}
        onExport={() => {
          void exportPng();
        }}
        onExportJson={() => {
          void exportJsonWithFeedback();
        }}
        onImportJson={() => {
          void importJsonWithFeedback();
        }}
        onNewDocument={newDocument}
        onOpenGallery={() => setGalleryOpen(true)}
        onResetZoom={resetZoom}
        onSaveSettings={saveSettings}
        checkerboardTheme={checkerboardTheme}
        onSetCheckerboardTheme={setCheckerboardTheme}
      />
      <AddToGalleryDialog
        isOpen={addToGalleryOpen}
        onClose={() => setAddToGalleryOpen(false)}
        onSave={addToGallery}
      />
      <EffectsGalleryDialog
        isOpen={galleryOpen}
        items={galleryItems}
        onApply={applyGalleryItem}
        onClose={() => setGalleryOpen(false)}
        onDelete={deleteGalleryItem}
      />
      <input
        ref={jsonImportInputRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;

          void file.text().then((text) => {
            if (loadSettingsJsonText(text)) {
              showSuccessToast('JSON imported');
            } else {
              showFailureToast('Unable to import JSON');
            }
          }).catch((error) => {
            console.warn('Unable to read FontEffects JSON settings.', error);
            showFailureToast('Unable to import JSON');
          });
        }}
      />
      <div className={styles.body}>
        <FontCanvas ref={canvasRef} checkerboardTheme={checkerboardTheme} />
        <div
          className={`${styles.propertiesResizeHandle} ${
            resizingPropertiesPanel ? styles.propertiesResizeHandleActive : ''
          }`}
          aria-label="Resize properties panel"
          role="separator"
          aria-orientation="vertical"
          aria-valuemin={MIN_PANEL_WIDTH}
          aria-valuemax={MAX_PANEL_WIDTH}
          aria-valuenow={propertiesPanelWidth}
          onPointerDown={(e) => {
            e.preventDefault();
            setResizingPropertiesPanel(true);
          }}
        />
        <FontProperties
          fontList={fontList}
          fontsLoaded={fontsLoaded}
          width={propertiesPanelWidth}
        />
      </div>
    </div>
  );
}
