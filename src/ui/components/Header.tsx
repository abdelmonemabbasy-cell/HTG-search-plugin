import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { InsertMode, ThemeMode } from '@shared/messages';
import type { Locale, StringKey } from '@shared/locales';
import { t } from '@shared/locales';
import styles from '../styles.css';

interface Props {
  mode: InsertMode;
  onModeChange: (mode: InsertMode) => void;
  onRefresh: () => void;
  onRandomize: () => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  locale: Locale;
}

const MODES: Array<{ id: InsertMode; labelKey: StringKey }> = [
  { id: 'single', labelKey: 'uiModeSingle' },
  { id: 'list', labelKey: 'uiModeList' },
  { id: 'grid', labelKey: 'uiModeGrid' },
];

const THEMES: Array<{ id: ThemeMode; labelKey: StringKey; icon: string }> = [
  { id: 'auto', labelKey: 'uiThemeAuto', icon: '◐' },
  { id: 'light', labelKey: 'uiThemeLight', icon: '☀' },
  { id: 'dark', labelKey: 'uiThemeDark', icon: '☾' },
];

export function Header({
  mode,
  onModeChange,
  onRefresh,
  onRandomize,
  theme,
  onThemeChange,
  locale,
}: Props) {
  const [themeOpen, setThemeOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!themeOpen) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [themeOpen]);

  const currentTheme = THEMES.find((th) => th.id === theme) ?? THEMES[0];

  return (
    <div class={styles.header}>
      <div class={styles.logo}>
        <span class={styles.logoApp}>HomeDrop</span>
      </div>
      <div class={styles.headerRight}>
        <button
          class={styles.iconBtn}
          onClick={onRandomize}
          title={t('uiRandomizeTooltip', locale)}
          aria-label={t('uiRandomize', locale)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8" cy="8" r="1" fill="currentColor" />
            <circle cx="16" cy="8" r="1" fill="currentColor" />
            <circle cx="8" cy="16" r="1" fill="currentColor" />
            <circle cx="16" cy="16" r="1" fill="currentColor" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
          </svg>
        </button>
        <div class={styles.themeMenu} ref={wrapRef}>
          <button
            class={styles.iconBtn}
            onClick={() => setThemeOpen((v) => !v)}
            title={`${t('uiThemeTooltip', locale)} · ${t(currentTheme.labelKey, locale)}`}
            aria-label={t('uiThemeTooltip', locale)}
          >
            <span style={{ fontSize: '14px', lineHeight: 1 }}>{currentTheme.icon}</span>
          </button>
          {themeOpen && (
            <div class={styles.themeDropdown} role="menu">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  class={`${styles.themeDropdownItem} ${theme === th.id ? styles.themeDropdownItemActive : ''}`}
                  onClick={() => {
                    onThemeChange(th.id);
                    setThemeOpen(false);
                  }}
                  role="menuitem"
                >
                  <span style={{ width: '14px', textAlign: 'center' }}>{th.icon}</span>
                  <span>{t(th.labelKey, locale)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          class={styles.iconBtn}
          onClick={onRefresh}
          title={t('uiRefresh', locale)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 4v6h-6" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
        <div class={styles.modeToggle} role="tablist">
          {MODES.map((m) => (
            <button
              key={m.id}
              class={`${styles.modeOption} ${mode === m.id ? styles.modeOptionActive : ''}`}
              onClick={() => onModeChange(m.id)}
            >
              {t(m.labelKey, locale)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
