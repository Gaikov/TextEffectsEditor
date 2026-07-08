# FontEffects

React + MobX + Blueprint demo app.

## Stack

| Layer | Library |
|---|---|
| UI | React 18, Blueprint.js 5 |
| State | MobX + mobx-react-lite |
| Bundler | esbuild |
| Language | TypeScript |
| Styles | CSS Modules |

## Scripts

```bash
npm run dev    # dev server on localhost:3001 (watch + livereload)
npm run build  # production build → dist/
```

## Structure

```
src/
├── index.html        # entry HTML
├── index.tsx         # React mount + Blueprint CSS imports
├── App.tsx           # app component (observer)
├── App.module.css    # CSS Modules styles
├── store.ts          # MobX store (AppStore)
└── global.d.ts       # type declarations
```

## MobX Store

```ts
class AppStore {
  isOpen = false;      // observable
  open = () => { ... } // action
  close = () => { ... } // action
}
```

- `makeAutoObservable(this)` — automatic observable/action/computed inference
- Components wrapped with `observer()` auto-track accessed fields
- Direct mutation: `appStore.isOpen = true` (no `setState`, no `dispatch`)
