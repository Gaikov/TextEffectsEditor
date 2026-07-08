import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { autorun } from 'mobx';
import { fontStore } from '../store/fontStore';
import styles from './FontCanvas.module.css';

const CHECKER_SIZE = 16;
const CHECKER_A = '#F0F0F0';
const CHECKER_B = '#FFFFFF';

function drawText(ctx: CanvasRenderingContext2D, w: number, h: number) {
  if (fontStore.text.length === 0) return;

  const italic = fontStore.italic ? 'italic ' : '';
  const weight = fontStore.boldWeight !== 400 ? `${fontStore.boldWeight} ` : '';
  ctx.font = `${italic}${weight}${fontStore.fontSize}px "${fontStore.fontFamily}"`;
  ctx.fillStyle = fontStore.fontColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(fontStore.text, w / 2, h / 2);
}

function draw(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  const w = fontStore.canvasWidth;
  const h = fontStore.canvasHeight;

  canvas.width = w;
  canvas.height = h;

  for (let y = 0; y < h; y += CHECKER_SIZE) {
    for (let x = 0; x < w; x += CHECKER_SIZE) {
      const even =
        ((x / CHECKER_SIZE) | 0) % 2 === ((y / CHECKER_SIZE) | 0) % 2;
      ctx.fillStyle = even ? CHECKER_A : CHECKER_B;
      ctx.fillRect(x, y, CHECKER_SIZE, CHECKER_SIZE);
    }
  }

  drawText(ctx, w, h);
}

function createExportCanvas() {
  const canvas = document.createElement('canvas');
  const w = fontStore.canvasWidth;
  const h = fontStore.canvasHeight;
  canvas.width = w;
  canvas.height = h;
  drawText(canvas.getContext('2d')!, w, h);
  return canvas;
}

export interface FontCanvasHandle {
  centerView: () => void;
  exportPng: () => Promise<void>;
  resetZoom: () => void;
}

export default forwardRef<FontCanvasHandle>(function FontCanvas(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef({ zoom: 1, ox: 0, oy: 0 });
  const [dragging, setDragging] = useState(false);
  const anchorRef = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  const applyTransform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const v = viewRef.current;
    canvas.style.transform = `translate(${v.ox}px, ${v.oy}px) scale(${v.zoom})`;
  }, []);

  const centerView = useCallback(
    (zoom = viewRef.current.zoom) => {
      const container = containerRef.current;
      if (!container) return;

      const v = viewRef.current;
      v.zoom = zoom;
      v.ox = Math.max(0, (container.clientWidth - fontStore.canvasWidth * zoom) / 2);
      v.oy = Math.max(0, (container.clientHeight - fontStore.canvasHeight * zoom) / 2);
      applyTransform();
    },
    [applyTransform],
  );

  const resetZoom = useCallback(() => {
    centerView(1);
  }, [centerView]);

  const exportPng = useCallback(async () => {
    let writable: FileSystemWritableFileStream | undefined;

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'font-effects.png',
          types: [
            {
              description: 'PNG image',
              accept: { 'image/png': ['.png'] },
            },
          ],
        });
        writable = await handle.createWritable();
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }

    const canvas = createExportCanvas();
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => {
        if (value) {
          resolve(value);
        } else {
          reject(new Error('Unable to export canvas as PNG.'));
        }
      }, 'image/png');
    });

    if (writable) {
      await writable.write(blob);
      await writable.close();
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'font-effects.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, []);

  useImperativeHandle(ref, () => ({
    centerView: () => centerView(),
    exportPng,
    resetZoom,
  }), [centerView, exportPng, resetZoom]);

  // pixel redraw on content change
  useEffect(() => {
    return autorun(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      draw(canvas);
    });
  }, []);

  // center canvas on mount / canvas resize
  useEffect(() => {
    return autorun(() => {
      fontStore.canvasWidth;
      fontStore.canvasHeight;
      centerView();
    });
  }, [centerView]);

  // wheel → zoom (non-passive, native)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const v = viewRef.current;
      const prev = v.zoom;
      const step = e.deltaY < 0 ? 0.1 : -0.1;
      const next = Math.max(0.1, Math.min(10, prev + step));
      if (next === prev) return;

      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      v.ox = mx - (mx - v.ox) * (next / prev);
      v.oy = my - (my - v.oy) * (next / prev);
      v.zoom = next;
      applyTransform();
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [applyTransform]);

  // drag → pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setDragging(true);
    const v = viewRef.current;
    anchorRef.current = { mx: e.clientX, my: e.clientY, ox: v.ox, oy: v.oy };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const a = anchorRef.current;
      const v = viewRef.current;
      v.ox = a.ox + (e.clientX - a.mx);
      v.oy = a.oy + (e.clientY - a.my);
      applyTransform();
    },
    [dragging, applyTransform],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${dragging ? styles.grabbing : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transformOrigin: '0 0',
          display: 'block',
        }}
      />
    </div>
  );
});
