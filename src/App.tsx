import { useEffect, useRef, useState } from 'react';
import CanvasSizeInputs from './components/CanvasSizeInputs';
import FontCanvas, { type FontCanvasHandle } from './components/FontCanvas';
import FontProperties from './components/FontProperties';
import { getCuratedFonts, loadSystemFonts } from './fonts';
import styles from './App.module.css';

const PANEL_WIDTH_KEY = 'fontEffects.propertiesPanelWidth';
const DEFAULT_PANEL_WIDTH = 240;
const MIN_PANEL_WIDTH = 240;
const MAX_PANEL_WIDTH = 520;

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

export default function App() {
  const canvasRef = useRef<FontCanvasHandle>(null);
  const [fontList, setFontList] = useState<string[]>(getCuratedFonts);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [propertiesPanelWidth, setPropertiesPanelWidth] = useState(loadPanelWidth);
  const [resizingPropertiesPanel, setResizingPropertiesPanel] = useState(false);

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
        onResetZoom={() => canvasRef.current?.resetZoom()}
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
