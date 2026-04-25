# HomeDrop — Figma Plugin

HomeDrop is the HomeToGo design team's Figma plugin: drop real
vacation-rental product data straight into your designs in one click
(or one drag). Browse, filter, drill into a property, and place a
fully-populated HomeToGo product card, list, grid, or detail-page
section — without copy-pasting a single title, price, or image.

> **Status:** Proof of concept. Today the catalogue is a bundled JSON
> file (`src/data/products.json`) consumed via `JsonOffersSource`. v2
> swaps in `ApiOffersSource` (one line in `src/ui/App.tsx`) so the
> plugin pulls live data from the HomeToGo search/product API. See
> [`docs/ARCHITECTURE.md#data-layer-v08`](docs/ARCHITECTURE.md).

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

For iterative development:

```bash
npm run watch      # incremental rebuild on save
npm test           # run the Vitest suite once
```

---

## What HomeDrop does

The plugin places **discrete components**, never full screens — one
card, a list of cards, a grid of cards, or one-or-more detail-page
sections. Designers compose those outputs into their own screen
chrome (status bars, navigation, sticky CTAs).

### Selection model + Drop CTA

Tiles are always multi-selectable. The footer CTA infers the layout
from the selection count plus a persisted `multiLayout` preference
(`list` / `grid`):

| Selection | CTA |
|-----------|-----|
| 0 | Disabled "Pick a property" |
| 1 | `Drop` — single card at viewport centre |
| 2+ | Split-button `Drop {n} as list ▾` (chevron opens a List / Grid menu). Layout choice persists. |

- **Plain click** replaces the selection with that tile.
- **Shift-click** extends the visible-list range from the anchor.
- **⌘ / Ctrl-click** toggles a tile additively without moving the
  anchor.

When the CTA becomes enabled (count goes 0 → 1), a brief pulse draws
the eye to the freshly-actionable button.

### Two-level navigation

- **Level 1 — Search.** Browse, search, filter, sort, multi-select,
  drop. The default surface.
- **Level 2 — Property detail.** Click `→` on a tile to drill in. The
  hero, a property-facts panel (guests / bedrooms / baths / rating,
  short description, amenity chips, price + provider), and a grid of
  12 sections all scroll under a sticky breadcrumb (`← Properties /
  <Property name>`). Pick any subset of sections — Gallery, Title
  header, Quick facts, Reasons to book, Reviews, Amenities, Room
  information, Description, House rules, Location, Price breakdown,
  Cancellation policy — and drop them as one auto-layout container
  that rebuilds the full rental detail page.

### Locale + platform aware

Every card and section renders in the chosen **locale**
(`en` / `de` / `es` / `fr`) and **platform** (`web` / `iOS` /
`Android`). Locale drives prices, category labels, amenity headings,
sub-rating labels, CTAs — every visible string. Platform drives card
dimensions, corner radii, shadow strength, and (iOS vs Android)
whether the card has a stroke.

Both selections persist via Figma's `clientStorage` and stamp on
every inserted node, so the **Refresh** button can re-render against
the current data without losing presentation.

### Adaptive cards

Every section is conditional on the offer actually carrying that
data. No discount → no "Last-minute deal" pill. No rating → "New
listing". Fewer than 2 images → no pagination dots. Amenities the
plugin doesn't have icons for are silently dropped. Designers never
see placeholder noise.

---

## How the UX works

### Four ways to drop a card

1. **Click the Drop CTA** with no canvas selection → card lands at
   the viewport centre.
2. **Click Drop with a single `#fieldName` text/shape selected** → the
   plugin fills that one layer with the matching offer field. (e.g.
   select `#title` → the layer's text becomes the property title.)
3. **Click Drop with a frame selected that contains `#fieldName`
   children** → the plugin populates every matching descendant.
4. **Drag a tile onto the canvas** → routed through Figma's native
   `figma.on('drop')` event. Same target inference: dropped on a
   `#field` text/shape → fill that one; dropped on a frame with
   `#field` descendants → fill them all; dropped on a plain frame →
   append the card as a child; dropped on the page → land at the
   cursor.

The detail-page hero (Level 2) is also draggable and behaves like a
tile — drag from the hero to drop the property's card.

Each of the 12 detail sections is independently draggable too: drag a
section tile from the detail-grid onto the canvas to drop just that
one section.

### Favourites

- **Star (★)** any tile to favourite it (the star bounces briefly
  when toggled). The Favourites filter chip in the search bar shows
  the count and filters the grid to just the starred ones. Both
  persist across sessions.
- **`R`** picks a random visible tile.

### ⌘K command palette

Press `⌘K` (or `Ctrl+K`) for fuzzy substring search across every
plugin command:

- **Drop**, **Random**, **Refresh**, **Find all** (selects every
  HomeDrop card on the current page and zooms to fit).
- **Multi layout** (`list` / `grid`), **Platform** (`web` / `iOS` /
  `Android`), **Locale** (`EN` / `DE` / `ES` / `FR`), **Theme**
  (`Auto` / `Light` / `Dark`).
- **Apply preset** restores a saved combination of multiLayout +
  platform + locale + gridColumns + sort.

### Presets

The header's **Presets** dropdown lists every saved combination of
`multiLayout + platform + locale + gridColumns + sort`. "Save current
settings…" expands an inline naming row, prefilled with a smart
default (`Web · EN · 3 cols`); press Enter to commit.

### Help menu

The header's **`?`** dropdown carries six bite-size cards covering
Drop, drag, populate, ⌘K palette, multi-select, and the favourites
star — everything a first-time user needs to discover the power
features.

### Canvas → plugin awareness

Select an inserted HomeDrop card on the canvas → its tile in the
plugin **pulses** for 1.4 s and scrolls into view, so designers know
which property a placed card maps to.

### Toast + persistent Undo

Every successful drop fires a 5 s bottom toast confirming what
landed. The toast carries an **Undo** button that removes the
freshly-placed nodes.

If the toast disappears before you react, a small **`↺ Undo`** pill
stays in the footer between the hint and the Drop CTA until the next
drop replaces it. **`⌘Z` / `Ctrl+Z`** also fires the same undo.

### Theme + window sizing

- **Theme picker** in the header (Auto / Light / Dark). Auto follows
  Figma's host theme via `html.figma-dark` / `html.figma-darker`;
  Light and Dark force an override. Dark mode uses Figma's native
  panel palette so the plugin reads as part of the host.
- **Drag the bottom-right corner** to resize the plugin window. Size
  is clamped 360×480 → 900×1200 and persisted to `clientStorage`.

### Search

Autofocused on open, with a `×` clear button that appears when there
is text. Search across title, city, country, and neighbourhood.

---

## Populate your own component

Name your layers with a `#` prefix matching one of the documented
keys, and the plugin will override them in place — either via the
Drop CTA in single-card mode or by dragging a tile / the detail
hero directly onto your layer or frame.

| Layer name | Gets set to |
|------------|-------------|
| `#title` | Offer title |
| `#pricePerNight` | `€128` |
| `#priceOriginal` | `€151` (strikethrough-ready) |
| `#discountLabel` | `Last-minute deal: -15%` |
| `#ratingAverage` | `4.7` |
| `#ratingCount` | `(284 reviews)` |
| `#location` | `3.4 km to center · Berlin Prenzlauer Berg` |
| `#providerLine` | `Promoted by Vrbo` |
| `#image` | Hero image as an image fill |
| `#imageSecondary` | Second image |

Full spec in [`docs/LAYER_NAMING_SPEC.md`](docs/LAYER_NAMING_SPEC.md).
Match is case- and separator-insensitive
(`#PricePerNight` = `#price_per_night` = `#price-per-night`).

A single selected `#field` text/shape fills that one node. A frame
that contains `#field` descendants fills them all.

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

The data layer is intentionally on the UI thread (where `fetch()`
lives) so v2's API swap is a one-line change in `App.tsx`. See
[`docs/ARCHITECTURE.md#data-layer-v08`](docs/ARCHITECTURE.md) for
the boot+sync flow and the v2 transition path.

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

- [CLAUDE.md](CLAUDE.md) — project context for AI collaborators,
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
