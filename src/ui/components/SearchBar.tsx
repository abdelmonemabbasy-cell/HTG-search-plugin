import { h } from 'preact';
import type { Locale } from '@shared/locales';
import { t } from '@shared/locales';
import styles from '../styles.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  locale: Locale;
}

export function SearchBar({ value, onChange, locale }: Props) {
  return (
    <div class={styles.searchRow}>
      <div class={styles.searchBox}>
        <span class={styles.searchIcon}>⌕</span>
        <input
          class={styles.searchInput}
          type="text"
          placeholder={t('uiSearchPlaceholder', locale)}
          value={value}
          onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        />
      </div>
    </div>
  );
}
