import type { ThemeMode } from '@shared/messages';

/**
 * Apply a theme override to the iframe's <html> element. We never strip
 * the `figma-dark` class Figma sets — that one tracks the host Figma
 * theme. Instead the plugin layers a `data-theme` attribute on top:
 *
 *   - 'auto'   → follow `figma-dark` (no data-theme attr)
 *   - 'light'  → force light (data-theme="light", overrides figma-dark)
 *   - 'dark'   → force dark  (data-theme="dark")
 */
export function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  if (theme === 'auto') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

/** Resolved boolean: is the iframe currently rendering as dark? */
export function isDark(theme: ThemeMode): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return document.documentElement.classList.contains('figma-dark');
}
