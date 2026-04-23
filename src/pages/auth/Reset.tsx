import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./AuthShell";
import { toast } from "sonner";

export default function Reset() {
  return (
    <AuthShell title="Mot de passe oublié ?" subtitle="On t'envoie un lien pour le réinitialiser.">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Email envoyé ! Vérifie ta boîte."); }}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required />
        </div>
        <Button type="submit" className="w-full rounded-full gradient-primary border-0 h-11">Envoyer le lien</Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary font-medium hover:underline">← Retour à la connexion</Link>
        </p>
      </form>
    </AuthShell>
  );
}