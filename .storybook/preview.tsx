import { withThemeByDataAttribute } from '@storybook/addon-themes';
import type { Preview } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import '../src/styles/index.css';

/** Toggle tema DS: `standar` (default) dan `ruang-kendali` (gelap). */
const preview: Preview = {
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    backgrounds: { disable: true },
    a11y: { test: 'error' },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ background: 'var(--color-surface-page)', padding: 24, minHeight: '100%' }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
    withThemeByDataAttribute({
      themes: { Standar: 'standar', 'Ruang kendali': 'ruang-kendali' },
      defaultTheme: 'Standar',
      attributeName: 'data-theme',
    }),
  ],
};

export default preview;
