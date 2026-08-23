import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./AuthShell";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Reset() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const data = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(String(data.get("email")), {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    // Erreur serveur uniquement : on ne révèle jamais si l'email existe (énumération de comptes).
    if (error && (/\b5\d\d\b/.test(error.message) || /service/i.test(error.message))) {
      const msg = "Service temporairement indisponible. Réessaie dans un instant.";
      setFormError(msg);
      toast.error(msg);
      return;
    }
    setSent(true);
    toast.success("Si un compte existe, un email vient de partir.");
  };

  return (
    <AuthShell title="Mot de passe oublié ?" subtitle="On t'envoie un lien pour le réinitialiser.">
      {sent ? (
        <div className="space-y-4">
          <p role="status" className="text-sm font-medium text-foreground bg-primary/10 border-2 border-primary/30 rounded-md px-3 py-3">
            Si un compte existe avec cet email, tu vas recevoir un lien de réinitialisation. Pense à vérifier tes spams.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary font-medium hover:underline">Retour à la connexion</Link>
          </p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" aria-invalid={!!formError} required />
          </div>
          {formError && (
            <p role="alert" className="text-sm font-medium text-destructive bg-destructive/10 border-2 border-destructive/30 rounded-md px-3 py-2">
              {formError}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full rounded-full gradient-primary border-0 h-11">
            {loading ? "Envoi..." : "Envoyer le lien"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary font-medium hover:underline">Retour à la connexion</Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}