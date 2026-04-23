import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import Reset from "./pages/auth/Reset";
import Dashboard from "./pages/app/Dashboard";
import Upload from "./pages/app/Upload";
import Fiches from "./pages/app/Fiches";
import Quizz from "./pages/app/Quizz";
import Planning from "./pages/app/Planning";
import Profil from "./pages/app/Profil";
import Communaute from "./pages/app/Communaute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/reset-password" element={<Reset />} />
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/upload" element={<Upload />} />
          <Route path="/app/fiches" element={<Fiches />} />
          <Route path="/app/quizz" element={<Quizz />} />
          <Route path="/app/planning" element={<Planning />} />
          <Route path="/app/profil" element={<Profil />} />
          <Route path="/app/communaute" element={<Communaute />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
