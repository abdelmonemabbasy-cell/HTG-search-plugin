import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Locale } from '@shared/locales';
import { LOCALES, t } from '@shared/locales';
import type { Platform } from '@shared/platforms';
import { PLATFORMS } from '@shared/platforms';
import type { Appearance } from '@shared/messages';
import styles from '../styles.css';

interface Props {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  platform: Platform;
  onPlatformChange: (platform: Platform) => void;
  appearance: Appearance;
  onAppearanceChange: (a: Appearance) => void;
}

export function LocaleBar({
  locale,
  onLocaleChange,
  platform,
  onPlatformChange,
  appearance,
  onAppearanceChange,
}: Props) {
  return (
    <div class={styles.localeBar}>
      <div class={styles.localeGroup}>
        <span class={styles.localeGroupLabel}>{t('uiMarket', locale)}</span>
        <LocaleDropdown locale={locale} onChange={onLocaleChange} />
      </div>
      <div class={styles.localeGroup}>
        <span class={styles.localeGroupLabel}>{t('uiSurface', locale)}</span>
        <div class={styles.pillGroup}>
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              class={`${styles.pillBtn} ${platform === p.id ? styles.pillBtnActive : ''}`}
              onClick={() => onPlatformChange(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div class={styles.localeGroup}>
        <span class={styles.localeGroupLabel}>{t('uiAppearance', locale)}</span>
        <div class={styles.pillGroup}>
          <button
            class={`${styles.pillBtn} ${styles.pillBtnIcon} ${appearance === 'light' ? styles.pillBtnActive : ''}`}
            onClick={() => onAppearanceChange('light')}
            title={t('uiAppearanceLight', locale)}
            aria-label={t('uiAppearanceLight', locale)}
            aria-pressed={appearance === 'light'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m4.93 19.07 1.41-1.41" />
              <path d="m17.66 6.34 1.41-1.41" />
            </svg>
          </button>
          <button
            class={`${styles.pillBtn} ${styles.pillBtnIcon} ${appearance === 'dark' ? styles.pillBtnActive : ''}`}
            onClick={() => onAppearanceChange('dark')}
            title={t('uiAppearanceDark', locale)}
            aria-label={t('uiAppearanceDark', locale)}
            aria-pressed={appearance === 'dark'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Custom locale picker. Replaces the native `<select>` so we control
 * the chevron, flag rendering, and active checkmark — Figma's plugin
 * iframes restyle native selects inconsistently across platforms,
 * and a real dropdown is what every other menu in this plugin uses.
 */
function LocaleDropdown({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (locale: Locale) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const current = LOCALES.find((l) => l.id === locale) ?? LOCALES[0];

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div class={styles.localeDropdown} ref={wrapRef}>
      <button
        class={styles.localeTrigger}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span class={styles.localeFlag} aria-hidden="true">{current.flag}</span>
        <span class={styles.localeLabel}>{current.label}</span>
        <svg
          class={styles.localeChevron}
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div class={styles.localeMenu} role="listbox">
          {LOCALES.map((l) => {
            const active = l.id === locale;
            return (
              <button
                key={l.id}
                class={`${styles.localeMenuItem} ${active ? styles.localeMenuItemActive : ''}`}
                onClick={() => {
                  onChange(l.id);
                  setOpen(false);
                }}
                role="option"
                aria-selected={active}
              >
                <span class={styles.localeMenuCheck}>{active ? '✓' : ''}</span>
                <span class={styles.localeFlag} aria-hidden="true">{l.flag}</span>
                <span class={styles.localeMenuLabel}>{l.label}</span>
                <span class={styles.localeMenuCode}>{l.code}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
