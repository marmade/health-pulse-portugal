import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Sobre from "./pages/Sobre";
import Textos from "./pages/Textos";
import Briefing from "./pages/Briefing";
import Guioes from "./pages/Guioes";
import RevisaoPares from "./pages/RevisaoPares";
import Mural from "./pages/Mural";
import Plataforma from "./pages/Plataforma";
import Bookmarks from "./pages/Bookmarks";
import Benchmark from "./pages/BenchmarkWrapper";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/textos" element={<Textos />} />
          <Route path="/briefing" element={<Briefing />} />
          <Route path="/guioes" element={<Guioes />} />
          <Route path="/editorial/guioes" element={<Guioes />} />
          <Route path="/editorial/revisao-pares" element={<RevisaoPares />} />
          <Route path="/revisao-pares" element={<RevisaoPares />} />
          <Route path="/mural" element={<Mural />} />
          <Route path="/plataforma" element={<Plataforma />} />
          <Route path="/editorial/bookmarks" element={<Bookmarks />} />
          <Route path="/editorial/benchmark" element={<Benchmark />} />
          {/* Rota /admin removida a 15/09/2026 — ver CONTEXT.md, Crítico nº 2.
              O Admin.tsx NÃO foi apagado: volta quando houver autenticação
              Supabase a sério. O import saiu com a rota de propósito — mantê-lo
              deixaria o ficheiro no bundle, com a password lá dentro, apenas
              inalcançável por URL. */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
