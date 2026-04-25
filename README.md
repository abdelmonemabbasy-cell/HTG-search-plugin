<p align="center">
  <img src="assets/icon.svg" alt="HomeDrop" width="96" height="96" />
</p>

<h1 align="center">HomeDrop</h1>
<p align="center">
  A Figma plugin for HomeToGo designers — drop real product data into
  your mockups without copy-pasting a single title, price, or image.
</p>

---

## Why I'm building this

I'm a HomeToGo designer. Most of my work is search, listing, and
property-detail flows — surfaces where the *data* is the design. A
mockup with `Lorem ipsum` and a placeholder image lies about how the
real product feels: titles wrap differently, ratings sit at unflatter‑
ing decimals, prices push CTAs around, missing photos break grids.
Designing without real data is designing without the actual problem.

The other half of the work is keeping our screens in lock-step with
the **HomeToGo Design System** — same card geometry, same purple,
same typographic rhythm — across **web, iOS and Android**. That
contract is easy to drift on when every designer hand-builds the
same card from scratch.

**HomeDrop** is my attempt to close both gaps in one move:

1. Pull real HomeToGo property data (title, price, rating, photos,
   amenities, capacity, location…) into Figma with one click or one
   drag.
2. Render it through the official card / section components so
   anything I drop is already on-system, in the platform variant I
   need, in the locale I'm designing for.

This repo is a **proof of concept**. The catalogue is mock JSON
(`src/data/products.json`, 10 hand-curated offers in EN/DE/ES/FR)
because we don't have an internal API key set up for the plugin
sandbox yet. Once we do, **v2** swaps the in-process source for an
`ApiOffersSource` and the rest of the plugin doesn't change — see
[`docs/ARCHITECTURE.md#data-layer-v08`](docs/ARCHITECTURE.md). I want
to get the UX nailed *before* we wire the API so we don't ship
something half-baked the moment data is available.

---

## What you can drop

| Output | Where |
|--------|-------|
| **One product card** | A single property card at the cursor / canvas centre. |
| **A list of cards** | N cards in a vertical auto-layout stack. |
| **A grid of cards** | N cards in a 2 / 3 / 4-column wrapping auto-layout. |
| **Detail-page sections** | Any subset of 12 sections (Gallery · Title header · Quick facts · Reasons to book · Reviews · Amenities · Room information · Description · House rules · Location · Price breakdown · Cancellation policy) stacked as one auto-layout container that rebuilds the full property page. |

Every output respects the chosen **platform** (`Web` · `iOS` ·
`Android`) and **locale** (`EN` · `DE` · `ES` · `FR`). Card geometry,
corner radii, shadow, stroke, every visible string and the price
format all change to match. Same source data, three platform
variants, four languages.

---

## Quick start

```bash
npm install
npm run build      # produces build/main.js, build/ui.js, manifest.json
```

In Figma desktop:

1. **Plugins → Development → Import plugin from manifest…**
2. Pick the generated `manifest.json` at the repo root.
3. **Plugins → Development → HomeDrop**.

Iterating:

```bash
npm run watch      # incremental rebuild on save
npm test           # Vitest suite
```

---

## How it feels to use

### The Drop CTA infers what to do

Tiles are always multi-selectable; the footer button reads the
selection and decides:

| Selection | Button |
|-----------|--------|
| Nothing | Disabled "Pick a property" |
| 1 tile | `Drop` — single card at viewport centre |
| 2+ tiles | Split-button `Drop {n} as list ▾` (chevron opens List / Grid). Layout choice persists. |

- **Plain click** replaces the selection with that tile.
- **Shift-click** extends the visible-list range from the anchor.
- **⌘ / Ctrl-click** toggles a tile additively.

When the CTA crosses 0 → 1 selected, it pulses once so you notice
it's now actionable.

### Listing → details (two levels)

- **Level 1.** Grid of tiles. Search / filter chips / sort / favourites
  star (heart). Pick one or many, drop.
- **Level 2.** Click `→` on a tile to drill into the property. The
  detail page carries the hero, a property-facts panel (guests /
  bedrooms / baths / rating, short description, amenity chips, price
  + provider), and a 12-tile section grid. Pick the sections you
  need; drop.

The detail-page hero is also draggable — drag from the hero to drop
the property's card. Each section tile is independently draggable
too.

### Four ways to drop a card

1. **Click Drop with no canvas selection** → card lands at viewport
   centre.
2. **Click Drop with a single `#field` text/shape selected** → fills
   that one layer with the matching offer field. Pick `#title` and
   click Drop, your text layer becomes the property title.
3. **Click Drop with a frame selected that contains `#field`
   children** → fills every matching descendant in place.
4. **Drag a tile onto the canvas** → same target inference, but at
   the cursor: dropped on a `#field` text/shape fills it; on a frame
   with `#field` descendants fills them all; on any other frame
   appends as a child; on the page lands at the cursor coords.

This is how the plugin connects to your **design system** — name
your component's text/image layers `#title`, `#image`,
`#pricePerNight`, etc. and the plugin overrides them in place.

### Smaller things that add up

- **⌘K / Ctrl+K** opens a fuzzy command palette: Drop, Random,
  Refresh, Find all, switch platform / locale / theme / multi-layout,
  apply preset.
- **Heart any tile** to favourite it — the star bounces, the
  Favourites chip filters the grid to just those.
- **Refresh** re-renders selected HomeDrop nodes against current data
  in the current locale + platform.
- **Find all** selects every HomeDrop card on the current page and
  zooms to fit.
- **Presets** save the current `multiLayout + platform + locale +
  gridColumns + sort` under a name (auto-suggested as
  `Web · EN · 3 cols`, just hit Enter).
- **Help** menu in the header — six bite-size cards explaining Drop /
  drag / populate / palette / multi-select / favourites.
- **Persistent footer Undo** — the toast Undo dies after 5 s, so a
  small `↺ Undo` pill stays in the footer until the next drop. **⌘Z
  / Ctrl+Z** also fires it.
- **Theme picker** (Auto / Light / Dark). Auto follows Figma's host
  theme. Dark mode uses Figma's native panel palette so the plugin
  reads as part of the host.
- **Resizable plugin window** — clamped 360×480 → 900×1200; persists.
- **Canvas → plugin awareness** — select an inserted HomeDrop card on
  canvas → its tile in the plugin pulses and scrolls into view, so
  you always know which tile a placed card maps to.

### Adaptive cards

Every section is conditional on the offer carrying that data. No
discount → no "Last-minute deal" pill. No rating → "New listing".
Fewer than 2 photos → no pagination dots. Amenities the plugin doesn't
have icons for are silently dropped. Designers never see placeholder
noise.

---

## Replace mode (swap a placeholder, swap an existing card)

Got an empty placeholder frame in your mockup where the property card
should sit? Or an existing HomeDrop card you want to swap for a
different property?

**Select the frame and click Drop** (or drag a tile onto it) — the
plugin removes the frame and places the new card at exactly the same
canvas position, inheriting the parent and the auto-layout index. So
it slots back into its container without you having to re-arrange
anything. Works on:

- **Empty placeholder frames** designers use as positioning slots.
- **Previously-inserted HomeDrop cards** — pick a different property
  while a card is selected and the new one slides into the same spot.

Looking forward to v2 with the HomeToGo design system: when the
component itself carries the data fields as named layers, this same
replace flow becomes the path for filling the system component too.
For now the simple swap is what the workflow needs.

---

## The PoC → v2 path

Today's catalogue: `src/data/products.json` — 10 hand-built offers
that exercise every visible state (discount / no discount, rating /
new listing, full amenities / sparse amenities, badges, multiple
images / single image). The localised strings are pre-rendered for
EN/DE/ES/FR.

The data layer lives in the UI thread (where `fetch()` works in the
plugin sandbox), behind an `OffersSource` interface:

```ts
// src/ui/offers-source.ts
export interface OffersSource {
  search(query: SearchQuery): Promise<{ offers: Offer[]; total: number }>;
}

export const defaultOffersSource: OffersSource = new JsonOffersSource();
```

**v2** is a one-line change in `src/ui/App.tsx`:

```ts
// const [source] = useState<OffersSource>(() => defaultOffersSource);
const [source] = useState<OffersSource>(() => new ApiOffersSource(API_URL));
```

`ApiOffersSource` is sketched in `src/ui/offers-source.ts` (commented
out) along with `parseApiOffer()` so you can see the shape the
adapter needs to produce. Add the API host + image CDN to
`package.json → figma-plugin.networkAccess.allowedDomains`, drop the
`localize()` call (the API returns locale-specific data directly),
and the rest of the plugin doesn't change.

This split is on purpose: the plugin's UX is locked in *before* the
API exists so when the API arrives we ship a swap, not a redesign.

---

## Project layout

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full tour.

```
src/
  main/      Figma sandbox code (all figma.* API calls + drop routing)
    index.ts        # showUI + message router + figma.on('drop')
    generate.ts     # Platform-aware card builder (web + iOS + Android)
    populate.ts     # populateNode + populateSelection + selection helpers
    sections/       # 12 detail-page section builders

  ui/        Preact iframe UI — owns the OffersSource
    App.tsx           # State machine (search + detail levels)
    offers-source.ts  # OffersSource interface + JsonOffersSource + v2 stub
    theme.ts          # Auto/Light/Dark theme application
    dragImage.ts      # Custom setDragImage() ghost factory (tile + section)
    components/       # Header, HelpMenu, Toast, CommandPalette,
                      # PresetsMenu, DetailView, DropCta, etc.

  shared/    Types, message contracts, locale strings (consumed by both)
  data/      PoC JSON (10 offers, en/de/es/fr — v2 drops this)

assets/      icon.svg (HomeToGo wordmark on brand purple) +
             hometogo-logo.svg (in-header wordmark)
tests/       Vitest unit tests for src/shared/ modules
docs/        See the Docs section below
```

---

## Architecture summary

Two threads, clean separation:

- **Main (QuickJS)** owns all `figma.*` API calls — building cards,
  populating frames, routing drops, listening to `selectionchange`
  and `drop`. It holds a small `OFFER_BY_ID` cache for refresh
  lookups but never fetches data itself.
- **UI (iframe)** owns the catalogue via `OffersSource`. It fetches,
  filters, sorts, and on each successful load syncs the result to
  main via the `SYNC_OFFERS` channel.

10 typed message channels carry everything between threads. See the
[message-channels table in CLAUDE.md](CLAUDE.md#message-channels).

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `⌘K` / `Ctrl+K` | Open command palette |
| `⌘Z` / `Ctrl+Z` | Undo the last drop (same as the footer Undo pill) |
| `R` | Randomize (pick a random visible tile) |
| `Enter` | Drop the selected tile(s) |
| `Esc` | Close the palette / detail / clear selection |
| `⌘A` / `Ctrl+A` | Select all visible tiles |
| `Shift-click` | Extend selection from the anchor |
| `⌘-click` / `Ctrl-click` | Toggle a tile in/out of selection |

---

## Docs

- [CLAUDE.md](CLAUDE.md) — project context for collaborators,
  including the message-channels table and interaction model.
- [CHANGELOG.md](CHANGELOG.md) — what changed and when.
- [docs/SCOPE.md](docs/SCOPE.md) — PoC scope and non-goals.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — two-thread split,
  message flow, data layer, drop routing.
- [docs/DATA_MODEL.md](docs/DATA_MODEL.md) — the `Offer` schema and
  the v2 transition.
- [docs/LAYER_NAMING_SPEC.md](docs/LAYER_NAMING_SPEC.md) —
  designer-facing spec for the `#fieldName` populate path.
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — local dev loop,
  common tasks, gotchas, "Wire a real API" recipe.
- [docs/BRAND.md](docs/BRAND.md) — HomeToGo palette + card reference.
