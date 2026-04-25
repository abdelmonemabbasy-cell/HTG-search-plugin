# CLAUDE.md — HomeDrop Figma Plugin

Context for future Claude sessions working on this repository. The plugin is
called **HomeDrop**; HomeToGo is the brand whose product data it places.

## Design principle: sections and cards, never screens

The plugin only ever inserts **discrete components** — one card, a list
of cards, a grid of cards, or one-or-more detail-page sections.
It deliberately does **not** insert full screens, which means:

- No iOS/Android status bar, safe-area insets, notches
- No sticky header chrome, back / share / heart buttons
- No bottom navigation bar or home indicator
- No sticky bottom CTA bar
- No screen-shaped wrapper with background fill / padding / rounded
  corners (multi-item inserts use a plain auto-layout group, no chrome)

Designers compose the card/section outputs into their own screens.

## What this is

**HomeDrop** is a Proof-of-Concept Figma plugin that lets HomeToGo designers
insert real vacation-rental product data into their designs with one click
(or one drag). PoC v1 reads a local JSON file of 10 mock offers; a future v2
will call the internal HTG search/product API once it becomes available.

The core UX: open plugin → browse/search/filter properties → optionally preview
→ pick one or many → click **Drop** (or drag a tile onto the canvas) → plugin
places a fully-populated HomeToGo product card (or a list / grid of cards).

## Who asked for this

HomeToGo's design team, to eliminate the manual work of copying real property
titles, prices, ratings, and images into Figma mockups. Internal demo first, API
integration later.

## Status

- v1 scaffolded (TypeScript + `create-figma-plugin` + Preact).
- Mock data source only (no API access yet).
- Card design targets the real HomeToGo search-results card (screenshot in
  `docs/BRAND.md`). Designers will supply the official component later.
- v0.6 / v0.7 — UX polish wave: dark mode, resizable window, drag-onto-canvas,
  ⌘K command palette, multi-select, favourites, toast + undo, drop-into-frame
  with Replace toggle, canvas ↔ plugin awareness, presets, confetti. See
  `CHANGELOG.md` for the per-chunk breakdown.

## Architecture at a glance

```
src/
  main/         # Figma sandbox (QuickJS). Owns all figma.* API calls.
    index.ts       # showUI + message router + figma.on('drop') +
                   # replace-mode helpers (isReplaceableFrame,
                   # firstReplaceableFrameInSelection, replaceFrame)
    generate.ts    # Platform-aware card builder (web + iOS + Android)
    brand.ts       # Canvas tokens — Appearance-aware Proxy that swaps
                   # to LIGHT_TOKENS or DARK_TOKENS per drop
    icons.ts       # Inline SVG icon set (amenities/share/heart/…)
    images.ts      # figma.createImageAsync wrapper
    fonts.ts       # Parallel font loader
    sections/      # Phase A detail-page section builders
      index.ts        # buildSection(kind, offer, locale, platform, appearance)
      common.ts       # sectionFrame + helpers
      gallery.ts / amenities.ts / reviews.ts / priceBreakdown.ts /
      titleHeader.ts / quickFacts.ts / reasonsToBook.ts /
      roomInformation.ts / description.ts / houseRules.ts /
      location.ts / cancellationPolicy.ts
  ui/           # Preact iframe. Search + detail + pickers.
    index.tsx       # render(App) + injects favicon
    App.tsx         # Level-1 search + Level-2 detail state machine
    offers-source.ts # OffersSource + JsonOffersSource + v2 stub
    theme.ts        # Auto/Light/Dark plugin-chrome theme application
    dragImage.ts    # Custom drag-image factory (tile + section)
    styles.css      # CSS Modules + light/dark token blocks
    components/     # Header, LocaleBar (locale + platform + appearance),
                    # SearchBar, FilterBar, SortBar, ProductTile,
                    # DetailView, ResizeHandle, Toast, CommandPalette,
                    # PresetsMenu, HelpMenu, DropCta
  shared/       # Consumed by both threads (no DOM / no figma.* API).
    types.ts        # Offer + ReviewDetails + PriceBreakdown + enums
    messages.ts     # Insert*Payload + SectionKind + UiState +
                    # MultiLayout + Appearance
    locales.ts      # Locale + strings table + t(key, locale, vars)
    platforms.ts    # Platform + PLATFORM_SPEC (card dims per platform)
    format.ts       # Locale-aware price formatter
  data/
    products.json  # 10 offers; 3 enriched with detail-page data
                   # (gallery 5–6 imgs, amenitiesByCategory, reviewDetails,
                   # priceBreakdown) — the rest stay lean to cover the
                   # adaptive "missing data" path.
  assets/
    icon.svg / icon-128.png / icon-256.png / icon-512.png — plugin
    icon (HomeToGo wordmark on brand purple).
```

Main and UI threads communicate via `emit` / `on` from
`@create-figma-plugin/utilities` (typed wrappers over `postMessage`).

## Message channels

All handler interfaces live in `src/shared/messages.ts`. Wire names
(in quotes) are stable across renames.

| Channel              | Direction | Payload                                | Purpose                                   |
|----------------------|-----------|----------------------------------------|-------------------------------------------|
| `'INSERT'`           | UI → main | `InsertCardsPayload \| InsertSectionsPayload` | The main CTA — drop a card / list / grid / section |
| `'SYNC_OFFERS'`      | UI → main | `{ offers: Offer[]; locale: Locale }`  | Push the freshly-fetched catalogue so main can resolve refresh-by-id |
| `'UNDO'`             | UI → main | `{ nodeIds: string[] }`                | Toast Undo button + persistent footer Undo + ⌘Z |
| `'FIND_ALL'`         | UI → main | —                                      | Select every HomeDrop-tagged node on page |
| `'REFRESH'`          | UI → main | —                                      | Re-render selected HomeDrop nodes         |
| `'RESIZE'`           | UI → main | `UiSize`                               | Live resize while dragging the corner     |
| `'SAVE_STATE'`       | UI → main | `UiState`                              | Persist UI state (debounced)              |
| `'SAVE_UI_SIZE'`     | UI → main | `UiSize`                               | Persist final size on resize commit       |
| `'INSERTED'`         | main → UI | `ToastMessage`                         | Toast body + Undo node ids                |
| `'HIGHLIGHT_OFFER'`  | main → UI | `{ offerId: string \| null }`          | Pulse the matching tile on canvas select  |

The legacy `'DROP'` channel and the `'SELECTION_TARGET'` channel were
removed in 0.9 along with the Replace-banner feature; canvas drops
go through `figma.on('drop')` exclusively.

Two `figma.on(...)` events on the main thread:

- `selectionchange` — fires `pushHighlight()`.
- `drop` — three MIME types: `application/htg-offer`,
  `application/htg-offer-multi`, `application/htg-section`. Returning
  `false` suppresses Figma's default text-node insertion. For
  single-card drops the handler inspects `event.node`: if it's a
  replaceable frame (FRAME / COMPONENT / INSTANCE) the card swaps
  the frame at the same canvas position via `replaceFrame`;
  otherwise the card lands via `landAtDropEvent`.

## Interaction model — three ways the Drop CTA / drag behaves

Both surfaces (click CTA, drag-onto-canvas) share the same target
inference.

1. **No selection / dropped on the page** → card lands at viewport
   centre (CTA) or at the cursor (drag).
2. **A frame is selected (or dropped on)** → **replace mode**: the
   plugin swaps the frame for the new card at the frame's exact
   canvas position, inheriting the parent + auto-layout index.
   Treats existing HomeDrop cards (recognised by their `htgOfferId`
   plugin-data) as replaceable too, so designers can swap one
   property for another in one click.
3. **A page is the drop target on a multi-tile drag** → all selected
   tiles drop as a list/grid auto-layout container at the cursor.

The detail-page hero (Level 2) and each section tile in the detail
grid are also draggable, sharing the same MIME types.

The legacy `#fieldName` populate path was removed in 0.10. When v2
introduces design-system components carrying named data slots, the
populate behaviour will be re-introduced as the seam between this
plugin and the system component.

## Selection model — multi-select + split CTA

Tiles are always multi-selectable. The footer CTA infers the layout
from selection count + a persisted `multiLayout` preference
(`list` / `grid`):

- count = 0 → disabled "Pick a property"
- count = 1 → `Drop` (single card at viewport centre)
- count ≥ 2 → split-button `Drop {n} as {layout} ▾` (chevron opens
  a List / Grid menu).

`InsertMode = 'single' | 'list' | 'grid'` survives in the lower
layers (insertCards / generate.ts) but is derived in `App.tsx` from
`count <= 1 ? 'single' : multiLayout`. There is no longer a
`single`/`list`/`grid` mode toggle in the header.

Multi-select gestures:
- Plain click replaces the selection with that tile + moves anchor.
- Shift-click extends a range from the anchor.
- ⌘ / Ctrl-click toggles a tile additively without moving the
  anchor.

## Locale + Platform

Every card and section is rendered in the selected locale
(`en` / `de` / `es` / `fr`) and platform (`web` / `ios` / `android`).
Locale drives the strings table in `src/shared/locales.ts` and the
price formatter in `src/shared/format.ts`. Platform drives card
dimensions, corner radii, shadow strength, and (iOS vs Android)
whether the card has a stroke — all tokens in
`src/shared/platforms.ts#PLATFORM_SPEC`.

Both values persist via `figma.clientStorage` and are stamped on
every inserted node via `setPluginData('htgLocale', ...)` and
`setPluginData('htgPlatform', ...)` so Refresh can round-trip
without losing presentation.

## Two-level navigation

- **Level 1 (Search).** Browse / search / filter / sort / multi-
  select / drop. The default surface.
- **Level 2 (Detail).** Click `→` on a tile to drill into the
  property. The page carries a sticky breadcrumb (`← Properties /
  <title>`), the property hero (draggable — drops the card), a
  property-facts panel (4-stat row: guests/bedrooms/baths/rating;
  short description; amenity chips; price + provider), and a 12-tile
  section grid. Pick any subset of sections (Gallery, Title header,
  Quick facts, Reasons to book, Reviews, Amenities, Room information,
  Description, House rules, Location, Price breakdown, Cancellation
  policy); the CTA drops them as one vertical auto-layout container
  with a 16 px gap between sections (web + iOS + Android).

## Drop output shapes (all adaptive to the offer)

- count = 1 → single card at viewport centre.
- count ≥ 2 + multiLayout = 'list' → vertical auto-layout stack.
- count ≥ 2 + multiLayout = 'grid' → wrapping auto-layout, 2/3/4
  cols (user-controlled via the column stepper in SortBar).

The **card generator is adaptive**: it skips missing fields rather
than inserting placeholders. Offers without a discount get no discount
pill; unrated offers show "New listing"; amenities the plugin doesn't
have icons for are silently dropped; fewer than 2 images skips the
pagination dots.

## Design anchor

Card layout must match HomeToGo's production search-result card:
horizontal (image left · content middle · actions column right), with a
**purple→pink gradient "View deal" button**, **purple star** for ratings, and a
**soft-coral "Last-minute deal: -N%" pill** inside the actions column above the
strikethrough price. See `docs/BRAND.md` for the palette.

## Common tasks

| Task | Where to edit |
|------|---------------|
| Add a new offer field | `src/shared/types.ts` → `src/data/products.json` → `src/main/generate.ts` (render it) |
| Add an amenity icon | `src/main/icons.ts` (add SVG) → `AMENITY_TO_ICON` in `src/main/generate.ts` |
| Change card visuals | `src/main/generate.ts` + tokens in `src/main/brand.ts` (light + dark sets) |
| Change plugin UI look | `src/ui/styles.css` + CSS-var tokens at top (light + dark sets) |
| Add a filter chip | `src/ui/components/FilterBar.tsx` + `Filters` type + matching filter in `App.tsx` |
| Add a palette command | `paletteCommands` array in `src/ui/App.tsx` |
| Add a new message channel | `src/shared/messages.ts` (handler interface) → wire `on/emit` in `src/main/index.ts` and `src/ui/App.tsx` |
| Wire to a real API | Implement `ApiOffersSource` in `src/ui/offers-source.ts` (the file already has a commented sketch). Swap `defaultOffersSource` → `new ApiOffersSource(url)` in `App.tsx`. Add the API host + image CDN to `package.json` → `figma-plugin.networkAccess.allowedDomains`. Delete `localize()` + the `i18n` block on `Offer` once the API returns locale-specific data directly. |

## Gotchas (from the research)

1. Always `await figma.loadFontAsync(...)` before setting `TextNode.characters`.
   We centralise this in `src/main/fonts.ts#loadBrandFonts`.
2. `networkAccess.allowedDomains` gates requests but doesn't bypass CORS. The
   target host must return permissive headers.
3. `figma.createImageAsync(url)` is the preferred image loader — it fetches,
   decodes, and returns a hash in one call. Requires the domain to be in the
   allowlist.
4. Keep `documentAccess: "dynamic-page"` (set in `package.json`) and use `Async`
   node APIs — legacy synchronous ones will be removed.
5. The `layoutWrap = 'WRAP'` property needs `primaryAxisSizingMode = 'FIXED'`.
6. Don't mutate `node.fills` in place; always assign a new array.
7. `BRAND` in `src/main/brand.ts` is a Proxy that resolves to the active
   appearance's tokens. Call `setBrandAppearance(appearance)` once at the
   top of `buildCard` / `buildSection`; every `BRAND.*` read inside the
   builder picks up the right variant automatically.

## Build / run

```bash
npm install
npm run build      # writes build/main.js, build/ui.js, manifest.json
npm run watch      # incremental rebuild on save
```

In Figma desktop: **Menu → Plugins → Development → Import plugin from
manifest…** and pick the generated `manifest.json`.

## Branch / commit conventions

- Working branch: `claude/figma-plugin-json-demo-qpF2n`
- All substantive changes get an entry in `CHANGELOG.md`.
- Keep commits scoped: "data model + adaptive card" is fine; "everything" is
  not.

## When picking up this project again

1. Read `docs/SCOPE.md` for what's in and out of v1.
2. Read `docs/ARCHITECTURE.md` before touching the thread-crossing parts.
3. Read `docs/DATA_MODEL.md` before changing `Offer` — the contract is shared
   with `products.json` and (in v2) `parseApiOffer`.
4. Check `CHANGELOG.md` for recent moves.
