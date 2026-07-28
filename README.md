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

## Docker

Build and start the production container:

```bash
docker compose up --build -d --wait
```

Open `http://localhost:3000`. Follow the application logs or stop the service
with:

```bash
docker compose logs -f web
docker compose down
```

To use a different host port while keeping the container on port `3000`:

```bash
APP_PORT=3100 docker compose up --build -d --wait
```

The image can also be used without Compose:

```bash
docker build -t the-songs-between-us:local .
docker run --rm --init -p 3000:3000 the-songs-between-us:local
```

The production container runs as a non-root user and exposes a health check on
the home page. TLS and public-domain routing should be provided by a reverse
proxy in front of the container.

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
