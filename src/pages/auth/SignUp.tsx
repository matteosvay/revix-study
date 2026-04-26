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
import { GENDER_OPTIONS } from "@/lib/gender";
import { Mail, CheckCircle2, RefreshCw } from "lucide-react";

export default function SignUp() {
  const nav = useNavigate();
  const [cursus, setCursus] = useState<string>("");
  const [formation, setFormation] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string>("");
  const [submittedName, setSubmittedName] = useState<string>("");
  const [resending, setResending] = useState(false);

  const formationItems = FORMATIONS.map(f => ({
    value: f.name, label: f.abbr ? `${f.abbr} — ${f.name.replace(`${f.abbr} - `, "").replace(`${f.abbr} `, "")}` : f.name, group: f.category,
  }));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email"));
    const name = String(data.get("name"));
    setLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password: String(data.get("pwd")),
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: { display_name: name, cursus, gender: gender || null },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (signUpData.session) {
      if (formation || gender) {
        await supabase.from("profiles").update({
          ...(formation ? { formation } : {}),
          ...(gender ? { gender } : {}),
        }).eq("id", signUpData.session.user.id);
      }
      toast.success("Compte créé ! Bienvenue sur Revix ✨");
      nav("/app");
    } else {
      setSubmittedEmail(email);
      setSubmittedName(name);
    }
  };

  const handleResend = async () => {
    if (!submittedEmail) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: submittedEmail,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    setResending(false);
    if (error) toast.error(error.message);
    else toast.success("Email renvoyé ! 📨");
  };

  if (submittedEmail) {
    return (
      <AuthShell title="Presque prêt ! 🎯" subtitle="Une dernière étape avant l'aventure...">
        <div className="space-y-5 text-center">
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full gradient-primary opacity-20 animate-ping" />
            <div className="relative w-20 h-20 rounded-full gradient-primary flex items-center justify-center">
              <Mail className="w-10 h-10 text-primary-foreground" strokeWidth={2.2} />
            </div>
          </div>

          <div>
            <h2 className="font-serif text-2xl">
              {submittedName ? `Hey ${submittedName} !` : "C'est parti !"}
            </h2>
            <p className="font-hand text-lg text-primary mt-1">
              On t'a envoyé un email magique ✨
            </p>
          </div>

          <div className="notebook-card p-4 text-left space-y-3">
            <p className="text-sm text-muted-foreground">
              📩 Un email de confirmation vient d'être envoyé à :
            </p>
            <p className="font-mono text-sm font-semibold text-foreground break-all bg-muted/50 px-3 py-2 rounded-lg">
              {submittedEmail}
            </p>
            <div className="space-y-2 pt-2">
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Ouvre ta boîte mail (pense à vérifier les <strong>spams</strong> 👀)</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Clique sur le lien de confirmation</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Reviens te connecter et débloque ton premier XP 🚀</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic">
            Pas reçu après 2 min ? Vérifie tes spams ou renvoie l'email ci-dessous.
          </p>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleResend}
              disabled={resending}
              className="w-full rounded-full h-11"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${resending ? "animate-spin" : ""}`} />
              {resending ? "Envoi..." : "Renvoyer l'email"}
            </Button>
            <Button
              type="button"
              onClick={() => nav("/login")}
              className="w-full rounded-full gradient-primary border-0 h-11"
            >
              J'ai confirmé, je me connecte →
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

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
          <Label>Je suis...</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger><SelectValue placeholder="Choisis ton genre" /></SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map(g => (
                <SelectItem key={g.value} value={g.value}>
                  <span className="mr-2">{g.emoji}</span>{g.label}
                </SelectItem>
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