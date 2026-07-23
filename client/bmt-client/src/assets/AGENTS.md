# DOX: src/assets

## Purpose

Static media boundary — images and SVGs imported by the app.

## Ownership

App maintainers; changes here affect build size and visual assets.

## Local Contracts

- **Contents**: `hero.png`, `react.svg`, `vite.svg`.
- **Loading**: assets are bundled through Vite; import paths are resolved at build time.

## Work Guidance

- Optimize raster assets before adding; limit new formats to ones Vite handles natively.
- Keep SVGs as separate `.svg` files rather than inlining unless the SVG is tiny and reused heavily.

## Verification

- `pnpm run build` — confirms assets bundle without load errors.

## Child DOX Index

None.
