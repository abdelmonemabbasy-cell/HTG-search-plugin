import { h, type JSX } from 'preact';
import type { Offer } from '@shared/types';
import type { SectionKind } from '@shared/messages';
import { SECTION_KINDS } from '@shared/messages';
import type { Locale, StringKey } from '@shared/locales';
import { t } from '@shared/locales';
import { formatPrice } from '@shared/format';
import styles from '../styles.css';

const SECTION_ICONS: Record<SectionKind, JSX.Element> = {
  gallery: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="14" rx="2" />
      <path d="m3 14 4-4 5 5" />
      <circle cx="15" cy="8" r="1.5" />
    </svg>
  ),
  titleHeader: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 7h16" />
      <path d="M4 12h12" />
      <path d="M4 17h7" />
    </svg>
  ),
  quickFacts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  ),
  reasonsToBook: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="m9 12 2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  reviews: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="m12 3 2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.3 9.4l6-.9z" />
    </svg>
  ),
  amenities: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  roomInformation: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 18v-6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6" />
      <path d="M3 18h18" />
      <path d="M7 9V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  description: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  ),
  houseRules: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 4h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </svg>
  ),
  location: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  ),
  priceBreakdown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3v18" />
      <path d="M16 7H10a2.5 2.5 0 0 0 0 5h4a2.5 2.5 0 0 1 0 5H8" />
    </svg>
  ),
  cancellationPolicy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6" />
      <path d="M15 9l-6 6" />
    </svg>
  ),
};

interface Props {
  offer: Offer;
  selected: Set<SectionKind>;
  onToggle: (kind: SectionKind) => void;
  onBack: () => void;
  onSelectAll: () => void;
  onClear: () => void;
  onSectionDragStart?: (kind: SectionKind, e: DragEvent) => void;
  locale: Locale;
}

const TILE_KEYS: Record<SectionKind, { label: StringKey; desc: StringKey }> = {
  gallery: { label: 'uiTileGallery', desc: 'uiTileGalleryDesc' },
  titleHeader: { label: 'uiTileTitleHeader', desc: 'uiTileTitleHeaderDesc' },
  quickFacts: { label: 'uiTileQuickFacts', desc: 'uiTileQuickFactsDesc' },
  reasonsToBook: { label: 'uiTileReasonsToBook', desc: 'uiTileReasonsToBookDesc' },
  reviews: { label: 'uiTileReviews', desc: 'uiTileReviewsDesc' },
  amenities: { label: 'uiTileAmenities', desc: 'uiTileAmenitiesDesc' },
  roomInformation: { label: 'uiTileRoomInformation', desc: 'uiTileRoomInformationDesc' },
  description: { label: 'uiTileDescription', desc: 'uiTileDescriptionDesc' },
  houseRules: { label: 'uiTileHouseRules', desc: 'uiTileHouseRulesDesc' },
  location: { label: 'uiTileLocation', desc: 'uiTileLocationDesc' },
  priceBreakdown: { label: 'uiTilePriceBreakdown', desc: 'uiTilePriceBreakdownDesc' },
  cancellationPolicy: { label: 'uiTileCancellationPolicy', desc: 'uiTileCancellationPolicyDesc' },
};

export function DetailView({
  offer,
  selected,
  onToggle,
  onBack,
  onSelectAll,
  onClear,
  onSectionDragStart,
  locale,
}: Props) {
  const heroUrl = offer.images[0]?.url;
  return (
    <div class={styles.detail}>
      <div class={styles.detailBreadcrumb}>
        <button class={styles.detailBackBtn} onClick={onBack}>
          ← {t('uiBreadcrumbProperties', locale)}
        </button>
        <span class={styles.detailBreadcrumbSep}>/</span>
        <span class={styles.detailBreadcrumbTitle} title={offer.title}>
          {offer.title}
        </span>
      </div>

      <div
        class={styles.detailHero}
        style={heroUrl ? { backgroundImage: `url(${heroUrl})` } : undefined}
      >
        <div class={styles.detailHeroOverlay}>
          <div class={styles.detailCategory}>
            {offer.categoryLabel ?? t(offer.propertyType as StringKey, locale)}
          </div>
          <div class={styles.detailTitle}>{offer.title}</div>
          <div class={styles.detailLocation}>
            {offer.location.neighborhood
              ? `${offer.location.city} ${offer.location.neighborhood}`
              : `${offer.location.city}, ${offer.location.country}`}
          </div>
        </div>
      </div>

      <div class={styles.detailFacts}>
        <div class={styles.detailFactsRow}>
          <Stat value={String(offer.capacity.guests)} label={t('uiLabelGuests', locale)} />
          <Stat value={String(offer.capacity.bedrooms)} label={t('uiLabelBedrooms', locale)} />
          <Stat value={String(offer.capacity.bathrooms)} label={t('uiLabelBaths', locale)} />
          <Stat
            value={offer.rating ? offer.rating.average.toFixed(1) : '—'}
            label={
              offer.rating
                ? t('uiNReviewsShort', locale, { n: offer.rating.count })
                : t('uiNewShort', locale)
            }
          />
        </div>

        {offer.shortDescription && (
          <p class={styles.detailDescription}>{offer.shortDescription}</p>
        )}

        {offer.amenities.length > 0 && (
          <div class={styles.detailAmenities}>
            {offer.amenities.slice(0, 8).map((a) => (
              <span key={a} class={styles.detailAmenityChip}>
                {a.replace(/_/g, ' ')}
              </span>
            ))}
            {offer.amenities.length > 8 && (
              <span class={styles.detailAmenityChipMore}>
                +{offer.amenities.length - 8}
              </span>
            )}
          </div>
        )}

        <div class={styles.detailPriceRow}>
          {offer.discount && (
            <span class={styles.detailPriceOriginal}>
              {formatPrice(offer.discount.originalPerNight, offer.price.currency, locale)}
            </span>
          )}
          <span class={styles.detailPrice}>
            {formatPrice(offer.price.perNight, offer.price.currency, locale)}
          </span>
          <span class={styles.detailPriceSuffix}>{t('uiPerNightSlash', locale)}</span>
          <span class={styles.detailPriceMeta}>
            · {t('uiByProvider', locale, { name: offer.provider.name })}
          </span>
        </div>
      </div>

      <div class={styles.detailSectionActions}>
        <span class={styles.detailSectionHeading}>{t('uiSectionsToInsert', locale)}</span>
        <div class={styles.detailSectionActionsBtns}>
          <button
            class={styles.bulkBarBtn}
            onClick={onSelectAll}
            disabled={selected.size === SECTION_KINDS.length}
          >
            {t('uiSelectAll', locale)}
          </button>
          <button
            class={styles.bulkBarBtnGhost}
            onClick={onClear}
            disabled={selected.size === 0}
          >
            {t('uiClear', locale)}
          </button>
        </div>
      </div>

      <div class={styles.sectionGrid}>
        {SECTION_KINDS.map((kind) => {
          const keys = TILE_KEYS[kind];
          const isSelected = selected.has(kind);
          const hasData = sectionHasData(kind, offer);
          return (
            <button
              key={kind}
              class={`${styles.sectionTile} ${isSelected ? styles.sectionTileSelected : ''} ${!hasData ? styles.sectionTileDisabled : ''}`}
              onClick={() => hasData && onToggle(kind)}
              disabled={!hasData}
              draggable={hasData && !!onSectionDragStart}
              onDragStart={(e) => hasData && onSectionDragStart?.(kind, e as unknown as DragEvent)}
              title={!hasData ? t('uiTileNotAvailable', locale) : undefined}
            >
              <span class={styles.sectionTileIcon} aria-hidden="true">
                {SECTION_ICONS[kind]}
              </span>
              <div class={styles.sectionTileText}>
                <div class={styles.sectionTileLabel}>{t(keys.label, locale)}</div>
                <div class={styles.sectionTileDescription}>
                  {hasData ? t(keys.desc, locale) : t('uiTileNotAvailable', locale)}
                </div>
              </div>
              {isSelected && <span class={styles.sectionTileCheck}>✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div class={styles.detailStat}>
      <div class={styles.detailStatValue}>{value}</div>
      <div class={styles.detailStatLabel}>{label}</div>
    </div>
  );
}

function sectionHasData(kind: SectionKind, offer: Offer): boolean {
  switch (kind) {
    case 'gallery':
      return offer.images.length > 0;
    case 'titleHeader':
      return true;
    case 'quickFacts':
      return true;
    case 'reasonsToBook':
      return true;
    case 'reviews':
      return !!offer.reviewDetails || !!offer.rating;
    case 'amenities':
      return offer.amenities.length > 0;
    case 'roomInformation':
      return true;
    case 'description':
      return !!offer.fullDescription || !!offer.shortDescription;
    case 'houseRules':
      return true;
    case 'location':
      return true;
    case 'priceBreakdown':
      return !!offer.priceBreakdown || !!offer.price;
    case 'cancellationPolicy':
      return true;
  }
}
