# Add Text Effects Editor To grom-games.com

## Summary

Add Text Effects Editor to GROm Games as an application next to the existing games: a card on the homepage, a detail page matching the current `game.php?game=...` style, a production app link, and a new icon.

The app should remain hosted at:

https://text-effects-editor.pages.dev/

Do not iframe/embed the app for v1, to avoid issues with OAuth, clipboard, file picker, and Cloudflare Pages setup.

## Key Changes

- Add a new catalog item:
  - id: `text-effects-editor`
  - title: `Text Effects Editor`
  - icon: `games/text-effects-editor/icon.png`
  - detail URL: `game.php?game=text-effects-editor`

- Add a detail page section for Text Effects Editor:
  - short description: browser-based editor for layered text effects and transparent PNG export;
  - key features:
    - live canvas preview;
    - editable text/font/canvas settings;
    - effect tree with groups;
    - local/global gallery;
    - JSON import/export;
    - transparent PNG export;
    - copy PNG to clipboard;
    - optional system fonts;
  - primary CTA button:
    - text: `Open Text Effects Editor`
    - URL: `https://text-effects-editor.pages.dev/`

## SEO / Metadata

Use application-oriented metadata, not game metadata.

- Page title:
  - `Text Effects Editor - Grom Games`

- Description:
  - `Create layered text effects in your browser and export transparent PNGs for games, thumbnails, stickers, and UI.`

- OpenGraph image:
  - `https://grom-games.com/games/text-effects-editor/icon.png`

- JSON-LD:
  - use `SoftwareApplication`
  - application category: `DesignApplication`
  - operating system: `Web Browser`
  - offers price: `0`

## Icon

Create:

```text
games/text-effects-editor/icon.png
```

Recommended style:

- landscape-friendly image for current `.game-card img`;
- readable when cropped to `height: 200px`;
- bold colorful `TEXT FX` or `Text Effects` lettering;
- dark checkerboard/canvas background;
- visible glow/stroke/shadow effect;
- warm GROm Games accent colors if possible.

## Page Copy Draft

### Text Effects Editor

Create layered text effects directly in your browser and export the result as a transparent PNG.

Text Effects Editor is useful for game UI labels, thumbnails, stickers, banners, stream overlays, and quick typography experiments. Build effects with fills, strokes, gradients, shadows, glow, blur, patterns, noise, wave distortion, and grouped layers.

#### Key Features

- Live canvas preview
- Layered effect tree with nested groups
- Local and global preset galleries
- JSON preset import/export
- Transparent PNG export
- Copy PNG directly to clipboard
- Optional system font access in supported browsers
- Free hosted application

#### Use It For

- Game title graphics
- UI labels and buttons
- Promo banners
- Social thumbnails
- Stickers and overlays
- Fast text effect prototyping

CTA:

```html
<a href="https://text-effects-editor.pages.dev/" class="download-button" target="_blank" rel="noopener noreferrer">
  Open Text Effects Editor
</a>
```

## Test Plan

- Homepage shows the new `Text Effects Editor` card.
- Card icon is readable at current card size.
- Card opens `game.php?game=text-effects-editor`.
- Detail page matches existing site style.
- CTA opens `https://text-effects-editor.pages.dev/`.
- Mobile layout is usable.
- OpenGraph image and description are correct.
- JSON-LD uses `SoftwareApplication`, not `VideoGame`.

## Assumptions

- grom-games.com source is in a separate repository.
- Text Effects Editor stays deployed on Cloudflare Pages.
- Hosted app is free for everyone to use.
- Source-code licensing remains handled in the Text Effects Editor repository.
