import type { Config } from 'tailwindcss';
import tokens from './design-system/tokens.json';
import local from './design-system/tokens.local.json';

/**
 * Tailwind hanya memetakan ke CSS variables dari tokens.css (turunan tokens.json DS v2 · Lime + tokens.local.json).
 * Palet, spacing, radius, dan ukuran font bawaan Tailwind DIMATIKAN agar tidak ada nilai hardcode.
 */
const colors: Record<string, string> = { transparent: 'transparent', current: 'currentColor' };
for (const t of tokens.color.tokens) colors[t.name] = `var(--color-${t.name})`;

const sizeTokens = [...tokens.size.tokens, ...local.size.tokens];
const spacing: Record<string, string> = { '0': '0', px: '1px', '0.5': '2px' };
for (const s of [...tokens.spacing.tokens, ...local.spacing.tokens]) spacing[s.name.replace('space-', '')] = `var(--${s.name})`;
for (const z of sizeTokens) spacing[z.name] = `var(--${z.name})`;

const borderRadius: Record<string, string> = { none: '0', full: '9999px' };
for (const r of tokens.radius.tokens) borderRadius[r.name.replace('radius-', '')] = `var(--${r.name})`;

const fontSize: Record<string, [string, { lineHeight: string; fontWeight: string; letterSpacing: string }]> = {};
for (const g of [...tokens.type.groups, ...local.type.groups]) {
  for (const s of g.styles) {
    fontSize[s.name] = [
      `var(--type-${s.name}-size)`,
      {
        lineHeight: `var(--type-${s.name}-line)`,
        fontWeight: `var(--type-${s.name}-weight)`,
        letterSpacing: `var(--type-${s.name}-tracking)`,
      },
    ];
  }
}

const sizes: Record<string, string> = {};
for (const z of sizeTokens) sizes[z.name] = `var(--${z.name})`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', './.storybook/**/*.{ts,tsx}'],
  theme: {
    colors,
    spacing,
    borderRadius,
    fontSize,
    fontFamily: { sans: 'var(--font-sans)', mono: 'var(--font-mono)' },
    fontWeight: { normal: '400', medium: '500', semibold: '600', bold: '700' },
    boxShadow: { none: 'none', overlay: 'var(--shadow-overlay)', floating: 'var(--shadow-floating)' },
    extend: {
      maxWidth: { ...sizes, none: 'none', full: '100%' },
      minHeight: sizes,
      height: sizes,
      width: sizes,
      ringWidth: { focus: '2px' },
      ringOffsetWidth: { focus: '2px' },
      transitionDuration: { fast: '120ms', appear: '160ms' },
      keyframes: {
        'p-pop-in': { from: { opacity: '0', transform: 'translateY(-4px) scale(.98)' }, to: { opacity: '1', transform: 'none' } },
        'p-rise': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
        'p-fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        'pop-in': 'p-pop-in 160ms ease both',
        rise: 'p-rise 160ms ease both',
        'fade-in': 'p-fade-in 160ms ease both',
      },
    },
  },
  plugins: [],
} satisfies Config;
