import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'storybook-static', 'node_modules', 'src/styles/tokens.css'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2020, globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Komponen reusable tidak boleh tahu modul.
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/features/*', '../features/*', '../../features/*'], message: 'ui/patterns/layout tidak boleh mengimpor features.' },
            { group: ['@/services/*', '@/services'], message: 'Komponen reusable tidak fetch data sendiri; data lewat props.' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/services/mock/*', '@/services/mock'], message: 'UI tidak mengimpor mock langsung; lewat services/index.ts.' },
          ],
        },
      ],
    },
  },
  {
    // Test boleh membaca data uji mock secara langsung.
    files: ['**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off' },
  },
);
