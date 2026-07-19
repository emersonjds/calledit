import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from '@/shared/ui/sonner';
import { router } from '@/app/router';
import { hasRealBackend, isDemo } from '@/shared/config';
import '@/index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000, retry: false } },
});

async function bootstrap() {
  // Until the real API is deployed, MSW is the backend for every mode — not just demo.
  if (isDemo() || !hasRealBackend) {
    const { startMockServer } = await import('@/mocks/browser');
    await startMockServer();
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        {/* Mobile-first PWA: full-bleed on phones, a centered device frame on desktop. */}
        <div className="flex min-h-dvh w-full justify-center bg-black md:items-center md:p-4">
          <div className="bg-background relative flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden md:h-[calc(100dvh-2rem)] md:max-h-[900px] md:min-h-0 md:rounded-[2.25rem] md:border md:border-white/10 md:shadow-[0_20px_70px_-10px_rgba(0,0,0,0.7)]">
            <RouterProvider router={router} />
          </div>
        </div>
        <Toaster position="top-center" />
      </QueryClientProvider>
    </StrictMode>,
  );
}

void bootstrap();
