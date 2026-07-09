let effectId = 0;

export function createEffectId() {
  effectId += 1;
  return `effect-${effectId}`;
}
