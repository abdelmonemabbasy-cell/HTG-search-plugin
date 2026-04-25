import type { EventHandler } from '@create-figma-plugin/utilities';
import type { Offer, PropertyType } from './types';
import type { Locale } from './locales';
import type { Platform } from './platforms';

export type InsertMode = 'single' | 'list' | 'grid';

export type SortKey = 'default' | 'priceAsc' | 'priceDesc' | 'ratingDesc' | 'newest';

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface UiSize {
  width: number;
  height: number;
}

/** A reusable preset of plugin settings the user can apply with one click. */
export interface Preset {
  id: string;
  name: string;
  mode: InsertMode;
  platform: Platform;
  locale: Locale;
  gridColumns: number;
  sort: SortKey;
}

/** Keys of the detail-page sections the plugin can render. */
export type SectionKind =
  | 'gallery'
  | 'titleHeader'
  | 'quickFacts'
  | 'reasonsToBook'
  | 'reviews'
  | 'amenities'
  | 'roomInformation'
  | 'description'
  | 'houseRules'
  | 'location'
  | 'priceBreakdown'
  | 'cancellationPolicy';

export const SECTION_KINDS: SectionKind[] = [
  'gallery',
  'titleHeader',
  'quickFacts',
  'reasonsToBook',
  'reviews',
  'amenities',
  'roomInformation',
  'description',
  'houseRules',
  'location',
  'priceBreakdown',
  'cancellationPolicy',
];

export interface UiFilters {
  propertyType?: PropertyType;
  minRating?: number;
  priceMax?: number;
  minGuests?: number;
}

export interface UiState {
  mode: InsertMode;
  search: string;
  sort: SortKey;
  gridColumns: number;
  locale: Locale;
  platform: Platform;
  filters: UiFilters;
  theme?: ThemeMode;
  favourites?: string[];
  presets?: Preset[];
  replaceOnDrop?: boolean;
}

/** Level-1 insert (property cards). */
export interface InsertCardsPayload {
  kind: 'cards';
  offers: Offer[];
  mode: InsertMode;
  gridColumns: number;
  locale: Locale;
  platform: Platform;
}

/** Level-2 insert (detail-page sections for a single offer). */
export interface InsertSectionsPayload {
  kind: 'sections';
  offerId: string;
  sections: SectionKind[];
  locale: Locale;
  platform: Platform;
}

export type InsertPayload = InsertCardsPayload | InsertSectionsPayload;

/**
 * Drop-onto-canvas payload (UI → main). Triggered by the native drag from
 * a tile. The UI sends absolute viewport pixel coords; main converts those
 * to figma viewport coords via `figma.viewport.center / zoom` math.
 */
export interface DropPayload {
  offerId: string;
  /** UI iframe pixel coords relative to the viewport's top-left. */
  clientX: number;
  clientY: number;
  /** Figma plugin event-data drop coords (already in canvas space). */
  canvasX?: number;
  canvasY?: number;
  locale: Locale;
  platform: Platform;
  /** When true, fillIntoTarget() clears children of the target frame. */
  replaceOnDrop?: boolean;
}

export interface LoadedPayload {
  offers: Offer[];
  savedState?: UiState;
  uiSize?: UiSize;
}

export interface InsertHandler extends EventHandler {
  name: 'INSERT';
  handler: (payload: InsertPayload) => void;
}

export interface SaveStateHandler extends EventHandler {
  name: 'SAVE_STATE';
  handler: (state: UiState) => void;
}

export interface SaveUiSizeHandler extends EventHandler {
  name: 'SAVE_UI_SIZE';
  handler: (size: UiSize) => void;
}

export interface ResizeHandler extends EventHandler {
  name: 'RESIZE';
  handler: (size: UiSize) => void;
}

export interface RefreshHandler extends EventHandler {
  name: 'REFRESH';
  handler: () => void;
}

/** UI → main: drop a card at the given canvas coordinates. */
export interface DropHandler extends EventHandler {
  name: 'DROP';
  handler: (payload: DropPayload) => void;
}

/** UI → main: undo the last toast operation by node id. */
export interface UndoHandler extends EventHandler {
  name: 'UNDO';
  handler: (payload: { nodeIds: string[] }) => void;
}

/**
 * Main → UI: a description of what was just inserted, so the UI can
 * show a Toast with an Undo button. `nodeIds` are the top-level frames
 * the Undo handler will remove.
 */
export interface InsertResultPayload {
  /** Top-level node ids that should be removed when Undo is clicked. */
  nodeIds: string[];
  /** Short label, e.g. "Inserted 3 properties as a list". */
  label: string;
  /** Verb hint: 'inserted' | 'populated' | 'replaced' | 'dropped'. */
  kind: 'inserted' | 'populated' | 'replaced' | 'dropped';
}

export interface InsertResultHandler extends EventHandler {
  name: 'INSERT_RESULT';
  handler: (payload: InsertResultPayload) => void;
}

/** UI → main: select every HTG-tagged node on the current page. */
export interface FindAllHandler extends EventHandler {
  name: 'FIND_ALL';
  handler: () => void;
}

/** Main → UI: pulse the matching tile (canvas selection echo). */
export interface HighlightOfferHandler extends EventHandler {
  name: 'HIGHLIGHT_OFFER';
  handler: (payload: { offerId: string | null }) => void;
}

/** Main → UI: surface the selected drop-target frame (or null). */
export interface SelectionTargetHandler extends EventHandler {
  name: 'SELECTION_TARGET';
  handler: (payload: SelectionTargetInfo | null) => void;
}

export interface SelectionTargetInfo {
  /** Figma node id (for analytics/debug only). */
  id: string;
  /** Best human-readable label for the banner. */
  name: string;
  /** True when the frame contains at least one #fieldName layer. */
  hasFieldNames: boolean;
}

/** Back-compat aliases. */
export type InsertMessage = InsertPayload;
export type LoadedMessage = LoadedPayload;
