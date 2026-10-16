/**
 * Menurunkan src/styles/tokens.css dari design-system/tokens.json (PERISAI Design System v2 · Lime)
 * ditambah design-system/tokens.local.json (token prototype yang belum ada di DS; lihat DS_GAPS.md DS-07).
 * Jangan menyunting tokens.css dengan tangan: jalankan `npm run tokens`.
 * Tema `light` di :root, `dark` di [data-theme="dark"].
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type Themed = Record<string, string>;
interface ColorToken {
  name: string;
  value: Themed;
}
interface TypeStyle {
  name: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
}
interface TypeGroup {
  family: string;
  styles: TypeStyle[];
}
interface Tokens {
  name: string;
  version: number;
  color: { themes: { id: string }[]; tokens: ColorToken[] };
  type: { families: Record<string, string>; groups: TypeGroup[] };
  spacing: { tokens: { name: string; value: string }[] };
  radius: { tokens: { name: string; value: string }[] };
  shadow: { tokens: { name: string; value: Themed }[] };
  size: { tokens: { name: string; value: string }[] };
}
interface LocalTokens {
  type?: { groups: TypeGroup[] };
  spacing?: { tokens: { name: string; value: string }[] };
  size?: { tokens: { name: string; value: string }[] };
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(resolve(root, 'design-system/tokens.json'), 'utf8')) as Tokens;
const local = JSON.parse(readFileSync(resolve(root, 'design-system/tokens.local.json'), 'utf8')) as LocalTokens;

const DEFAULT_THEME = 'light';
const themes = tokens.color.themes.map((t) => t.id);
const typeGroups = [...tokens.type.groups, ...(local.type?.groups ?? [])];
const spacing = [...tokens.spacing.tokens, ...(local.spacing?.tokens ?? [])];
const sizes = [...tokens.size.tokens, ...(local.size?.tokens ?? [])];

/** "{ink-subtle}" → var(--color-ink-subtle) */
function resolveRef(value: string): string {
  const m = /^\{([a-z0-9-]+)\}$/.exec(value.trim());
  return m ? `var(--color-${m[1]})` : value;
}

function themeBlock(theme: string): string[] {
  const lines: string[] = [];
  for (const t of tokens.color.tokens) {
    const v = t.value[theme];
    if (v) lines.push(`  --color-${t.name}: ${resolveRef(v)};`);
  }
  for (const s of tokens.shadow.tokens) {
    const v = s.value[theme];
    if (v) lines.push(`  --${s.name}: ${v};`);
  }
  return lines;
}

const base: string[] = [];
for (const [fam, stack] of Object.entries(tokens.type.families)) base.push(`  --font-${fam}: ${stack};`);
for (const g of typeGroups) {
  for (const s of g.styles) {
    base.push(`  --type-${s.name}-family: var(--font-${g.family});`);
    base.push(`  --type-${s.name}-size: ${s.fontSize};`);
    base.push(`  --type-${s.name}-line: ${s.lineHeight};`);
    base.push(`  --type-${s.name}-weight: ${s.fontWeight};`);
    base.push(`  --type-${s.name}-tracking: ${s.letterSpacing ?? 'normal'};`);
  }
}
for (const s of spacing) base.push(`  --${s.name}: ${s.value};`);
for (const r of tokens.radius.tokens) base.push(`  --${r.name}: ${r.value};`);
for (const z of sizes) base.push(`  --${z.name}: ${z.value};`);

const typeClasses: string[] = [];
for (const g of typeGroups) {
  for (const s of g.styles) {
    typeClasses.push(
      `.type-${s.name} { font-family: var(--type-${s.name}-family); font-size: var(--type-${s.name}-size); line-height: var(--type-${s.name}-line); font-weight: var(--type-${s.name}-weight); letter-spacing: var(--type-${s.name}-tracking); }`,
    );
  }
}

const out = [
  `/* GENERATED dari design-system/tokens.json (${tokens.name} v${tokens.version}) + tokens.local.json oleh scripts/build-tokens.ts. Jangan disunting. */`,
  `:root, [data-theme="${DEFAULT_THEME}"] {`,
  ...base,
  ...themeBlock(DEFAULT_THEME),
  '}',
  ...themes
    .filter((t) => t !== DEFAULT_THEME)
    .flatMap((t) => [`[data-theme="${t}"] {`, `  color-scheme: dark;`, ...themeBlock(t), '}']),
  ...typeClasses,
  '',
].join('\n');

writeFileSync(resolve(root, 'src/styles/tokens.css'), out);
console.log(`tokens.css: ${tokens.color.tokens.length} warna, ${themes.length} tema`);
