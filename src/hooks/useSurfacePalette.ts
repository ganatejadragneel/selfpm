import { useMemo } from 'react';
import { useThemeColors } from './useThemeColors';

/**
 * The handful of values every card-based surface in this app actually needs.
 *
 * Pages, Quick Notes and CPO Reports each grew their own module-level colour
 * constants (`const INK = '#1f2937'`), which meant they were silently pinned to
 * the light theme: flipping the app to dark turned them into white cards with
 * near-white text. This hook is the one place those six values come from, so a
 * theme change reaches every surface at once.
 *
 * Names match what those modules already used, so adopting it is a delete of the
 * constant block rather than a rewrite of every style object.
 */
export function useSurfacePalette() {
  const t = useThemeColors();
  return useMemo(() => {
    const c = t.colors;
    return {
      /** Body text. */
      ink: c.text.primary,
      /** Supporting text — captions, secondary columns. */
      sub: c.text.secondary,
      /** De-emphasised text — placeholders, units, empty states. */
      muted: c.text.muted,
      /** The single accent. */
      accent: c.primary.dark,
      accentSoft: c.primary.light,
      accentMedium: c.primary.medium,
      /** Hairline rules and card borders. */
      hair: c.border.light,
      /** Card background — flat. Prefer `surfaceCard` for actual cards. */
      surface: c.surface.white,
      /** Card background with depth: lit top-left, falling away bottom-right. */
      surfaceCard: c.surface.card,
      /** The one live card on a screen. Use once, or it stops meaning anything. */
      surfaceCardLive: c.surface.cardLive,
      /** Gradients for data marks (bars, areas). */
      dataFill: t.effects.dataFill,
      /** The page behind the cards. */
      page: c.background.primary,
      danger: c.status.error.dark,
      dangerSoft: c.status.error.light,
      /** Small, uppercase, letterspaced section label. */
      label: t.typography.label,
      /** Monospace, for values read as data. */
      mono: t.typography.families.mono,
      glow: t.effects.glow,
      isDark: t.currentTheme === 'dark',
    };
  }, [t]);
}
