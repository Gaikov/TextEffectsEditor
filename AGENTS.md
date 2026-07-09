# Repository Guidelines

## Project Structure & Module Organization

FontEffects is a React 18 + TypeScript application built with esbuild. Application code lives in `src/`. The entry points are `src/index.html` and `src/index.tsx`; `src/App.tsx` owns the main layout and font loading. MobX state is centralized in `src/store/fontStore.ts`. Reusable UI lives in `src/components/`, with component-scoped styles as `*.module.css`. Shared styling and Blueprint dark-theme overrides live in `src/overrides.css`. Production output is generated into `dist/`.

## Build, Test, and Development Commands

```bash
npm run dev
```

Starts the esbuild watcher and local dev server at `http://localhost:3001` with live reload.

```bash
npm run build
```

Creates a minified production build in `dist/`.

Both scripts run `tsc` first. TypeScript emits checked JS into `.cache/tsc/`, and esbuild bundles that emitted JS into `dist/`.

The repo also contains `pnpm-lock.yaml` and `pnpm-workspace.yaml`; avoid mixing package managers unless intentionally updating dependency metadata.

## Coding Style & Naming Conventions

Write TypeScript with `strict` mode in mind. Use React function components, `observer()` from `mobx-react-lite` for MobX-backed views, and direct MobX mutations on observable store fields. Keep component filenames in PascalCase, for example `FontProperties.tsx`; stores and utilities use camelCase, for example `fontStore.ts`.

Use CSS Modules for local styles and camelCase class names. Prefer Blueprint controls, matching the existing compact `small` style. In property panels, keep labels and values on one line with the same Blueprint font family, normal weight, and a slightly larger shared size; use tight vertical gaps and checkbox controls for boolean properties such as italic. Keep JSON indented with two spaces and follow surrounding TypeScript/CSS style.

For font effects, keep each `IFontEffect` implementation in its own `src/effects/` file and its editor in `src/components/effects/`. Every visual effect must expose `opacity`, apply it with `globalAlpha` inside `draw()`, serialize/deserialize it, and register both model and editor through the effect registries. Use the composite pattern: `GroupEffect` is an `IFontEffect`, renders child effects into an offscreen buffer, and draws that buffer into its parent. Effects like `ShadowText` transform the current buffer by composing shadow first and original content above it. Do not add `instanceof` editor branching to `FontProperties.tsx` or canvas rendering.

## Testing Guidelines

No automated test framework is currently configured. Before submitting changes, run:

```bash
npm run build
```

For UI changes, also run `npm run dev` and manually verify canvas behavior, font selection, property editing, pan/zoom, and dark-theme Blueprint menus. If tests are added later, place them near source files or under `src/__tests__/`, using names such as `FontCanvas.test.tsx`.

## Commit & Pull Request Guidelines

Recent history uses concise conventional-style commit messages, such as `fix: ...`, `chore: ...`, and `init: ...`. Keep commits focused and describe the user-visible or maintenance outcome.

Pull requests should include a short summary, testing notes, and screenshots or screen recordings for visible UI changes. Link related issues when available. Mention any dependency, build, or configuration changes explicitly, especially updates to lockfiles or esbuild behavior.

## Agent-Specific Instructions

Do not rewrite generated `dist/` files unless the task is specifically to refresh build output. Preserve existing MobX and Blueprint patterns, and keep changes narrowly scoped to the requested behavior.
