# Font Effects Roadmap

## Current

1. Duplicate / Offset

## Planned

2. Distort

## Completed

1. Glow
2. Blur
3. Inner Shadow
4. Composite / Blend
5. Pattern Fill
6. Noise
7. Wave

## Effect Pattern

Every effect must be tree-compatible, serializable, editable, visibility-toggleable, and registered through factories. Keep each effect model in `src/effects/`, each editor in `src/components/effects/`, and avoid effect-specific branching in `FontProperties`.
