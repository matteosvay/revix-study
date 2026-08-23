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
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const data = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(data.get("email")),
      password: String(data.get("pwd")),
    });
    setLoading(false);
    if (error) {
      // On NE remonte PAS error.message brut : « Invalid login credentials » révèle
      // si un compte existe ou non pour cet email (énumération de comptes).
      // On ne distingue pas non plus « email pas confirmé » (autre chemin d'énumération).
      // Pour les rares vraies erreurs serveur (5xx), on affiche un message dédié.
      const isServerError = /\b5\d\d\b/.test(error.message) || /service/i.test(error.message);
      const msg = isServerError
        ? "Service temporairement indisponible. Réessaie dans un instant."
        : "Email ou mot de passe incorrect.";
      setFormError(msg);
      toast.error(msg);
      return;
    }
    nav("/app");
  };

  return (
    <AuthShell title="Bon retour" subtitle="Connecte-toi pour reprendre tes révisions.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="ton@email.fr" aria-invalid={!!formError} required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="pwd">Mot de passe</Label>
            <Link to="/reset-password" className="text-xs text-primary hover:underline">Oublié ?</Link>
          </div>
          <Input id="pwd" name="pwd" type="password" aria-invalid={!!formError} required />
        </div>
        {formError && (
          <p role="alert" className="text-sm font-medium text-destructive bg-destructive/10 border-2 border-destructive/30 rounded-md px-3 py-2">
            {formError}
          </p>
        )}
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