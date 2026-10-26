import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { Layout } from "./components/Layout";
import { FilterProvider } from "./context/Filters";
import { OverviewPage } from "./pages/OverviewPage";
import { ProductsPage } from "./pages/ProductsPage";
import { SalesPage } from "./pages/SalesPage";
import { ImportPage } from "./pages/ImportPage";
import { AIPage } from "./pages/AIPage";
import { ReportsPage } from "./pages/ReportsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <FilterProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/import" element={<ImportPage />} />
              <Route path="/ai" element={<AIPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          <Toaster position="bottom-right" richColors closeButton />
        </FilterProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
