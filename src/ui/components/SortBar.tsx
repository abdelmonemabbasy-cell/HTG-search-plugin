import { h } from 'preact';
import type { SortKey, InsertMode } from '@shared/messages';
import type { Locale, StringKey } from '@shared/locales';
import { t } from '@shared/locales';
import { NumberTicker } from './NumberTicker';
import styles from '../styles.css';

interface Props {
  count: number;
  total: number;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  mode: InsertMode;
  gridColumns: number;
  onGridColumnsChange: (n: number) => void;
  locale: Locale;
}

const SORT_LABEL_KEYS: Record<SortKey, StringKey> = {
  default: 'uiSortRecommended',
  priceAsc: 'uiSortPriceAsc',
  priceDesc: 'uiSortPriceDesc',
  ratingDesc: 'uiSortTopRated',
  newest: 'uiSortNewListings',
};

export function SortBar({
  count,
  total,
  sort,
  onSortChange,
  mode,
  gridColumns,
  onGridColumnsChange,
  locale,
}: Props) {
  return (
    <div class={styles.sortBar}>
      <span class={styles.sortCount}>
        {count === total ? (
          <span>
            <NumberTicker value={total} /> {t('uiNProperties', locale, { n: total }).replace(/^\d+\s*/, '')}
          </span>
        ) : (
          <span>
            <NumberTicker value={count} />{' '}
            {t('uiNOfTotal', locale, { n: count, total }).replace(/^\d+\s*/, '')}
          </span>
        )}
      </span>
      <div class={styles.sortBarRight}>
        {mode === 'grid' && (
          <div class={styles.colStepper}>
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                class={`${styles.colStepperBtn} ${gridColumns === n ? styles.colStepperBtnActive : ''}`}
                onClick={() => onGridColumnsChange(n)}
                title={`${n} columns`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
        <div class={styles.sortSelectWrap}>
          <select
            class={styles.sortSelect}
            value={sort}
            onChange={(e) => onSortChange((e.target as HTMLSelectElement).value as SortKey)}
          >
            {(Object.keys(SORT_LABEL_KEYS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {t(SORT_LABEL_KEYS[k], locale)}
              </option>
            ))}
          </select>
          <span class={styles.sortSelectChevron}>▾</span>
        </div>
      </div>
    </div>
  );
}
