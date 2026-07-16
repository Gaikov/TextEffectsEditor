import { useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Button,
  Card,
  InputGroup,
  NonIdealState,
  SegmentedControl,
} from '@blueprintjs/core';
import { deserializeFontEffect, type IFontEffect } from '../../effects';
import type { GalleryItem } from '../../gallery/GalleryProvider';
import { drawTextEffects } from '../../render/renderFontEffects';
import { fontStore } from '../../store/fontStore';
import type { CheckerboardTheme } from '../../viewPreferences';
import { enqueueGalleryPreviewRender } from './galleryPreviewScheduler';

const PREVIEW_WIDTH = 960;
const PREVIEW_HEIGHT = 508;
const CHECKER_SIZE = 10;
const CHECKER_COLORS: Record<CheckerboardTheme, [string, string]> = {
  light: ['#E7E9EC', '#FFFFFF'],
  dark: ['#2F343C', '#1F242B'],
};

const ROOT_STYLE: React.CSSProperties = {
  display: 'flex',
  flex: '1 1 auto',
  flexDirection: 'column',
  minHeight: 0,
};

const CONTENT_STYLE: React.CSSProperties = {
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'auto',
  paddingRight: 4,
};

const LIST_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 12,
};

const SEARCH_STYLE: React.CSSProperties = {
  flex: '0 0 auto',
};

const TOOLS_STYLE: React.CSSProperties = {
  alignItems: 'center',
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  marginBottom: 12,
};

const CARD_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const PREVIEW_FRAME_STYLE: React.CSSProperties = {
  width: '100%',
  aspectRatio: `${PREVIEW_WIDTH} / ${PREVIEW_HEIGHT}`,
  border: '1px solid #383e47',
  borderRadius: 4,
  overflow: 'hidden',
};

const PREVIEW_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'block',
};

const PREVIEW_PLACEHOLDER_STYLE: React.CSSProperties = {
  alignItems: 'center',
  color: '#A7B6C2',
  display: 'flex',
  height: '100%',
  justifyContent: 'center',
  width: '100%',
};

const CARD_CONTENT_STYLE: React.CSSProperties = {
  alignItems: 'flex-start',
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  minWidth: 0,
};

const CARD_HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const TITLE_STYLE: React.CSSProperties = {
  color: '#F6F7F9',
  fontWeight: 600,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const DATE_STYLE: React.CSSProperties = {
  color: '#A7B6C2',
  fontSize: 12,
};

const ACTIONS_STYLE: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  justifyContent: 'flex-end',
};

type PreviewRenderStatus = 'idle' | 'queued' | 'rendering' | 'rendered';

export interface GalleryContentProps {
  canModerate?: boolean;
  checkerboardTheme: CheckerboardTheme;
  isLoading?: boolean;
  items: GalleryItem[];
  query: string;
  onApply: (item: GalleryItem) => void;
  onApprove?: (id: string) => void;
  onDelete: (id: string) => void;
  onQueryChange: (query: string) => void;
  onReject?: (id: string) => void;
  onSetCheckerboardTheme: (theme: CheckerboardTheme) => void;
}

function getCheckerboardStyle(
  checkerboardTheme: CheckerboardTheme,
): React.CSSProperties {
  const [checkerA, checkerB] = CHECKER_COLORS[checkerboardTheme];
  return {
    backgroundColor: checkerA,
    backgroundImage: `
      linear-gradient(45deg, ${checkerB} 25%, transparent 25%),
      linear-gradient(-45deg, ${checkerB} 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, ${checkerB} 75%),
      linear-gradient(-45deg, transparent 75%, ${checkerB} 75%)
    `,
    backgroundPosition: `
      0 0,
      0 ${CHECKER_SIZE}px,
      ${CHECKER_SIZE}px -${CHECKER_SIZE}px,
      -${CHECKER_SIZE}px 0
    `,
    backgroundSize: `${CHECKER_SIZE * 2}px ${CHECKER_SIZE * 2}px`,
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function getGalleryDisplayName(item: GalleryItem) {
  return item.name.trim() || 'Untitled';
}

const GalleryPreview = observer(function GalleryPreview({
  checkerboardTheme,
  item,
}: {
  checkerboardTheme: CheckerboardTheme;
  item: GalleryItem;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const renderKeyRef = useRef('');
  const [shouldRender, setShouldRender] = useState(false);
  const [renderStatus, setRenderStatus] =
    useState<PreviewRenderStatus>('idle');
  const text = fontStore.text;
  const fontFamily = fontStore.fontFamily;
  const fontSize = fontStore.fontSize;
  const boldWeight = fontStore.boldWeight;
  const italic = fontStore.italic;
  const canvasWidth = fontStore.canvasWidth;
  const canvasHeight = fontStore.canvasHeight;

  const effects = useMemo(() => {
    if (!shouldRender) return [];
    return item.effects
      .map(deserializeFontEffect)
      .filter((effect): effect is IFontEffect => effect !== null);
  }, [item.effects, shouldRender]);
  const renderKey = useMemo(
    () =>
      JSON.stringify({
        boldWeight,
        canvasHeight,
        canvasWidth,
        effects: item.effects,
        fontFamily,
        fontSize,
        id: item.id,
        italic,
        text,
      }),
    [
      boldWeight,
      canvasHeight,
      canvasWidth,
      fontFamily,
      fontSize,
      item.effects,
      item.id,
      italic,
      text,
    ],
  );

  renderKeyRef.current = renderKey;

  useEffect(() => {
    if (shouldRender) return;

    const preview = previewRef.current;
    if (!preview) return;

    if (typeof IntersectionObserver === 'undefined') {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShouldRender(true);
        observer.disconnect();
      },
      { rootMargin: '180px 0px' },
    );

    observer.observe(preview);
    return () => observer.disconnect();
  }, [shouldRender]);

  useEffect(() => {
    if (!shouldRender) return;

    const activeRenderKey = renderKey;
    setRenderStatus('queued');

    return enqueueGalleryPreviewRender((done) => {
      if (renderKeyRef.current !== activeRenderKey) {
        done();
        return;
      }

      setRenderStatus('rendering');

      window.requestAnimationFrame(() => {
        try {
          if (renderKeyRef.current !== activeRenderKey) return;

          const canvas = canvasRef.current;
          if (!canvas) return;

          canvas.width = PREVIEW_WIDTH;
          canvas.height = PREVIEW_HEIGHT;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);

          const sourceCanvas = document.createElement('canvas');
          sourceCanvas.width = canvasWidth;
          sourceCanvas.height = canvasHeight;
          const sourceContext = sourceCanvas.getContext('2d');
          if (!sourceContext) return;

          drawTextEffects(sourceContext, canvasWidth, canvasHeight, {
            boldWeight,
            effects,
            fontFamily,
            fontSize,
            italic,
            text,
          });

          if (renderKeyRef.current !== activeRenderKey) return;

          const scale = Math.min(
            PREVIEW_WIDTH / canvasWidth,
            PREVIEW_HEIGHT / canvasHeight,
          );
          const w = canvasWidth * scale;
          const h = canvasHeight * scale;
          ctx.drawImage(
            sourceCanvas,
            (PREVIEW_WIDTH - w) / 2,
            (PREVIEW_HEIGHT - h) / 2,
            w,
            h,
          );

          if (renderKeyRef.current === activeRenderKey) {
            setRenderStatus('rendered');
          }
        } finally {
          done();
        }
      });
    });
  }, [
    boldWeight,
    canvasHeight,
    canvasWidth,
    effects,
    fontFamily,
    fontSize,
    italic,
    renderKey,
    shouldRender,
    text,
  ]);

  return (
    <div
      ref={previewRef}
      style={{
        ...PREVIEW_FRAME_STYLE,
        ...getCheckerboardStyle(checkerboardTheme),
      }}
    >
      <canvas
        ref={canvasRef}
        aria-label={`${getGalleryDisplayName(item)} preview`}
        style={renderStatus === 'rendered' ? PREVIEW_STYLE : { display: 'none' }}
      />
      {renderStatus !== 'rendered' && (
        <div style={PREVIEW_PLACEHOLDER_STYLE}>
          {renderStatus === 'rendering'
            ? 'Rendering preview...'
            : renderStatus === 'queued'
              ? 'Preview queued...'
              : 'Preview loads on scroll'}
        </div>
      )}
    </div>
  );
});

export default observer(function GalleryContent({
  canModerate = false,
  checkerboardTheme,
  isLoading = false,
  items,
  query,
  onApply,
  onApprove,
  onDelete,
  onQueryChange,
  onReject,
  onSetCheckerboardTheme,
}: GalleryContentProps) {
  return (
    <div style={ROOT_STYLE}>
      <div style={TOOLS_STYLE}>
        <InputGroup
          leftIcon="search"
          placeholder="Search by name..."
          style={SEARCH_STYLE}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <SegmentedControl
          small
          value={checkerboardTheme}
          onValueChange={(value) => {
            onSetCheckerboardTheme(value as CheckerboardTheme);
          }}
          options={[
            { label: 'Dark', value: 'dark' },
            { label: 'Light', value: 'light' },
          ]}
        />
      </div>
      <div style={CONTENT_STYLE}>
        {isLoading ? (
          <NonIdealState
            icon="cloud-download"
            title="Loading gallery"
            description="Fetching saved effect stacks."
          />
        ) : items.length === 0 && query.trim() === '' ? (
          <NonIdealState
            icon="media"
            title="No gallery items"
            description="Use an Add To Gallery command to save the current effect stack."
          />
        ) : items.length === 0 ? (
          <NonIdealState
            icon="search"
            title="No matching gallery items"
            description="Try a different effect name."
          />
        ) : (
          <div style={LIST_STYLE}>
            {items.map((item) => {
              const displayName = getGalleryDisplayName(item);
              return (
                <Card key={item.id} compact style={CARD_STYLE}>
                  <GalleryPreview
                    checkerboardTheme={checkerboardTheme}
                    item={item}
                  />
                  <div style={CARD_CONTENT_STYLE}>
                    <div style={CARD_HEADER_STYLE}>
                      <div style={TITLE_STYLE}>{displayName}</div>
                      <div style={DATE_STYLE}>
                        {item.authorName ? `${item.authorName} · ` : ''}
                        {formatDate(item.createdAt)}
                        {item.status && item.status !== 'approved'
                          ? ` · ${item.status}`
                          : ''}
                      </div>
                    </div>
                    <div style={ACTIONS_STYLE}>
                      {canModerate && item.status === 'pending' && (
                        <>
                          <Button
                            small
                            icon="tick"
                            text="Approve"
                            onClick={() => onApprove?.(item.id)}
                          />
                          <Button
                            small
                            icon="cross"
                            intent="danger"
                            text="Reject"
                            onClick={() => onReject?.(item.id)}
                          />
                        </>
                      )}
                      <Button
                        small
                        icon="tick"
                        text="Apply"
                        onClick={() => onApply(item)}
                      />
                      {item.canDelete && (
                        <Button
                          small
                          icon="trash"
                          intent="danger"
                          aria-label={`Delete ${displayName}`}
                          onClick={() => onDelete(item.id)}
                        />
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
