import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from '@/shared/ui/sonner';
import { router } from '@/app/router';
import { isDemo } from '@/shared/config';
import '@/index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000, retry: false } },
});

async function bootstrap() {
  if (isDemo()) {
    const { startMockServer } = await import('@/mocks/browser');
    await startMockServer();
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster position="top-center" />
      </QueryClientProvider>
    </StrictMode>,
  );
}

void bootstrap();
