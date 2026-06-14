import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// Index (landing) reste eager : c'est la première page vue, le lazy ajouterait un flash inutile
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
// Toutes les autres routes sont lazy-loaded → bundle initial divisé par ~3
const Login = lazy(() => import("./pages/auth/Login"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const Reset = lazy(() => import("./pages/auth/Reset"));
const Dashboard = lazy(() => import("./pages/app/Dashboard"));
const Upload = lazy(() => import("./pages/app/Upload"));
const Fiches = lazy(() => import("./pages/app/Fiches"));
const Quizz = lazy(() => import("./pages/app/Quizz"));
const Planning = lazy(() => import("./pages/app/Planning"));
const Profil = lazy(() => import("./pages/app/Profil"));
const Streak = lazy(() => import("./pages/app/Streak"));
const CourseDetail = lazy(() => import("./pages/app/CourseDetail"));
const Aventure = lazy(() => import("./pages/app/Aventure"));
const Campus = lazy(() => import("./pages/app/Campus"));
const DuelPlay = lazy(() => import("./pages/app/DuelPlay"));
const StudyRoom = lazy(() => import("./pages/app/StudyRoom"));
const Revision = lazy(() => import("./pages/app/Revision"));
const StudyGroups = lazy(() => import("./pages/app/StudyGroups"));
const Cosmetics = lazy(() => import("./pages/app/Cosmetics"));
const Stats = lazy(() => import("./pages/app/Stats"));
const PublicProfile = lazy(() => import("./pages/app/PublicProfile"));
const AiUsage = lazy(() => import("./pages/admin/AiUsage"));
const CheckoutReturn = lazy(() => import("./pages/app/CheckoutReturn"));
const MentionsLegales = lazy(() => import("./pages/legal/MentionsLegales"));
const PolitiqueConfidentialite = lazy(() => import("./pages/legal/PolitiqueConfidentialite"));
const CGU = lazy(() => import("./pages/legal/CGU"));
const CGV = lazy(() => import("./pages/legal/CGV"));
const FichesRevisionIA = lazy(() => import("./pages/landings/FichesRevisionIA"));
const QuizIA = lazy(() => import("./pages/landings/QuizIA"));
const PlanningRevision = lazy(() => import("./pages/landings/PlanningRevision"));
const FlashcardsIA = lazy(() => import("./pages/landings/FlashcardsIA"));
const FicheDroit = lazy(() => import("./pages/landings/subjects/FicheDroit"));
const FicheMarketing = lazy(() => import("./pages/landings/subjects/FicheMarketing"));
const FicheAnalyseLitteraire = lazy(() => import("./pages/landings/subjects/FicheAnalyseLitteraire"));

import { AuthProvider } from "./hooks/useAuth";
import { RequireAuth } from "./components/revix/RequireAuth";
import { RequireAdmin } from "./components/revix/RequireAdmin";
import { XpOverlay } from "./components/revix/XpOverlay";
import { InstallAppPrompt } from "./components/revix/InstallAppPrompt";
import { ErrorBoundary } from "./components/revix/ErrorBoundary";
import { AiLimitModal } from "./components/revix/AiLimitModal";
import { CookieBanner } from "./components/revix/CookieBanner";
import { SplashScreen } from "./components/revix/SplashScreen";

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
          <SplashScreen />
          <Toaster />
          <Sonner />
          <XpOverlay />
          <InstallAppPrompt />
          <BrowserRouter>
            <AiLimitModal />
            <CookieBanner />
            <Suspense fallback={null}>
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
            <Route path="/app/stats" element={<RequireAuth><Stats /></RequireAuth>} />
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
            <Route path="/app/checkout/return" element={<RequireAuth><CheckoutReturn /></RequireAuth>} />
            <Route path="/admin/ai-usage" element={<RequireAdmin><AiUsage /></RequireAdmin>} />
            {/* Pages légales — accessibles sans authentification */}
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/confidentialite" element={<PolitiqueConfidentialite />} />
            <Route path="/cgu" element={<CGU />} />
            <Route path="/cgv" element={<CGV />} />
            {/* Landings SEO publiques */}
            <Route path="/fiches-de-revision-ia" element={<FichesRevisionIA />} />
            <Route path="/quiz-ia" element={<QuizIA />} />
            <Route path="/planning-de-revision" element={<PlanningRevision />} />
            <Route path="/flashcards-ia" element={<FlashcardsIA />} />
            <Route path="/fiches-de-revision/droit" element={<FicheDroit />} />
            <Route path="/fiches-de-revision/marketing" element={<FicheMarketing />} />
            <Route path="/fiches-de-revision/analyse-litteraire" element={<FicheAnalyseLitteraire />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
