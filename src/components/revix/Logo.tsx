import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const Logo = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={`flex items-center gap-2 font-bold text-xl ${className}`}>
    <span className="relative flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow">
      <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
    </span>
    <span className="tracking-tight">Revix</span>
  </Link>
);