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
import { AuthProvider } from "./hooks/useAuth";
import { RequireAuth } from "./components/revix/RequireAuth";
import { XpOverlay } from "./components/revix/XpOverlay";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <XpOverlay />
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
            <Route path="/app/planning" element={<RequireAuth><Planning /></RequireAuth>} />
            <Route path="/app/streak" element={<RequireAuth><Streak /></RequireAuth>} />
            <Route path="/app/aventure" element={<RequireAuth><Aventure /></RequireAuth>} />
            <Route path="/app/campus" element={<RequireAuth><Campus /></RequireAuth>} />
            <Route path="/app/duel/:id" element={<RequireAuth><DuelPlay /></RequireAuth>} />
            <Route path="/app/room/:id" element={<RequireAuth><StudyRoom /></RequireAuth>} />
            <Route path="/app/profil" element={<RequireAuth><Profil /></RequireAuth>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
