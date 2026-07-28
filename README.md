# The Songs Between Us

An immersive gothic mixtape built as a personal gift. The experience combines a
scroll-directed 3D guitar, atmospheric motion, animated spiders, and an
accessible editorial song archive.

## Prerequisites

- Node.js `>=22.13.0`

## Local development

```bash
npm install
npm run dev
npm run build
npm test
```

Edit the temporary song collection in `data/songs.ts`. Every song requires at
least one HTTPS Spotify or YouTube link.

## Architecture

- Next-compatible React 19 app rendered by vinext
- TypeScript and plain CSS with centralized theme variables
- React Three Fiber and Drei for the optimized guitar model
- GSAP ScrollTrigger for the continuous scroll choreography
- Local Fontsource packages to avoid render-blocking third-party font requests
- Cloudflare Worker output for Sites hosting

The page intentionally emits `noindex` and `nofollow` metadata. This discourages
search indexing but does not make the public deployment private.

## Assets

See `ATTRIBUTIONS.md` for asset sources, licenses, and modifications. Do not
redistribute the guitar model as a standalone asset.
