import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Landing from "./Landing";

const Index = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="rounded-md border-[3px] border-foreground bg-card px-5 py-4 shadow-brutal font-mono-tag text-xs uppercase tracking-wider">
          Chargement...
        </div>
      </div>
    );
  }
  if (user) return <Navigate to="/app" replace />;
  return <Landing />;
};

export default Index;
