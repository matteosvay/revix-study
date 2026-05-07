import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  // RGPD : consentement explicite obligatoire avant la création de compte.
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Capture ?ref=CODE et le mémorise pour l'appliquer après confirmation email
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      const code = ref.toUpperCase().slice(0, 7);
      try { localStorage.setItem("revix_pending_referral", code); } catch {/* noop */}
    }
  }, []);

  const formationItems = FORMATIONS.map(f => ({
    value: f.name, label: f.abbr ? `${f.abbr} — ${f.name.replace(`${f.abbr} - `, "").replace(`${f.abbr} `, "")}` : f.name, group: f.category,
  }));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!acceptedTerms) {
      toast.error("Tu dois accepter les CGU et la politique de confidentialité pour créer un compte.");
      return;
    }
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email"));
    const name = String(data.get("name"));
    setLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password: String(data.get("pwd")),
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          display_name: name,
          cursus,
          gender: gender || null,
          // Trace de l'acceptation pour pouvoir prouver le consentement RGPD a posteriori
          terms_accepted_at: new Date().toISOString(),
        },
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
      // Applique immédiatement le code de parrainage si présent (sign-up sans confirmation email)
      try {
        const pending = localStorage.getItem("revix_pending_referral");
        if (pending) {
          await supabase.rpc("apply_referral_code", { _code: pending });
          localStorage.removeItem("revix_pending_referral");
        }
      } catch {/* noop */}
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
        {/* RGPD : consentement explicite obligatoire avant la création de compte */}
        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(v) => setAcceptedTerms(v === true)}
            className="mt-0.5"
          />
          <Label htmlFor="terms" className="text-xs leading-relaxed text-muted-foreground font-normal cursor-pointer">
            J'accepte les{" "}
            <Link to="/cgu" target="_blank" className="text-primary font-medium hover:underline">
              Conditions Générales d'Utilisation
            </Link>{" "}
            et la{" "}
            <Link to="/confidentialite" target="_blank" className="text-primary font-medium hover:underline">
              Politique de confidentialité
            </Link>{" "}
            de Revix.
          </Label>
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