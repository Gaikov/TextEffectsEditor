import { useState } from 'react';
import {
  Button,
  Callout,
  Dialog,
  DialogBody,
  DialogFooter,
  TextArea,
} from '@blueprintjs/core';
import type { SerializedFontEffect } from '../../effects';
import AiEffectsPreview from './AiEffectsPreview';

const FIELD_STYLE: React.CSSProperties = {
  display: 'grid',
  gap: 8,
};

const LABEL_STYLE: React.CSSProperties = {
  color: '#F6F7F9',
  fontWeight: 600,
};

const HINT_STYLE: React.CSSProperties = {
  color: '#ABB3BF',
  fontSize: 13,
  margin: 0,
};

interface Props {
  boldWeight: number;
  canvasHeight: number;
  canvasWidth: number;
  effects: SerializedFontEffect[];
  error: string | null;
  fontFamily: string;
  fontSize: number;
  generated: boolean;
  isGenerating: boolean;
  isOpen: boolean;
  italic: boolean;
  text: string;
  onApply: () => void;
  onClose: () => void;
  onGenerate: (prompt: string) => void;
}

export default function AiEffectsDialog({
  boldWeight,
  canvasHeight,
  canvasWidth,
  effects,
  error,
  fontFamily,
  fontSize,
  generated,
  isGenerating,
  isOpen,
  italic,
  onApply,
  onClose,
  onGenerate,
  text,
}: Props) {
  const [prompt, setPrompt] = useState('');
  const canGenerate = prompt.trim().length > 0 && !isGenerating;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="AI Generate Effects">
      <DialogBody>
        <div style={FIELD_STYLE}>
          <label style={LABEL_STYLE} htmlFor="ai-effects-prompt">
            Description
          </label>
          <TextArea
            id="ai-effects-prompt"
            fill
            disabled={isGenerating}
            placeholder="Green cartoon game logo with yellow glow"
            style={{ minHeight: 96 }}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <p style={HINT_STYLE}>
            Describe the style you want. AI will generate an editable effect
            stack using the existing editor effects.
          </p>
          {error ? <Callout intent="danger">{error}</Callout> : null}
          {generated ? (
            <AiEffectsPreview
              boldWeight={boldWeight}
              canvasHeight={canvasHeight}
              canvasWidth={canvasWidth}
              effects={effects}
              fontFamily={fontFamily}
              fontSize={fontSize}
              italic={italic}
              text={text}
            />
          ) : null}
        </div>
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button text="Cancel" onClick={onClose} disabled={isGenerating} />
            <Button
              intent="primary"
              loading={isGenerating}
              text="Generate"
              onClick={() => onGenerate(prompt)}
              disabled={!canGenerate}
            />
            <Button
              intent="success"
              text="Apply"
              onClick={onApply}
              disabled={!generated || isGenerating}
            />
          </>
        }
      />
    </Dialog>
  );
}
