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
import { SearchableCombobox } from "@/components/revix/SearchableCombobox";
import { FORMATIONS } from "@/data/formations";

export default function SignUp() {
  const nav = useNavigate();
  const [cursus, setCursus] = useState<string>("");
  const [formation, setFormation] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const formationItems = FORMATIONS.map(f => ({
    value: f.name, label: f.abbr ? `${f.abbr} — ${f.name.replace(`${f.abbr} - `, "").replace(`${f.abbr} `, "")}` : f.name, group: f.category,
  }));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: String(data.get("email")),
      password: String(data.get("pwd")),
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: { display_name: String(data.get("name")), cursus },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    // Si une session existe déjà → email auto-confirmé (rare). Sinon → vérification requise.
    if (signUpData.session) {
      if (formation) {
        await supabase.from("profiles").update({ formation }).eq("id", signUpData.session.user.id);
      }
      toast.success("Compte créé ! Bienvenue sur Revix ✨");
      nav("/app");
    } else {
      toast.success("📩 Vérifie ta boîte mail pour confirmer ton inscription !", { duration: 6000 });
      nav("/login");
    }
  };

  return (
    <AuthShell title="Crée ton compte ✨" subtitle="C'est gratuit, et ça change tout.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="name">Prénom</Label>
          <Input id="name" name="name" required placeholder="Ton prénom" />
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
        <div className="space-y-2">
          <Label>Ma formation précise (optionnel)</Label>
          <SearchableCombobox
            items={formationItems}
            value={formation}
            onChange={setFormation}
            placeholder="ex : BUT GEA, Licence Droit, Prépa MPSI..."
            searchPlaceholder="Rechercher une formation..."
          />
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