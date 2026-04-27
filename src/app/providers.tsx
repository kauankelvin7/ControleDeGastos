"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 1 minuto de cache "fresco" para evitar refetchs excessivos
            staleTime: 60 * 1000,
            // Desativa o refetch ao focar na janela para economizar banda/leitura no Firebase
            refetchOnWindowFocus: false,
            // Tenta 2 vezes em caso de erro de rede antes de falhar
            retry: 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}