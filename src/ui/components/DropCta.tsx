import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { MultiLayout } from '@shared/messages';
import type { Locale } from '@shared/locales';
import { t } from '@shared/locales';
import styles from '../styles.css';

interface Props {
  count: number;
  multiLayout: MultiLayout;
  onMultiLayoutChange: (m: MultiLayout) => void;
  onDrop: () => void;
  /** Pre-formatted CTA label (computed by App's insertLabel). */
  label: string;
  locale: Locale;
}

/**
 * Primary footer CTA. Behaves as a single button when 0–1 items are
 * selected; when 2+ items are selected it splits into a Drop button and
 * a chevron that opens a small layout picker (List / Grid). Active
 * layout is signalled with a check.
 */
export function DropCta({
  count,
  multiLayout,
  onMultiLayoutChange,
  onDrop,
  label,
  locale,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  const isSplit = count >= 2;
  const disabled = count === 0;

  if (!isSplit) {
    return (
      <button
        class={`${styles.btn} ${styles.btnPrimary}`}
        onClick={onDrop}
        disabled={disabled}
      >
        {label}
      </button>
    );
  }

  return (
    <div class={styles.dropCtaSplit} ref={wrapRef}>
      <button
        class={`${styles.btn} ${styles.btnPrimary} ${styles.dropCtaPrimary}`}
        onClick={onDrop}
      >
        {label}
      </button>
      <button
        class={`${styles.btn} ${styles.btnPrimary} ${styles.dropCtaChevron}`}
        onClick={() => setOpen((v) => !v)}
        title={t('uiCtaPickLayout', locale)}
        aria-label={t('uiCtaPickLayout', locale)}
        aria-expanded={open}
      >
        ▾
      </button>
      {open && (
        <div class={styles.dropCtaMenu} role="menu">
          <LayoutItem
            active={multiLayout === 'list'}
            label={t('uiLayoutList', locale)}
            onClick={() => {
              onMultiLayoutChange('list');
              setOpen(false);
            }}
          />
          <LayoutItem
            active={multiLayout === 'grid'}
            label={t('uiLayoutGrid', locale)}
            onClick={() => {
              onMultiLayoutChange('grid');
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

function LayoutItem({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      class={`${styles.dropCtaMenuItem} ${active ? styles.dropCtaMenuItemActive : ''}`}
      onClick={onClick}
      role="menuitem"
    >
      <span class={styles.dropCtaMenuCheck}>{active ? '✓' : ''}</span>
      <span>{label}</span>
    </button>
  );
}
