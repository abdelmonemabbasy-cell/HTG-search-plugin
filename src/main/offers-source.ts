import productsJson from '@data/products.json';
import type { Offer } from '@shared/types';

/**
 * Read-only data source for the property catalogue. Today the only
 * implementation is `JsonOffersSource`, which inlines
 * `src/data/products.json` at build time. v2 will add an
 * `ApiOffersSource` that fetches from the HomeToGo search/product
 * API; main/index.ts only ever depends on this interface.
 *
 * Methods are async on purpose — the JSON impl resolves immediately,
 * but we want main/index.ts to be `await`-shaped today so the v2 swap
 * is a one-line change.
 */
export interface OffersSource {
  /** Every offer, in the order the source returned them. */
  getAll(): Promise<Offer[]>;
  /** A single offer by id, or null when the source doesn't have it. */
  getById(id: string): Promise<Offer | null>;
}

/** JSON-backed source. The catalogue is bundled at build time via
 *  esbuild's resolveJsonModule, so getAll() is effectively free. */
export class JsonOffersSource implements OffersSource {
  private readonly offers: Offer[];
  private readonly byId: Map<string, Offer>;

  constructor(offers: Offer[]) {
    this.offers = offers;
    this.byId = new Map(offers.map((o) => [o.id, o]));
  }

  async getAll(): Promise<Offer[]> {
    return this.offers;
  }

  async getById(id: string): Promise<Offer | null> {
    return this.byId.get(id) ?? null;
  }
}

/** The default source the plugin boots with. v2 will replace this
 *  with an ApiOffersSource constructed from a fetch URL + auth. */
export const defaultOffersSource: OffersSource = new JsonOffersSource(
  productsJson as unknown as Offer[],
);
