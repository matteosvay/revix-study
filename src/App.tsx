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
import Streak from "./pages/app/Streak";
import CourseDetail from "./pages/app/CourseDetail";
import Aventure from "./pages/app/Aventure";
import Campus from "./pages/app/Campus";
import DuelPlay from "./pages/app/DuelPlay";
import StudyRoom from "./pages/app/StudyRoom";
import Revision from "./pages/app/Revision";
import StudyGroups from "./pages/app/StudyGroups";
import Cosmetics from "./pages/app/Cosmetics";
import PublicProfile from "./pages/app/PublicProfile";
import AiUsage from "./pages/admin/AiUsage";
import { AuthProvider } from "./hooks/useAuth";
import { RequireAuth } from "./components/revix/RequireAuth";
import { XpOverlay } from "./components/revix/XpOverlay";
import { InstallAppPrompt } from "./components/revix/InstallAppPrompt";
import { ErrorBoundary } from "./components/revix/ErrorBoundary";
import { AiLimitModal } from "./components/revix/AiLimitModal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Données considérées fraîches pendant 2 min → évite les refetches inutiles
      staleTime: 2 * 60 * 1000,
      // Garde le cache 10 min après que le composant est démonté
      gcTime: 10 * 60 * 1000,
      // Pas de refetch automatique au focus (agaçant sur mobile)
      refetchOnWindowFocus: false,
      // Retry 1 fois avec un délai (réseau mobile instable)
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    },
    mutations: {
      retry: 0,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <XpOverlay />
          <InstallAppPrompt />
          <AiLimitModal />
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/reset-password" element={<Reset />} />
            <Route path="/app" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/app/upload" element={<RequireAuth><Upload /></RequireAuth>} />
            <Route path="/app/fiches" element={<RequireAuth><Fiches /></RequireAuth>} />
            <Route path="/app/fiches/:id" element={<RequireAuth><CourseDetail /></RequireAuth>} />
            <Route path="/app/quizz" element={<RequireAuth><Quizz /></RequireAuth>} />
            <Route path="/app/revision" element={<RequireAuth><Revision /></RequireAuth>} />
            <Route path="/app/planning" element={<RequireAuth><Planning /></RequireAuth>} />
            <Route path="/app/streak" element={<RequireAuth><Streak /></RequireAuth>} />
            <Route path="/app/aventure" element={<RequireAuth><Aventure /></RequireAuth>} />
            <Route path="/app/campus" element={<RequireAuth><Campus /></RequireAuth>} />
            <Route path="/app/groupes" element={<RequireAuth><StudyGroups /></RequireAuth>} />
            <Route path="/app/cosmetics" element={<RequireAuth><Cosmetics /></RequireAuth>} />
            <Route path="/app/u/:id" element={<RequireAuth><PublicProfile /></RequireAuth>} />
            <Route path="/app/duel/:id" element={<RequireAuth><DuelPlay /></RequireAuth>} />
            <Route path="/app/room/:id" element={<RequireAuth><StudyRoom /></RequireAuth>} />
            <Route path="/app/profil" element={<RequireAuth><Profil /></RequireAuth>} />
            <Route path="/admin/ai-usage" element={<RequireAuth><AiUsage /></RequireAuth>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
