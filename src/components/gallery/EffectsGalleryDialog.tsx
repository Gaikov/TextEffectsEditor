import { useEffect, useMemo, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Button,
  Card,
  Dialog,
  DialogBody,
  InputGroup,
  NonIdealState,
} from '@blueprintjs/core';
import { deserializeFontEffect, type IFontEffect } from '../../effects';
import type { GalleryItem } from '../../gallery/GalleryProvider';
import { drawTextEffects } from '../../render/renderFontEffects';
import { fontStore } from '../../store/fontStore';

const PREVIEW_WIDTH = 280;
const PREVIEW_HEIGHT = 148;
const CHECKER_SIZE = 10;
const CHECKER_A = '#E7E9EC';
const CHECKER_B = '#FFFFFF';

const BODY_STYLE: React.CSSProperties = {
  minHeight: 320,
  maxHeight: '70vh',
  overflow: 'auto',
};

const GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 12,
};

const SEARCH_STYLE: React.CSSProperties = {
  marginBottom: 12,
};

const CARD_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const PREVIEW_STYLE: React.CSSProperties = {
  width: '100%',
  aspectRatio: `${PREVIEW_WIDTH} / ${PREVIEW_HEIGHT}`,
  border: '1px solid #383e47',
  borderRadius: 4,
  display: 'block',
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
  gap: 6,
  justifyContent: 'flex-end',
};

interface EffectsGalleryDialogProps {
  isOpen: boolean;
  canModerate?: boolean;
  isLoading?: boolean;
  items: GalleryItem[];
  providerLabel: string;
  query: string;
  onApply: (item: GalleryItem) => void;
  onApprove?: (id: string) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  onQueryChange: (query: string) => void;
  onReject?: (id: string) => void;
}

function drawChecker(ctx: CanvasRenderingContext2D, w: number, h: number) {
  for (let y = 0; y < h; y += CHECKER_SIZE) {
    for (let x = 0; x < w; x += CHECKER_SIZE) {
      const even =
        ((x / CHECKER_SIZE) | 0) % 2 === ((y / CHECKER_SIZE) | 0) % 2;
      ctx.fillStyle = even ? CHECKER_A : CHECKER_B;
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

interface GalleryPreviewProps {
  item: GalleryItem;
}

const GalleryPreview = observer(function GalleryPreview({
  item,
}: GalleryPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const text = fontStore.text;
  const fontFamily = fontStore.fontFamily;
  const fontSize = fontStore.fontSize;
  const boldWeight = fontStore.boldWeight;
  const italic = fontStore.italic;
  const canvasWidth = fontStore.canvasWidth;
  const canvasHeight = fontStore.canvasHeight;

  const effects = useMemo(
    () =>
      item.effects
        .map(deserializeFontEffect)
        .filter((effect): effect is IFontEffect => effect !== null),
    [item.effects],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = PREVIEW_WIDTH;
    canvas.height = PREVIEW_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawChecker(ctx, PREVIEW_WIDTH, PREVIEW_HEIGHT);

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
    effects,
    fontFamily,
    fontSize,
    italic,
    text,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={`${getGalleryDisplayName(item)} preview`}
      style={PREVIEW_STYLE}
    />
  );
});

export default observer(function EffectsGalleryDialog({
  canModerate = false,
  isOpen,
  isLoading = false,
  items,
  providerLabel,
  query,
  onApply,
  onApprove,
  onClose,
  onDelete,
  onQueryChange,
  onReject,
}: EffectsGalleryDialogProps) {
  useEffect(() => {
    if (!isOpen) onQueryChange('');
  }, [isOpen, onQueryChange]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={providerLabel}
      style={{ width: 720 }}
    >
      <DialogBody style={BODY_STYLE}>
        <InputGroup
          leftIcon="search"
          placeholder="Search by name..."
          style={SEARCH_STYLE}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
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
          <div style={GRID_STYLE}>
            {items.map((item) => {
              const displayName = getGalleryDisplayName(item);
              return (
                <Card key={item.id} compact style={CARD_STYLE}>
                  <GalleryPreview item={item} />
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
                </Card>
              );
            })}
          </div>
        )}
      </DialogBody>
    </Dialog>
  );
});
