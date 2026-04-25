import { h } from 'preact';
import { useState } from 'preact/hooks';
import styles from '../styles.css';
import type { Offer } from '@shared/types';
import type { Locale } from '@shared/locales';
import { t } from '@shared/locales';
import { formatPrice } from '@shared/format';

interface Props {
  offer: Offer;
  selected: boolean;
  favourite: boolean;
  /** When true, render a brief outline pulse (canvas selection echo). */
  pulse?: boolean;
  onToggle: (e: MouseEvent) => void;
  onOpen: () => void;
  onToggleFavourite: () => void;
  onDragStart?: (e: DragEvent) => void;
  locale: Locale;
}

export function ProductTile({
  offer,
  selected,
  favourite,
  pulse,
  onToggle,
  onOpen,
  onToggleFavourite,
  onDragStart,
  locale,
}: Props) {
  const badge = offer.badges[0];
  const isDeal = badge === 'great_deal';
  // Brief CSS animation after every favourite toggle. The bounceKey
  // bumps so React replays the keyframe even when favourite state
  // doesn't change shape (e.g. star → empty → star).
  const [bounceKey, setBounceKey] = useState(0);

  return (
    <div
      class={`${styles.tile} ${selected ? styles.tileSelected : ''} ${pulse ? styles.tilePulse : ''}`}
      onClick={(e) => onToggle(e as unknown as MouseEvent)}
      data-offer-id={offer.id}
      draggable={!!onDragStart}
      onDragStart={onDragStart}
    >
      <div
        class={styles.tileImage}
        style={{ backgroundImage: `url(${offer.images[0]?.url})` }}
      >
        <span
          class={`${styles.tileSelectBox} ${selected ? styles.tileSelectBoxOn : ''}`}
          aria-hidden="true"
        >
          {selected ? '✓' : ''}
        </span>
        {badge && (
          <span class={`${styles.tileBadge} ${isDeal ? styles.tileBadgeGreen : ''}`}>
            {badge.replace(/_/g, ' ')}
          </span>
        )}
        {offer.discount && (
          <span class={styles.tileDiscount}>-{offer.discount.percent}%</span>
        )}
        <button
          class={`${styles.tileFavBtn} ${favourite ? styles.tileFavBtnActive : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavourite();
            setBounceKey((k) => k + 1);
          }}
          title={t(favourite ? 'uiFavouriteRemove' : 'uiFavouriteAdd', locale)}
          aria-pressed={favourite}
        >
          <span key={bounceKey} class={styles.tileFavStar} aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill={favourite ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21l8.84-8.61a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </span>
        </button>
        <div class={styles.tileHoverActions}>
          <button
            class={styles.tileHoverBtn}
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            title={t('uiOpenDetails', locale)}
          >
            →
          </button>
        </div>
      </div>
      <div class={styles.tileBody}>
        <div class={styles.tileTitleRow}>
          <div class={styles.tileTitle}>{offer.title}</div>
          {offer.rating && (
            <span class={styles.tileRating}>
              <span class={styles.tileRatingStar}>★</span>
              {offer.rating.average.toFixed(1)}
            </span>
          )}
        </div>
        <div class={styles.tileLocation}>
          {offer.location.city}, {offer.location.country}
        </div>
        <div class={styles.tilePriceRow}>
          {offer.discount && (
            <span class={styles.tilePriceOriginal}>
              {formatPrice(offer.discount.originalPerNight, offer.price.currency, locale)}
            </span>
          )}
          <span class={styles.tilePrice}>
            {formatPrice(offer.price.perNight, offer.price.currency, locale)}
          </span>
          <span class={styles.tilePriceSuffix}>{t('uiPerNightSlash', locale)}</span>
        </div>
      </div>
    </div>
  );
}
