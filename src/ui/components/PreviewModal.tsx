import { h } from 'preact';
import styles from '../styles.css';
import type { Offer } from '@shared/types';
import type { Locale } from '@shared/locales';
import { t } from '@shared/locales';
import { formatPrice } from '@shared/format';

interface Props {
  offer: Offer;
  onClose: () => void;
  onInsert: () => void;
  onOpenDetail: () => void;
  locale: Locale;
}

export function PreviewModal({ offer, onClose, onInsert, onOpenDetail, locale }: Props) {
  return (
    <div class={styles.modalOverlay} onClick={onClose}>
      <div class={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div
          class={styles.modalImage}
          style={{ backgroundImage: `url(${offer.images[0]?.url})` }}
        >
          <button class={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <div class={styles.modalBody}>
          <h2 class={styles.modalTitle}>{offer.title}</h2>
          <div class={styles.modalLocation}>
            {offer.location.city}
            {offer.location.region ? `, ${offer.location.region}` : ''}, {offer.location.country}
          </div>

          <div class={styles.modalStatsRow}>
            <div class={styles.modalStat}>
              <div class={styles.modalStatValue}>{offer.capacity.guests}</div>
              <div class={styles.modalStatLabel}>{t('uiLabelGuests', locale)}</div>
            </div>
            <div class={styles.modalStat}>
              <div class={styles.modalStatValue}>{offer.capacity.bedrooms}</div>
              <div class={styles.modalStatLabel}>{t('uiLabelBedrooms', locale)}</div>
            </div>
            <div class={styles.modalStat}>
              <div class={styles.modalStatValue}>{offer.capacity.bathrooms}</div>
              <div class={styles.modalStatLabel}>{t('uiLabelBaths', locale)}</div>
            </div>
            <div class={styles.modalStat}>
              <div class={styles.modalStatValue}>
                {offer.rating ? offer.rating.average.toFixed(1) : '—'}
              </div>
              <div class={styles.modalStatLabel}>
                {offer.rating
                  ? t('uiNReviewsShort', locale, { n: offer.rating.count })
                  : t('uiNewShort', locale)}
              </div>
            </div>
          </div>

          {offer.shortDescription && (
            <p class={styles.modalDescription}>{offer.shortDescription}</p>
          )}

          <div class={styles.modalSection}>
            <div class={styles.modalSectionLabel}>{t('amenities', locale)}</div>
            <div class={styles.amenityGrid}>
              {offer.amenities.map((a) => (
                <span key={a} class={styles.amenityChip}>
                  {a.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          <div class={styles.modalSection}>
            <div class={styles.modalPriceRow}>
              {offer.discount && (
                <span class={styles.modalPriceOriginal}>
                  {formatPrice(offer.discount.originalPerNight, offer.price.currency, locale)}
                </span>
              )}
              <span class={styles.modalPrice}>
                {formatPrice(offer.price.perNight, offer.price.currency, locale)}
              </span>
              <span class={styles.modalPriceSuffix}>{t('uiPerNightSlash', locale)}</span>
            </div>
            <div class={styles.modalProvider}>
              {t('uiByProvider', locale, { name: offer.provider.name })} ·{' '}
              {t('uiNightsTotalSuffix', locale, {
                n: offer.price.nights,
                total: formatPrice(offer.price.total, offer.price.currency, locale),
              })}
            </div>
          </div>
        </div>
        <div class={styles.modalActions}>
          <button
            class={`${styles.btn} ${styles.btnGhost}`}
            onClick={onOpenDetail}
          >
            {t('uiOpenDetails', locale)}
          </button>
          <button
            class={`${styles.btn} ${styles.btnPrimary} ${styles.modalActionsBtn}`}
            onClick={onInsert}
          >
            {t('uiInsertCard', locale)}
          </button>
        </div>
      </div>
    </div>
  );
}
