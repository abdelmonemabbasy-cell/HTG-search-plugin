# Architecture

## Two threads, one bridge

Figma plugins run code in two sandboxed contexts:

| Thread | Runtime | Can… | Cannot… |
|--------|---------|------|---------|
| **Main** (`src/main/*`) | QuickJS sandbox | Call `figma.*`, create/edit nodes | Touch the DOM, use `fetch` freely |
| **UI** (`src/ui/*`) | iframe (browser) | Use Preact, DOM, `fetch`, images | Touch the scene graph |

They talk via `postMessage`, wrapped here by `emit` / `on` from
`@create-figma-plugin/utilities` for type-safety.

```
┌──────────────── Figma desktop / web ────────────────┐
│                                                     │
│  ┌───────────────┐          ┌───────────────┐       │
│  │  UI (iframe)  │          │   Main        │       │
│  │  Preact app   │   emit   │   QuickJS     │       │
│  │  styles.css   │────────▶│   figma.*      │       │
│  │  ProductTile  │◀──── on  │   buildCard    │       │
│  │  DetailView   │          │   replaceFrame │       │
│  └───────────────┘          └───────────────┘       │
│          ▲                         │                │
│          │                         ▼                │
│          │                  scene graph nodes       │
│          │                                          │
└──────────┼──────────────────────────────────────────┘
           │
    products.json (bundled at build time via esbuild)
```

## File structure

```
src/
├── main/                  # main-thread (QuickJS)
│   ├── index.ts           # entry — showUI + message router
│   ├── generate.ts        # platform-aware card builder (web + iOS + Android)
│   ├── brand.ts           # BRAND (Appearance Proxy), FONT, VIEW_DEAL_GRADIENT
│   ├── icons.ts           # inline SVGs + placeIcon()
│   ├── images.ts          # loadImageHash, applyImageFill
│   ├── fonts.ts           # loadBrandFonts (parallel + memoised)
│   └── sections/          # Phase A detail-page section builders
│       ├── index.ts       # buildSection(kind, offer, locale)
│       ├── common.ts      # sectionFrame/heading helpers
│       ├── gallery.ts
│       ├── amenities.ts
│       ├── reviews.ts
│       └── priceBreakdown.ts
├── ui/                    # iframe (real browser, owns fetch)
│   ├── index.tsx          # render(App) + injects the favicon
│   ├── App.tsx            # state machine (Level 1 + Level 2), emits INSERT
│   ├── offers-source.ts   # OffersSource + JsonOffersSource + parseApiOffer (v2)
│   ├── theme.ts           # applyTheme() + isDark()
│   ├── dragImage.ts       # custom setDragImage() ghost (tile + section)
│   ├── styles.css         # CSS Modules, HomeDrop tokens as custom properties
│   └── components/
│       ├── Header.tsx     # logo + canvas-action group + settings group
│       ├── LocaleBar.tsx  # locale select + platform pills
│       ├── SearchBar.tsx  # autofocused, with × clear button
│       ├── FilterBar.tsx  # filter chips incl. ♥ favourites
│       ├── SortBar.tsx    # result count + sort dropdown + grid-col stepper
│       ├── ProductTile.tsx # tile (heart fav, hover →, hover-revealed checkbox)
│       ├── DetailView.tsx # Level 2 — hero, facts panel, section grid
│       ├── DropCta.tsx    # split-button footer CTA (Drop / Drop N as ▾)
│       ├── HelpMenu.tsx   # ?-icon dropdown with six help cards
│       ├── PresetsMenu.tsx # saved-settings dropdown with inline save
│       ├── CommandPalette.tsx # ⌘K fuzzy palette
│       ├── Toast.tsx       # 5 s toast with Undo
│       └── ResizeHandle.tsx
├── shared/                # imported by both threads
│   ├── types.ts           # Offer + enums + ReviewDetails + PriceBreakdown
│   ├── messages.ts        # Insert*Payload, UiState, Section kinds
│   ├── locales.ts         # Locale, STRINGS table, t() helper
│   ├── platforms.ts       # Platform + PLATFORM_SPEC per platform
│   ├── format.ts          # formatPrice(amount, currency, locale)
│   └── layer-names.ts     # LAYER_KEYS, textForKey(offer, locale)
└── data/
    └── products.json      # 10 offers; 3 enriched with detail-page data
```

## Bundling

`create-figma-plugin` wraps esbuild. `package.json → "figma-plugin"` is the
source of truth; the CLI generates `manifest.json`, `build/main.js`, and `build/ui.js`
from it.

- Import aliases (`@shared/*`, `@data/*`) are resolved by both TypeScript
  (`tsconfig.json`) and the bundler (inferred from `baseUrl` + `paths`).
- CSS is treated as CSS Modules (`import styles from './styles.css'`).
- `products.json` is inlined at build time (`resolveJsonModule: true`).
- `documentAccess: "dynamic-page"` ensures we use the `Async` node APIs.

## Message flow

```
1. Plugin opens
   main: showUI({ width, height }, { savedState, uiSize })
   → UI receives savedState only — NOT the catalogue (it owns the
     OffersSource and fetches on mount).

2. UI mounts. useEffect fires source.search({ locale, ... }).
   → Today: JsonOffersSource resolves immediately.
   → v2:   ApiOffersSource calls fetch(); skeleton tiles cover the wait.

3. UI receives offers. Two things happen:
   a. setOffers(...)   — the grid renders.
   b. emit<SyncOffersHandler>('SYNC_OFFERS', { offers, locale })
      → main caches them in OFFER_BY_ID for Refresh / drop lookups.

4. User clicks a product tile → sets selectedIds.
   User clicks Drop CTA.
   UI: emit<InsertHandler>('INSERT', { offers, mode, gridColumns,
       locale, platform })
   where `mode` is derived from selection count + multiLayout:
       count <= 1 → 'single'; count > 1 → multiLayout.

5. Main receives INSERT:
   - Single offer + selection contains a replaceable frame
     (FRAME / COMPONENT / INSTANCE — including a previously-inserted
     HomeDrop card) → replaceFrame swaps it for the new card at the
     same canvas position, inheriting parent + auto-layout index.
   - Otherwise call insertCards(offers, mode, gridColumns):
     - single → append each card to page at viewport centre
     - list   → vertical auto-layout container of cards
     - grid   → horizontal wrap auto-layout container of cards
   - Stamp setPluginData('htgOfferId', ..., 'htgAppearance', ...).
   - figma.viewport.scrollAndZoomIntoView + figma.notify

6. Main emits `INSERTED` back to the UI with the top-level node ids
   so the UI can show a Toast with an Undo button and stash the ids
   on the persistent footer Undo pill (also fired by ⌘Z).
```

### Figma events (main thread)

| Event             | Fired by Figma when…                              | Side-effects                                                                                                         |
|-------------------|---------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| `selectionchange` | Any selection mutation on the current page        | Calls `pushHighlight()` → emits `HIGHLIGHT_OFFER` so the matching tile pulses in the plugin grid. |
| `drop`            | The user releases a drag from the plugin iframe   | Reads `event.items` for the three MIME types (`application/htg-offer`, `-multi`, `-section`). For single-offer drops: if `event.node` is a replaceable frame, swap it via `replaceFrame`; otherwise land via `landAtDropEvent` (append-as-child or land-at-cursor). Returns `false` so Figma doesn't insert its own text node. |

### Message channels

Every channel is typed in `src/shared/messages.ts` and consumed via
`emit/on`. The legacy `DROP` channel and the `SELECTION_TARGET`
channel were removed in 0.9.

| Channel | Direction | Payload | Purpose |
|---------|-----------|---------|---------|
| `INSERT` | UI → main | `InsertCardsPayload \| InsertSectionsPayload` | Card or section insert |
| `SYNC_OFFERS` | UI → main | `{ offers: Offer[]; locale: Locale }` | Push fresh catalogue so main can resolve refresh-by-id |
| `UNDO` | UI → main | `{ nodeIds: string[] }` | Toast Undo + persistent footer Undo + ⌘Z |
| `FIND_ALL` | UI → main | — | Select every HomeDrop-tagged node on the page |
| `REFRESH` | UI → main | — | Re-render selected HomeDrop cards |
| `RESIZE` | UI → main | `UiSize` | Live resize while dragging the handle |
| `SAVE_STATE` | UI → main | `UiState` | Persist UI state to clientStorage (debounced) |
| `SAVE_UI_SIZE` | UI → main | `UiSize` | Persist final size on resize commit |
| `INSERTED` | main → UI | `ToastMessage` | Toast body + Undo node ids |
| `HIGHLIGHT_OFFER` | main → UI | `{ offerId: string \| null }` | Pulse a tile when its card is selected on canvas |

## Adaptive card

`buildCard(offer)` always produces a valid card, but drops sections the
offer doesn't populate:

| Condition | Effect |
|-----------|--------|
| `offer.rating` undefined | Rating row replaced with `New listing` label |
| `offer.discount` undefined | No "Last-minute deal" pill, no strikethrough price |
| `offer.amenities` has no mappable icons | Amenity icon row omitted |
| `offer.images.length < 2` | No pagination dots |
| `offer.location.neighborhood` undefined | Location line falls back to `City, Country` |
| `offer.location.distanceToCenterKm` undefined | No "X km to center" prefix |

This is implemented inline in `src/main/generate.ts` — no separate variants
needed, no "default" placeholder text.

## Two-level navigation + locale + platform

The plugin UI has two levels:

- **Level 1 — Search.** Browse, filter, sort, multi-select tiles,
  drop. Tiles always allow multi-select (no mode toggle); the footer
  CTA infers single vs list vs grid from selection count + a
  persisted `multiLayout` preference. The `→` button on each tile
  drills into Level 2.
- **Level 2 — Property detail.** Sticky breadcrumb (`← Properties /
  <title>`), draggable hero (drops the card), property-facts panel
  (4-stat row + short description + amenity chips + price), and a
  12-tile section grid. Selected sections drop as one vertical
  auto-layout container with 16 px gap (web + iOS + Android).

Every card and section is rendered in the chosen **locale** (EN / DE /
ES / FR — selected via the LocaleBar select) and **platform**
(Web / iOS / Android). Locale flows through to `formatPrice`,
category labels, amenity section headings, sub-rating labels, CTAs —
every visible string. Platform changes card dimensions, corner radii,
shadow strength, and (iOS vs Android) whether the card has a stroke.

Both choices are persisted via `figma.clientStorage` and re-applied
when the plugin reopens. Inserted nodes also stamp their locale and
platform via `setPluginData`, so the Refresh action can round-trip
them against the current data without losing presentation.

## Drop output shapes

`InsertMode` is still `'single' | 'list' | 'grid'` for the lower-
layer engine, but the UI never exposes it as a toggle — it derives
from selection count + the user's `multiLayout` preference.

| Engine mode | Triggered by | Output | Auto-layout config |
|-------------|--------------|--------|--------------------|
| `single` | count ≤ 1 | Loose card on page at viewport centre | none (card is itself vertical auto-layout) |
| `list` | count ≥ 2 + multiLayout = 'list' | Wrapper frame | `layoutMode: VERTICAL, primaryAxis: AUTO, itemSpacing: 16` |
| `grid` | count ≥ 2 + multiLayout = 'grid' | Wrapper frame | `layoutMode: HORIZONTAL, layoutWrap: WRAP, primaryAxis: FIXED` (width = N×card + gaps), N = `gridColumns` (2/3/4) |

## Data layer (v0.8)

The catalogue lives behind the `OffersSource` interface in
`src/ui/offers-source.ts`:

```ts
interface OffersSource {
  search(query: SearchQuery): Promise<Offer[]>;
  getById(id: string, locale: Locale): Promise<Offer | null>;
}

interface SearchQuery {
  locale: Locale;
  text?: string;
  filters?: { propertyType?, minRating?, priceMax?, minGuests? };
  sort?: SortKey;
  limit?: number;
  cursor?: string;     // server-driven pagination, v2 only
}
```

The seam lives on the **UI thread**, not main, because the QuickJS
sandbox can't do real fetches — the iframe is where `fetch()` works.
`App.tsx` instantiates the source once and runs a `useEffect` that
calls `source.search(query)` whenever `locale | search | filters |
sort` changes. The result becomes `offers` state.

### Boot + sync flow

```
1. Plugin opens
   main: showUI({ width, height }, { savedState, uiSize })
   → UI receives savedState only — NOT the catalogue.

2. UI mounts. useEffect fires source.search({ locale, ... }).
   → Today: JsonOffersSource resolves immediately.
   → v2:   ApiOffersSource calls fetch(); skeleton tiles cover the wait.

3. UI receives offers. Two things happen:
   a. setOffers(...)   — the grid renders.
   b. emit<SyncOffersHandler>('SYNC_OFFERS', { offers, locale })
      → main caches them in OFFER_BY_ID for Refresh/DROP lookups.

4. User changes locale → step 2 re-runs with new query.locale.
   Server returns localized data; SYNC_OFFERS re-syncs the cache.

5. User clicks Refresh on selected canvas cards.
   main looks up offerId in its cache → rebuilds via buildCard.
   No round-trip back to the UI required.
```

### Loading + error UX

While `source.search()` is pending, the grid shows **6 skeleton
tiles** with an animated shimmer (dark-mode-aware). On rejection,
the empty-state shows the error message and a Retry button that
bumps a tick and re-runs the effect. Locale switches show the
loading state for as long as the new fetch takes.

### Why v2 is a one-line swap

Today's `App.tsx` is:

```ts
const [source] = useState<OffersSource>(() => defaultOffersSource);
```

v2 becomes:

```ts
const [source] = useState<OffersSource>(() => new ApiOffersSource(API_URL));
```

Plus deleting `localize()` and the `i18n` block on `Offer` (the API
returns localized data directly via `Accept-Language` / `?locale=de`).
The card renderer, the locale selector, the drop routing — all
unchanged.

## Drop routing — replace mode

Both the click CTA (via `INSERT`) and the drag-onto-canvas path (via
`figma.on('drop')`) share the same target inference — a frame is
read either from the page's current selection (CTA) or from
`event.node` (drag).

```
replaceable frame in selection (or dropped on)  → replaceFrame
   (FRAME / COMPONENT / INSTANCE, including
    previously-inserted HomeDrop cards)            (swap at same XY)
no frame                                          → land at viewport
                                                    centre / cursor
```

`replaceFrame(placeholder, child)` in `src/main/index.ts` inherits
the placeholder's parent + auto-layout index, copies its `x/y`,
appends the new card, then removes the placeholder. The auto-layout
inheritance means a card swapped inside an existing list/grid
container slots back into the same slot without breaking the layout.

`isReplaceableFrame(node)` is intentionally lax: any FRAME / COMPONENT
/ INSTANCE qualifies, including a previously-inserted HomeDrop card.
That's deliberate — swapping one property card for another is one of
the most common reasons designers reach for the plugin.

The `#fieldName` populate path was removed in 0.10. When v2 brings
the HomeToGo design-system component, the same replace flow becomes
the path for filling that component's named slots.

## Keeping v2 cheap

The contract that bridges PoC and v2:

- The `Offer` type lives in `src/shared/types.ts` and is the shape the UI
  and the generator both consume. v2 just swaps where the array of `Offer`
  comes from.
- In `src/main/index.ts` the current line `const OFFERS = productsJson as
  unknown as Offer[]` is the entire data source. v2 replaces that with a
  UI-thread `fetch` → `postMessage` → main-thread render.
- `setPluginData('htgOfferId', ...)` on every inserted root means v2 can
  find already-placed cards and refresh them against the live API.
- `networkAccess.allowedDomains` in `package.json` already lists the
  development-time CDN (Unsplash). Add the HTG API + CDN domains there for v2.
