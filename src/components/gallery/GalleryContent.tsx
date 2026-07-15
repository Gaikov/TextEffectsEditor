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

const PREVIEW_STYLE: React.CSSProperties = {
  width: '100%',
  aspectRatio: `${PREVIEW_WIDTH} / ${PREVIEW_HEIGHT}`,
  border: '1px solid #383e47',
  borderRadius: 4,
  display: 'block',
};

const PREVIEW_PLACEHOLDER_STYLE: React.CSSProperties = {
  ...PREVIEW_STYLE,
  alignItems: 'center',
  backgroundColor: '#252A31',
  color: '#A7B6C2',
  display: 'flex',
  justifyContent: 'center',
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

function drawChecker(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  checkerboardTheme: CheckerboardTheme,
) {
  const [checkerA, checkerB] = CHECKER_COLORS[checkerboardTheme];
  for (let y = 0; y < h; y += CHECKER_SIZE) {
    for (let x = 0; x < w; x += CHECKER_SIZE) {
      const even =
        ((x / CHECKER_SIZE) | 0) % 2 === ((y / CHECKER_SIZE) | 0) % 2;
      ctx.fillStyle = even ? checkerA : checkerB;
      ctx.fillRect(x, y, CHECKER_SIZE, CHECKER_SIZE);
    }
  }
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
  const [shouldRender, setShouldRender] = useState(false);
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

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = PREVIEW_WIDTH;
    canvas.height = PREVIEW_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawChecker(ctx, PREVIEW_WIDTH, PREVIEW_HEIGHT, checkerboardTheme);

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
  }, [
    boldWeight,
    canvasHeight,
    canvasWidth,
    checkerboardTheme,
    effects,
    fontFamily,
    fontSize,
    italic,
    shouldRender,
    text,
  ]);

  return (
    <div ref={previewRef}>
      <canvas
        ref={canvasRef}
        aria-label={`${getGalleryDisplayName(item)} preview`}
        style={shouldRender ? PREVIEW_STYLE : { display: 'none' }}
      />
      {!shouldRender && (
        <div style={PREVIEW_PLACEHOLDER_STYLE}>Preview loads on scroll</div>
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
