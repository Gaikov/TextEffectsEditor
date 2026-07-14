# Font Effects Roadmap

## Current

1. Duplicate / Offset

## Planned

2. Pattern Fill
3. Inner Shadow
4. Composite / Blend
5. Wave / Distort

## Completed

1. Glow
2. Blur

## Effect Pattern

Every effect must be tree-compatible, serializable, editable, visibility-toggleable, and registered through factories. Keep each effect model in `src/effects/`, each editor in `src/components/effects/`, and avoid effect-specific branching in `FontProperties`.
