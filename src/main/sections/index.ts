import type { Offer } from '@shared/types';
import type { Locale } from '@shared/locales';
import type { Platform } from '@shared/platforms';
import type { SectionKind } from '@shared/messages';
import { loadBrandFonts } from '../fonts';
import { buildGallery } from './gallery';
import { buildAmenities } from './amenities';
import { buildReviews } from './reviews';
import { buildPriceBreakdown } from './priceBreakdown';
import { buildTitleHeader } from './titleHeader';
import { buildQuickFacts } from './quickFacts';
import { buildReasonsToBook } from './reasonsToBook';
import { buildRoomInformation } from './roomInformation';
import { buildDescription } from './description';
import { buildHouseRules } from './houseRules';
import { buildLocation } from './location';
import { buildCancellationPolicy } from './cancellationPolicy';

/**
 * Builds a single detail-page section in the chosen locale and
 * platform layout. Each section stamps its identity + the offer id
 * via setPluginData so the Refresh action can round-trip.
 */
export async function buildSection(
  kind: SectionKind,
  offer: Offer,
  locale: Locale,
  platform: Platform = 'web',
): Promise<FrameNode> {
  await loadBrandFonts();
  let node: FrameNode;
  switch (kind) {
    case 'gallery':
      node = await buildGallery(offer, locale, platform);
      break;
    case 'titleHeader':
      node = buildTitleHeader(offer, locale, platform);
      break;
    case 'quickFacts':
      node = buildQuickFacts(offer, locale, platform);
      break;
    case 'reasonsToBook':
      node = buildReasonsToBook(offer, locale, platform);
      break;
    case 'reviews':
      node = buildReviews(offer, locale, platform);
      break;
    case 'amenities':
      node = buildAmenities(offer, locale, platform);
      break;
    case 'roomInformation':
      node = buildRoomInformation(offer, locale, platform);
      break;
    case 'description':
      node = buildDescription(offer, locale, platform);
      break;
    case 'houseRules':
      node = buildHouseRules(offer, locale, platform);
      break;
    case 'location':
      node = await buildLocation(offer, locale, platform);
      break;
    case 'priceBreakdown':
      node = buildPriceBreakdown(offer, locale, platform);
      break;
    case 'cancellationPolicy':
      node = buildCancellationPolicy(offer, locale, platform);
      break;
  }
  node.setPluginData('htgOfferId', offer.id);
  node.setPluginData('htgSectionKind', kind);
  node.setPluginData('htgLocale', locale);
  node.setPluginData('htgPlatform', platform);
  return node;
}
