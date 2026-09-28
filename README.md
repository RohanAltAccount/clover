# MRBD App Template

A clean starter for building **Meta Ray-Ban Display** web apps.

React + Vite + TypeScript + Tailwind v4 + [`mrbd-ui-kit`](https://github.com/michaelcummings12/mrbd-ui-kit),
with spatial (D-pad) navigation, a 600×600 dark layout, unit testing, and a ready-to-go
**PWA manifest + app icons** so your app shows up properly in the glasses launcher.

## Use this template

Click **“Use this template”** on GitHub, or:

```bash
gh repo create my-org/my-app --public --template MRBD-Apps/mrbd-app-template --clone
cd my-app
npm install
npm run dev
```

## Scripts

```bash
npm run dev       # dev server (http://localhost:5173)
npm run test      # unit tests (Vitest + Testing Library)
npm run build     # production build (dist/)
npm run preview   # preview the production build
npm run lint      # eslint
```

## What's inside

```
src/
  App.tsx                  # DisplayRoot + icon-dock navbar (kit <Button>)
  screens/
    HomeScreen.tsx         # Counter, Pill, ScrollContainer list, usePreferredFocus
    LocationScreen.tsx     # useGeolocation + FrostedCard + useSpatialInput
    AboutScreen.tsx        # asChild link (Button styles on an <a>)
  components/
    Counter.tsx (+test)    # interactive component using the kit
    FrostedCard.tsx        # reusable frosted-glass panel (native-maps look)
  hooks/
    useGeolocation.ts      # device position (watchPosition)
  lib/format.ts (+test)    # example pure util + unit test
  index.css                # tailwind + mrbd-ui-kit/css + Nunito font + accent variable
public/
  favicon.svg / favicon.png / icon-512.png
  manifest.webmanifest     # PWA manifest the glasses launcher reads for the app icon
```

Demonstrated kit pieces: `DisplayRoot`, `Button`, `Text`, `Card`, `Pill`, `ScrollContainer`,
`usePreferredFocus`, `useSpatialInput`, lucide icons, the icon-dock navbar, frosted-glass cards,
geolocation, and theming via one CSS variable.

---

## Cookbook — patterns & gotchas

Hard-won recipes for the Display. Copy what you need.

### 1. Spatial input & focus (read this first)

The Display has **no mouse** — it's arrow keys + Select (temple touchpad / Neural Band).
`<DisplayRoot>` runs the focus engine; it handles **arrow-key navigation automatically** between
focusable elements.

- **`<Button>` and `<Focusable>` activate on Enter/Select, not on mouse click.** The kit wires
  `onClick`/`onSelect` to the focus engine's *select*, so in a desktop browser the navbar reacts
  to **Enter**, not a mouse click. That's correct device behaviour.
- **Everything focusable must live inside `<DisplayRoot>`** (it throws otherwise). In component
  tests, wrap renders in `<DisplayRoot>`.
- **`className` overrides kit styles cleanly** — the kit merges with `tailwind-merge`, so
  `className="h-14 w-14 rounded-full p-0"` reliably beats the variant's size/shape. That's how the
  navbar turns `<Button>`s into 56px icon circles.
- **Own the keys yourself with `useSpatialInput`** when you need a custom gesture (a carousel, map
  pan/zoom, etc.):

  ```tsx
  useSpatialInput({
    onPress: (key) => {
      if (key === 'left') prev();
      else if (key === 'right') next();
      else if (key === 'up') zoomIn();
      else if (key === 'down') zoomOut();
      else if (key === 'select') open();
    },
  });
  ```

  ⚠️ The focus engine *also* moves focus on arrows. If a screen both uses `useSpatialInput` for
  arrows **and** has other focusables, they fight. For a fullscreen custom surface (a map), keep
  that screen free of kit focusables so `useSpatialInput` owns every key.
- **Set the default focus per screen** with `usePreferredFocus('some-id')`.

### 2. Frosted-glass card (native-maps look)

`<FrostedCard>` is a translucent gradient + blur panel that reads beautifully floating over a map
or the real world on the additive display:

```tsx
import { FrostedCard } from './components/FrostedCard';

<FrostedCard className="mt-auto">
  <Text size="lg" weight="bold">Panadería Carmen</Text>
  <Text className="text-white/80">7 min · 520 m</Text>
</FrostedCard>
```

### 3. HUD map (white roads on black)

`dark_all` tiles are too dim in daylight. For a HUD-style map with **white roads on a black
(transparent-on-glass) background**, use a no-label tile and push contrast/brightness in CSS:

```bash
npm i leaflet react-leaflet @types/leaflet
```

```css
/* index.css */
.leaflet-container { background: #000; }
.leaflet-tile { filter: brightness(3.6) contrast(1.7) saturate(0); } /* white roads */
```

```tsx
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const TILES = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';

<MapContainer center={[lat, lon]} zoom={15} zoomControl={false}
  attributionControl={false} keyboard={false} style={{ height: '100%', width: '100%' }}>
  <TileLayer url={TILES} subdomains="abcd" maxZoom={20} />
  {/* …markers… */}
</MapContainer>
```

Map tips:
- A child component inside `<MapContainer>` can call `useMap()` to drive `flyTo`/`zoomIn` from your
  `useSpatialInput` handler (a `ref` on `MapContainer` is less reliable).
- **Overlays over the map need an explicit `z-[1000]`** — Leaflet panes (z-index 400–700) otherwise
  paint *over* your status card/hints.
- Blue "you are here" dot as a `L.divIcon`:
  `background:#3b82f6;border:2px solid #fff;box-shadow:0 0 0 4px rgba(59,130,246,.35)`.
- Numbered/labelled pins: render stations as `L.divIcon` pills with the value inside; bump the
  selected one's size and `zIndexOffset`.

### 4. Live data from a no-CORS API (serverless proxy)

Many open feeds (GBFS, transit, etc.) return data but **no CORS headers**, so the browser can't read
them cross-origin. Proxy them from your own origin with a **Vercel Edge Function** in `/api`:

```ts
// api/data.ts
export const config = { runtime: 'edge' };
export default async function handler(): Promise<Response> {
  const r = await fetch('https://example.org/feed.json');
  const data = await r.json();
  // …merge / trim…
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json', 'cache-control': 's-maxage=15' },
  });
}
```

The client just calls `fetch('/api/data')` (same origin → no CORS). Run the full stack locally with
`vercel dev` (plain `vite` won't serve `/api`).

### 5. Geolocation

`useGeolocation()` wraps `watchPosition`. Needs HTTPS (or localhost). Preview in a desktop browser by
simulating a position in DevTools. Provided in `src/hooks/useGeolocation.ts`.

### 6. Theming

Recolour the whole app — buttons, focus ring, glows, borders — with one variable in `index.css`:

```css
:root { --color-mrbd-accent: #10b981; } /* green, amber, sky… */
```

### 7. Design guidelines (from the kit)

No pure white (`text-mrbd-text` = 92%), **no drop-shadows** (use outer glows `shadow-mrbd-glow`),
bold fonts (Nunito), glanceable in < 2s, right-anchored F-pattern (monocular, right eye).

---

## Deploy + install on the glasses

Deploy to a public HTTPS URL (geolocation/PWA need HTTPS):

```bash
npm i -g vercel
vercel --prod
```

Then open this deep link **on the glasses** to add the app (replace name + URL):

```
fb-viewapp://web_app_deep_link?appName=MRBD%20App&appUrl=https%3A%2F%2Fyour-app.vercel.app%2F
```

> The launcher icon comes from `manifest.webmanifest` + the **PNG** icons (and `apple-touch-icon`),
> not the SVG favicon. Keep a 256×256 (and 512×512) PNG in `public/` referenced in the manifest.
> After changing the icon, **re-add** the app on the glasses so the launcher re-reads it.

## Customize

1. Rename in `package.json`, `index.html` (`<title>` + `<meta description>`), and
   `public/manifest.webmanifest` (`name`, `short_name`, `description`).
2. Replace `public/favicon.svg` and regenerate the PNGs:
   ```bash
   rsvg-convert -w 256 -h 256 public/favicon.svg -o public/favicon.png
   rsvg-convert -w 512 -h 512 public/favicon.svg -o public/icon-512.png
   ```
3. Build your screens in `src/screens/` and wire them in `src/App.tsx`.

## License

[MIT](./LICENSE)
