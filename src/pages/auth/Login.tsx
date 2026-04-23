import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./AuthShell";

export default function Login() {
  const nav = useNavigate();
  return (
    <AuthShell title="Bon retour 👋" subtitle="Connecte-toi pour reprendre tes révisions.">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); nav("/app"); }}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="lea@etudiant.fr" required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="pwd">Mot de passe</Label>
            <Link to="/reset-password" className="text-xs text-primary hover:underline">Oublié ?</Link>
          </div>
          <Input id="pwd" type="password" required />
        </div>
        <Button type="submit" className="w-full rounded-full gradient-primary border-0 h-11">Se connecter</Button>
        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ? <Link to="/signup" className="text-primary font-medium hover:underline">S'inscrire</Link>
        </p>
      </form>
    </AuthShell>
  );
}