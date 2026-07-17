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

## Architecture & Extension Patterns

Use OOP/SOLID principles for extensible domains, especially font effects. Prefer polymorphism over conditionals: new behavior should usually be added through an interface implementation plus registry/factory entries, not by adding `switch` or `instanceof` branches to orchestration code. Use inheritance or small reusable base helpers when multiple effects share rendering, serialization, or editor behavior, but avoid abstract layers that do not remove real duplication.

Gallery backends follow the same rule. New local, remote, or cloud-backed galleries must implement `GalleryProvider`; shared gallery dialogs should consume provider capabilities and results instead of branching directly on a concrete backend. If a backend does not support an action such as moderation, return an unsupported `GalleryActionResult` rather than special-casing the UI.

For font effects, keep each `IFontEffect` implementation in its own `src/effects/` file and its editor in `src/components/effects/`. Every effect must expose `visible` and every visual effect must expose `opacity`, apply it with `globalAlpha` inside `draw()`, serialize/deserialize both fields, and register both model and editor through the effect registries. Use the composite pattern: `GroupEffect` is an `IFontEffect`, renders child effects into an offscreen buffer, and draws that buffer into its parent; group UI state such as `name` and `collapsed` must also serialize. Effects like `ShadowText` transform the current buffer by composing shadow first and original content above it. Do not add `instanceof` editor branching to `FontProperties.tsx` or canvas rendering.

When adding, removing, or changing user-facing functionality, especially font effects and effect parameters, update `README.md` in the same change. The README is the user-facing contract for what the editor does, how to use it, and what each effect parameter means; keep it free of implementation details, deployment steps, internal API paths, environment variable names, or architecture notes. Put those technical details in `AGENTS.md` or a dedicated developer document instead.

Effect editor cards should keep their header visible and support manual collapse. Non-group effects default to collapsed; groups default to expanded so their children are visible. Put common actions such as drag, expand/collapse, visibility, reorder, and delete in the header; keep editable fields in the card body with consistent compact rows.

All user-facing state edits must go through the undo-aware APIs. Use `fontStore.setRootProperty()`, `fontStore.setEffectProperty()`, `fontStore.setArrayValue()`, or store methods such as `addEffectToGroup()` instead of direct assignment in UI components. New structural operations should create `IUndoOperation` implementations or compose existing ones with `UndoBatch`.

Undo operations must never enqueue other undo operations. `IUndoOperation.undo()` and `IUndoOperation.redo()` must not call `undoService.execute()`, `undoService.record()`, or undo-aware store setters. Operation implementations should mutate their target state directly and call any required refresh callback. When one user action needs multiple state changes, wrap those direct operations in `UndoBatch`; do not add recording suppression paths to `UndoService`.

## Cloudflare, Auth & Gallery Notes

The app can run as a Cloudflare Pages project with Pages Functions and D1 for the shared global gallery. Local Cloudflare development uses:

```bash
npm run cf:d1:migrate:local
npm run cf:dev
```

Production setup requires a D1 database named `font-effects-gallery`, the matching `database_id` in `wrangler.toml`, Pages build command `npm run build`, output directory `dist`, OAuth secrets (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `YANDEX_CLIENT_ID`, `YANDEX_CLIENT_SECRET`), and `ADMIN_EMAILS` for moderation. Apply remote migrations with:

```bash
npm run cf:d1:migrate -- --remote
```

For local Cloudflare dev, copy `.dev.vars.example` to `.dev.vars` and fill OAuth credentials. Configure provider redirect URLs for the active environment:

- Local Google callback: `http://localhost:8789/api/auth/callback/google`
- Local Yandex callback: `http://localhost:8789/api/auth/callback/yandex`
- Production callbacks use the deployed Pages domain with the same paths.

Global gallery submissions from registered users are stored as `pending`; public users see only `approved` items. Admin users can approve or reject pending items.

When the editor is embedded in an iframe, Google and Yandex sign-in must open in a new top-level tab because provider OAuth pages cannot be displayed inside an iframe. The callback tab posts an auth result back to the embedded editor and attempts to close itself. Production session cookies use `SameSite=None; Secure` so the `pages.dev` iframe can send them when the browser allows third-party cookies. Full third-party-cookie blocking cannot be solved reliably on `pages.dev`; a same-site custom domain such as `text-effects.grom-games.com` is the preferred long-term embed option for `grom-games.com`.

Dormant AI effect generation code may exist behind the Cloudflare Workers AI binding `AI`, but it is not exposed in the current user interface or README. Do not re-add AI menus, dialogs, or user-facing AI docs unless explicitly requested. If revived later, the endpoint must require an authenticated session, generate existing effect JSON only, and validate output through the effect registry before any browser preview or apply path.

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
