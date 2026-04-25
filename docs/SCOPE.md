# Scope — PoC v1

## Goal

Convince the HomeToGo design team that a one-click plugin can replace the
manual copy-pasting of product titles, prices, ratings, and images into
Figma mockups. Ship a working demo that loads real-looking HTG offers from
a local JSON file, lets designers browse/search/filter them, and inserts a
populated HomeToGo product card onto the canvas.

## In scope

- **10 mock offers** in `src/data/products.json`, realistic enough for design
  reviews: varied cities, currencies, ratings, discounts, and amenities;
  umlauts and long titles for layout testing.
- **Figma-native UI** (Preact + `@create-figma-plugin/ui`) styled with the
  HomeToGo palette: purple→pink gradient CTA, purple star, soft-coral discount
  pill, neutral card grid.
- **Multi-select + split-button CTA**, all adaptive to the offer's
  available fields. Selection count + a persisted `multiLayout`
  preference drive the engine mode:
  - 1 selected → single card at viewport centre
  - 2+ selected → vertical auto-layout list, or wrapping auto-layout
    grid (2 / 3 / 4 columns)
- **Replace mode**: select an empty placeholder frame (or an existing
  HomeDrop card) and click Drop → the plugin swaps the frame for the
  new card at the exact same canvas position, inheriting the parent
  and auto-layout index. Same trick works on drag.
- **Light / Dark Appearance toggle**: independent of the plugin's
  own UI theme, switches the dropped card between light- and
  dark-variant tokens so designers can build dark-mode mockups
  without leaving the plugin.
- **Search + filter**: free-text search across title/city/country/
  neighbourhood, plus filter chips for price ceiling, min rating,
  min guest count, property type, and a heart-icon Favourites chip
  with a count badge.
- **Detail page (Level 2)**: drill into a property to see the hero,
  property facts, amenity chips, price, and pick any subset of 12
  detail-page sections to drop as one auto-layout container.
- **Adaptive rendering**: every card section is conditional on the
  offer actually having that data. No placeholder noise.
- **UX polish**:
  - Native-feeling dark mode tuned to Figma's `#2C2C2C` panel
    palette.
  - Resizable plugin window with size persisted in clientStorage.
  - Tile click toggles selection; shift-click extends a range;
    persistent favourites (heart); randomize icon-button next to
    the Drop CTA + R shortcut.
  - ⌘K command palette; bottom Toast with Undo + a persistent
    footer Undo pill (and ⌘Z); saved presets (multiLayout +
    platform + locale + appearance + gridColumns + sort).
  - Canvas selection awareness: tiles pulse when their card is
    selected on the canvas.

## Non-goals — what the plugin intentionally does NOT do

The plugin **inserts components, not screens**. It never generates:

- iOS/Android status bars, safe-area insets, notches
- Sticky headers / back / share / heart chrome
- Bottom navigation bars or home indicators
- Sticky bottom CTA bars
- Background frames shaped like a phone screen

Multi-item inserts (list / grid / multi-section) use a plain
auto-layout group with no fills, no padding, no corner radius, no
stroke — purely for spacing. Designers wrap the output in their own
screen chrome.

## Out of scope (deferred to v2 or later)

- **Real API integration.** The internal HTG search/product API is not
  accessible from this session. The network-access allowlist and message
  shape are designed to make swapping in `fetch` a small change.
- **Authentication / user-specific data.** PoC is read-only and anonymous.
- **Official HTG design-system component import.** Designers will
  provide the production product-card component via team library;
  the plugin will then `figma.importComponentByKeyAsync(key)` to
  place it. The replace-mode flow becomes the contract: drop a
  property onto a system component instance to swap data + variants.
- **Production icon set.** The PoC ships generic line icons; the HTG icon
  library will replace them.
- **Persistence.** Client-storage of last search / filters / multiLayout is a v2 nice-to-have.
- **Undo affordances beyond Figma's own.** We don't track our own history.
- **Localised formatting.** Currency symbols are EUR/GBP/USD only; prices use
  `en-US` number formatting.
- **Pagination, infinite scroll, lazy image loading.** 10 offers fit on screen.
- **Unit tests.** The PoC is visually verified in Figma; we'll add a test
  harness once v2 is scoped.
- **Publishing to the Figma community.** The plugin is intended for internal
  use only at this stage.

## Success criteria

1. Designer opens HomeDrop, picks a property, clicks **Drop** → a
   full HomeToGo product card appears on canvas, ready to slot into
   their mockup.
2. Designer multi-selects 3–5 properties (shift / cmd-click), opens
   the split-button CTA chevron, picks **Drop as list** or **Drop as
   grid** → an auto-layout container with populated cards is placed.
   Layout choice persists for the next multi-drop.
3. Designer selects an empty placeholder frame and clicks **Drop**
   → the plugin removes the frame and places the new card at the
   exact same canvas position, inheriting parent + auto-layout
   index. Replace-mode also works on existing HomeDrop cards: select
   one, click Drop with a different property, and the card swaps in
   place.
4. Designer toggles **Appearance: Dark** in the LocaleBar → the next
   drop renders the dark-variant card (dark surface, white-ish
   text), while the plugin's own UI theme stays on its own setting.
5. Designer drills into a property (Level 2), picks 3 sections, and
   clicks **Drop sections** → those sections drop as a single
   vertical auto-layout container with 16 px gap (web + iOS +
   Android).
6. Designer drags a tile (or the detail-page hero) onto the canvas →
   card lands at the cursor via `figma.on('drop')`. Drag onto a
   frame → the frame is replaced.
7. Designer toggles between Auto / Light / Dark → the plugin colour
   scheme flips immediately, dark mode reads as native Figma chrome,
   and the choice persists across sessions.
8. Designer resizes the plugin window via the corner handle → new
   size persists across sessions.
9. Designer hearts a few tiles, opens the Favourites filter chip,
   randomises with `R`, opens the ⌘K palette → all behaviours work
   without lag and persist what they should.
10. Designer presses Undo on the toast (or the persistent footer
    Undo pill, or `⌘Z`) after any successful drop → the freshly-
    placed nodes are removed.
11. Designer runs Refresh on selected HomeDrop cards → cards rebuild
    against the current data in the same locale + platform they were
    inserted in.
12. Demo runs end-to-end without internet access beyond the Unsplash
    allowlist. The decision to build v2 (API-backed) is informed by
    what the demo reveals.
