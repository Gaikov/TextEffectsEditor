# FontEffects

React + MobX + Blueprint font effect editor.

## Stack

| Layer | Library |
|---|---|
| UI | React 18, Blueprint.js 6 |
| State | MobX + mobx-react-lite |
| Bundler | esbuild |
| Language | TypeScript |
| Styles | CSS Modules |

## Scripts

```bash
npm run dev    # dev server on localhost:3001 (watch + livereload)
npm run build  # production build → dist/
```

Both scripts run `tsc` first. TypeScript emits JS into `.cache/tsc/`, then esbuild bundles that output into `dist/`.

## Structure

```
src/
├── index.html            # entry HTML (bp6-dark on <body>)
├── index.tsx             # React mount + Blueprint CSS imports
├── App.tsx               # root layout, font loading
├── App.module.css        # layout grid
├── fonts.ts              # font list + loadSystemFonts()
├── overrides.css         # Blueprint popover/menu dark fixes
├── global.d.ts           # type declarations
├── store/
│   └── fontStore.ts      # MobX store (makeAutoObservable)
└── components/
    ├── CanvasSizeInputs.tsx   # W × H inputs (top bar)
    ├── FontCanvas.tsx         # canvas + pan/zoom (CSS transform)
    ├── FontCanvas.module.css
    └── FontProperties.tsx     # right panel: text, font, size, color
```

## Patterns

### UI Controls
- All interactive controls use **Blueprint components only**
- All inputs use `small` prop for uniform compact sizing
- `InputGroup`, `NumericInput`, `Suggest` — all `small`
- Native elements only where no Blueprint equivalent exists (`<canvas>`, `<input type="color">`)

### State
- `makeAutoObservable(this)` — automatic observable/action inference
- Components wrapped in `observer()` auto-track accessed fields
- Direct mutation: `store.field = value` (no `setState`, no `dispatch`)
- Canvas rendering via MobX `autorun` — redraws on observable change without React re-render

### Styling
- Dark theme via `bp6-dark` class on `<body>`
- Panel backgrounds: `#252a31`, canvas area: `#1c2127`, borders: `#383e47`
- Popover/menu dark background enforced in `overrides.css`
