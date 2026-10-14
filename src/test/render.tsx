import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProviders, makeQueryClient } from '@/App';

/** Render dengan provider aplikasi dan router memori. `path` = pola rute untuk parameter (mis. token). */
export function renderWithApp(ui: ReactElement, { route = '/', path = '*' }: { route?: string; path?: string } = {}) {
  const client = makeQueryClient();
  client.setDefaultOptions({ queries: { retry: false, refetchInterval: false } });
  return render(
    <AppProviders client={client}>
      <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path={path} element={ui} />
          <Route path="/masuk" element={<p>Halaman masuk</p>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );
}
