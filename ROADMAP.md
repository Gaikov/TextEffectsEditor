# Font Effects Roadmap

## Current

1. Glow

## Planned

2. Blur
3. Duplicate / Offset
4. Pattern Fill
5. Inner Shadow
6. Composite / Blend
7. Wave / Distort

## Effect Pattern

Every effect must be tree-compatible, serializable, editable, visibility-toggleable, and registered through factories. Keep each effect model in `src/effects/`, each editor in `src/components/effects/`, and avoid effect-specific branching in `FontProperties`.
