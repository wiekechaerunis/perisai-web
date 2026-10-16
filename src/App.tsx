import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastProvider } from './components/patterns/Toast';
import { SessionProvider } from './features/session/SessionProvider';
import { t } from './lib/i18n/id';
import { createAppRouter } from './router';
import { isServiceError } from './services';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (count, err) => !isServiceError(err) && count < 2,
        refetchOnWindowFocus: false,
      },
    },
  });
}

/** Provider bersama (dipakai juga oleh test). */
export function AppProviders({ children, client }: { children: ReactNode; client?: QueryClient }) {
  const [qc] = useState(() => client ?? makeQueryClient());
  return (
    <QueryClientProvider client={qc}>
      <ToastProvider closeLabel={t.app.tutup} regionLabel={t.app.notifikasi}>
        <SessionProvider>{children}</SessionProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export function App() {
  const [router] = useState(createAppRouter);
  return (
    <AppProviders>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </AppProviders>
  );
}
