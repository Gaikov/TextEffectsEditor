import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

function clamp(value: number, min?: number, max?: number) {
  let nextValue = value;
  if (min != null) nextValue = Math.max(min, nextValue);
  if (max != null) nextValue = Math.min(max, nextValue);
  return nextValue;
}

function formatValue(value: number) {
  return String(value).replace('.', ',');
}

function normalizeInput(value: string) {
  return value.replace(/\./g, ',');
}

function parseInput(value: string, allowFloat: boolean) {
  const normalizedValue = value.replace(/,/g, '.');
  const number = allowFloat
    ? Number(normalizedValue)
    : Number.parseInt(normalizedValue, 10);
  return Number.isFinite(number) ? number : null;
}

function isIntermediateValue(value: string) {
  return ['', '+', '-', ',', '+,', '-,'].includes(value);
}

function isAllowedInput(value: string, allowFloat: boolean) {
  if (isIntermediateValue(value)) return true;
  return allowFloat
    ? /^[+-]?(?:\d+(?:,\d*)?|,\d+)$/.test(value)
    : /^[+-]?\d+$/.test(value);
}

export interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  allowFloat?: boolean;
  small?: boolean;
  fill?: boolean;
  ariaLabel?: string;
  disabled?: boolean;
  style?: CSSProperties;
}

export default function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
  allowFloat = false,
  small = false,
  fill = false,
  ariaLabel,
  disabled = false,
  style,
}: NumberInputProps) {
  const [text, setText] = useState(formatValue(value));
  const focusedRef = useRef(false);
  const inputMode = allowFloat ? 'decimal' : 'numeric';
  const className = useMemo(
    () => `bp6-input${small ? ' bp6-small' : ''}`,
    [small],
  );

  useEffect(() => {
    if (focusedRef.current) return;
    setText(formatValue(value));
  }, [value]);

  const commitText = (nextText: string) => {
    const normalizedText = normalizeInput(nextText);
    if (!isAllowedInput(normalizedText, allowFloat)) return;

    setText(normalizedText);
    if (isIntermediateValue(normalizedText)) return;

    const parsedValue = parseInput(normalizedText, allowFloat);
    if (parsedValue == null) return;

    const nextValue = clamp(parsedValue, min, max);
    if (nextValue !== value) onChange(nextValue);
  };

  return (
    <input
      aria-label={ariaLabel}
      className={className}
      disabled={disabled}
      inputMode={inputMode}
      step={step}
      style={{
        ...(fill ? { width: '100%' } : null),
        ...style,
      }}
      type="text"
      value={text}
      onBlur={() => {
        focusedRef.current = false;
        setText(formatValue(value));
      }}
      onChange={(event) => {
        commitText(event.target.value);
      }}
      onFocus={() => {
        focusedRef.current = true;
      }}
    />
  );
}
