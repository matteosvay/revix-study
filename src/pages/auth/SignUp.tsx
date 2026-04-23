import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthShell } from "./AuthShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CURSUS_OPTIONS } from "@/data/cursus";

export default function SignUp() {
  const nav = useNavigate();
  const [cursus, setCursus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: String(data.get("email")),
      password: String(data.get("pwd")),
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { display_name: String(data.get("name")), cursus },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Compte créé ! Bienvenue sur Revix ✨");
    nav("/app");
  };

  return (
    <AuthShell title="Crée ton compte ✨" subtitle="C'est gratuit, et ça change tout.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="name">Prénom</Label>
          <Input id="name" name="name" required placeholder="Léa" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="prenom@etudiant.fr" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pwd">Mot de passe</Label>
          <Input id="pwd" name="pwd" type="password" placeholder="Min. 6 caractères" required minLength={6} />
        </div>
        <div className="space-y-2">
          <Label>Je suis étudiant en...</Label>
          <Select value={cursus} onValueChange={setCursus}>
            <SelectTrigger><SelectValue placeholder="Choisis ton cursus" /></SelectTrigger>
            <SelectContent>
              {CURSUS_OPTIONS.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={loading} className="w-full rounded-full gradient-primary border-0 h-11">
          {loading ? "Création..." : "Créer mon compte"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Déjà inscrit ? <Link to="/login" className="text-primary font-medium hover:underline">Se connecter</Link>
        </p>
      </form>
    </AuthShell>
  );
}