import { useEffect, useMemo, useRef } from 'react';
import {
  deserializeFontEffect,
  type IFontEffect,
  type SerializedFontEffect,
} from '../../effects';
import { drawTextEffects } from '../../render/renderFontEffects';

const PREVIEW_STYLE: React.CSSProperties = {
  backgroundColor: '#2F343C',
  backgroundImage: `
    linear-gradient(45deg, #1F242B 25%, transparent 25%),
    linear-gradient(-45deg, #1F242B 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #1F242B 75%),
    linear-gradient(-45deg, transparent 75%, #1F242B 75%)
  `,
  backgroundPosition: '0 0, 0 16px, 16px -16px, -16px 0',
  backgroundSize: '32px 32px',
  border: '1px solid #39424E',
  borderRadius: 4,
  display: 'block',
  maxHeight: 220,
  width: '100%',
};

interface Props {
  boldWeight: number;
  canvasHeight: number;
  canvasWidth: number;
  effects: SerializedFontEffect[];
  fontFamily: string;
  fontSize: number;
  italic: boolean;
  text: string;
}

export default function AiEffectsPreview({
  boldWeight,
  canvasHeight,
  canvasWidth,
  effects,
  fontFamily,
  fontSize,
  italic,
  text,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parsedEffects = useMemo(
    () =>
      effects
        .map(deserializeFontEffect)
        .filter((effect): effect is IFontEffect => effect !== null),
    [effects],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvasWidth, canvasHeight);
    drawTextEffects(context, canvasWidth, canvasHeight, {
      boldWeight,
      effects: parsedEffects,
      fontFamily,
      fontSize,
      italic,
      text,
    });
  }, [
    boldWeight,
    canvasHeight,
    canvasWidth,
    fontFamily,
    fontSize,
    italic,
    parsedEffects,
    text,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="AI generated effects preview"
      style={{
        ...PREVIEW_STYLE,
        aspectRatio: `${canvasWidth} / ${canvasHeight}`,
      }}
    />
  );
}
