import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./AuthShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Login() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(data.get("email")),
      password: String(data.get("pwd")),
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    nav("/app");
  };

  return (
    <AuthShell title="Bon retour 👋" subtitle="Connecte-toi pour reprendre tes révisions.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="ton@email.fr" required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="pwd">Mot de passe</Label>
            <Link to="/reset-password" className="text-xs text-primary hover:underline">Oublié ?</Link>
          </div>
          <Input id="pwd" name="pwd" type="password" required />
        </div>
        <Button type="submit" disabled={loading} className="w-full rounded-full gradient-primary border-0 h-11">
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ? <Link to="/signup" className="text-primary font-medium hover:underline">S'inscrire</Link>
        </p>
      </form>
    </AuthShell>
  );
}