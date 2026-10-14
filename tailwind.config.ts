import type { Config } from 'tailwindcss';
import tokens from './design-system/tokens.json';

/**
 * Tailwind hanya memetakan ke CSS variables dari tokens.css (turunan tokens.json DS).
 * Palet, spacing, radius, dan ukuran font bawaan Tailwind DIMATIKAN agar tidak ada nilai hardcode.
 */
const colors: Record<string, string> = { transparent: 'transparent', current: 'currentColor' };
for (const t of tokens.color.tokens) colors[t.name] = `var(--color-${t.name})`;

const spacing: Record<string, string> = { '0': '0', px: '1px', '0.5': '2px' };
for (const s of tokens.spacing.tokens) spacing[s.name.replace('space-', '')] = `var(--${s.name})`;
for (const z of tokens.size.tokens) spacing[z.name] = `var(--${z.name})`;

const borderRadius: Record<string, string> = { none: '0', full: '9999px' };
for (const r of tokens.radius.tokens) borderRadius[r.name.replace('radius-', '')] = `var(--${r.name})`;

const fontSize: Record<string, [string, { lineHeight: string; fontWeight: string; letterSpacing: string }]> = {};
for (const g of tokens.type.groups) {
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
for (const z of tokens.size.tokens) sizes[z.name] = `var(--${z.name})`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', './.storybook/**/*.{ts,tsx}'],
  theme: {
    colors,
    spacing,
    borderRadius,
    fontSize,
    fontFamily: { sans: 'var(--font-sans)', mono: 'var(--font-mono)' },
    boxShadow: { none: 'none', overlay: 'var(--shadow-overlay)' },
    extend: {
      maxWidth: { ...sizes, none: 'none', full: '100%' },
      minHeight: sizes,
      height: sizes,
      width: sizes,
      ringWidth: { focus: '2px' },
      ringOffsetWidth: { focus: '2px' },
    },
  },
  plugins: [],
} satisfies Config;
