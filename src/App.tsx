import { useEffect, useRef, useState } from 'react';
import CanvasSizeInputs from './components/CanvasSizeInputs';
import FontCanvas, { type FontCanvasHandle } from './components/FontCanvas';
import FontProperties from './components/FontProperties';
import { getCuratedFonts, loadSystemFonts } from './fonts';
import { fontStore } from './store/fontStore';
import {
  loadSettingsFromLocalStorage,
  saveSettingsToLocalStorage,
} from './store/settingsPersistence';
import { undoService } from './undo';
import styles from './App.module.css';

const PANEL_WIDTH_KEY = 'fontEffects.propertiesPanelWidth';
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
  const [propertiesPanelWidth, setPropertiesPanelWidth] = useState(loadPanelWidth);
  const [resizingPropertiesPanel, setResizingPropertiesPanel] = useState(false);

  const loadSettingsJsonText = async (text: string) => {
    try {
      fontStore.loadJSON(JSON.parse(text));
    } catch (error) {
      console.warn('Unable to import FontEffects JSON settings.', error);
    }
  };

  const exportSettingsJson = async () => {
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
        if (isAbortError(error)) return;
        console.warn('Unable to open JSON export file picker.', error);
      }
    }

    if (writable) {
      await writable.write(blob);
      await writable.close();
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = SETTINGS_FILE_NAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const importSettingsJson = async () => {
    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          multiple: false,
          types: SETTINGS_FILE_TYPES,
        });
        if (!handle) return;

        const file = await handle.getFile();
        await loadSettingsJsonText(await file.text());
      } catch (error) {
        if (isAbortError(error)) return;
        console.warn('Unable to import FontEffects JSON settings.', error);
      }
      return;
    }

    jsonImportInputRef.current?.click();
  };

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
    const handleKeyDown = (e: KeyboardEvent) => {
      const modifierPressed = e.metaKey || e.ctrlKey;
      if (!modifierPressed) return;
      if (isEditableShortcutTarget(e.target)) return;

      const key = e.key.toLowerCase();
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
  }, []);

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
        onCenterView={() => canvasRef.current?.centerView()}
        onExport={() => {
          void canvasRef.current?.exportPng();
        }}
        onExportJson={() => {
          void exportSettingsJson();
        }}
        onImportJson={() => {
          void importSettingsJson();
        }}
        onResetZoom={() => canvasRef.current?.resetZoom()}
        onSaveSettings={saveSettingsToLocalStorage}
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

          void file.text().then(loadSettingsJsonText);
        }}
      />
      <div className={styles.body}>
        <FontCanvas ref={canvasRef} />
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
