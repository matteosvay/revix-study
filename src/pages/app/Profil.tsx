import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, Trash2, Sparkles, Camera, Loader2, Shirt, BookMarked, ChevronRight, BarChart3, Crown, CreditCard, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CURSUS_OPTIONS } from "@/data/cursus";
import { SearchableCombobox, SearchableMultiCombobox } from "@/components/revix/SearchableCombobox";
import { FORMATIONS } from "@/data/formations";
import { SUBJECTS } from "@/data/subjects";
import { AvatarCropper } from "@/components/revix/AvatarCropper";
import { GENDER_OPTIONS } from "@/lib/gender";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { StripeEmbeddedCheckout } from "@/components/revix/StripeEmbeddedCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import { ReferralCard } from "@/components/revix/ReferralCard";

export default function Profil() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { data: isAdmin } = useIsAdmin();
  const { subscription, isActive, tier } = useSubscription();
  const [checkoutPriceId, setCheckoutPriceId] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ courses: 0, quizzes: 0, avg: 0 });
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  // RGPD article 17 : suppression de compte
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { count: cc }, { count: qc }, { data: attempts }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("courses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("quizzes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("quiz_attempts").select("score, total").eq("user_id", user.id),
      ]);
      setProfile(p);
      const avg = attempts && attempts.length ? Math.round(attempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / attempts.length) : 0;
      setStats({ courses: cc ?? 0, quizzes: qc ?? 0, avg });
    })();
  }, [user]);

  const save = async () => {
    if (!user || !profile) return;
    const { error } = await supabase.from("profiles").update({
      display_name: profile.display_name,
      school: profile.school,
      cursus: profile.cursus,
      formation: profile.formation,
      subjects: profile.subjects ?? [],
      bio: profile.bio ?? null,
      gender: profile.gender ?? null,
    }).eq("id", user.id);
    if (error) toast.error(error.message); else toast.success("Profil enregistré");
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Sélectionne une image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image trop lourde (max 5 Mo)"); return; }
    setPendingFile(file);
    setCropOpen(true);
    e.target.value = "";
  };

  const uploadCropped = async (blob: Blob) => {
    if (!user) return;
    setUploading(true);
    try {
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${pub.publicUrl}?t=${Date.now()}`;
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      if (updErr) throw updErr;
      setProfile({ ...profile, avatar_url: url });
      toast.success("Photo mise à jour ✨");
    } catch (err: any) {
      toast.error(err.message ?? "Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const logout = async () => { await supabase.auth.signOut(); nav("/"); };

  /**
   * Suppression définitive du compte (RGPD article 17).
   * Appelle l'Edge Function delete-account qui utilise auth.admin.deleteUser ;
   * tout le contenu de l'utilisateur est cascadé via les FK ON DELETE CASCADE.
   */
  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        body: { confirm: "DELETE" },
      });
      if (error || !data?.success) {
        throw new Error((error as { message?: string } | null)?.message || (data as { message?: string } | null)?.message || "Échec de la suppression");
      }
      // La session est invalidée côté serveur ; on nettoie aussi le client.
      await supabase.auth.signOut();
      toast.success("Ton compte a été supprimé. À bientôt 👋");
      nav("/");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Impossible de supprimer le compte. Réessaie ou contacte le support.";
      toast.error(msg);
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (!profile) return <AppLayout><div className="p-5 text-sm text-muted-foreground">Chargement...</div></AppLayout>;

  const initials = (profile.display_name ?? "U").split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase();

  const formationItems = FORMATIONS.map(f => ({
    value: f.name,
    label: f.abbr ? `${f.abbr} — ${f.name.replace(`${f.abbr} - `, "").replace(`${f.abbr} `, "")}` : f.name,
    group: f.category,
  }));
  const subjectItems = SUBJECTS.map(s => ({ value: s.name, label: s.name, group: s.category, emoji: s.emoji }));

  const openManagePortal = async () => {
    if (!user) return;
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          environment: getStripeEnvironment(),
          returnUrl: `${window.location.origin}/app/profil`,
        },
      });
      if (error || !data?.url) throw new Error(error?.message || "Impossible d'ouvrir le portail");
      window.open(data.url as string, "_blank");
    } catch (e: any) {
      toast.error(e?.message || "Erreur");
    } finally {
      setPortalLoading(false);
    }
  };

  const PLANS = [
    {
      id: "pro_monthly",
      tier: "pro" as const,
      name: "Pro",
      price: "4,99 €",
      tagline: "Pour étudier sérieusement chaque jour",
      perks: ["10 quizz IA / jour", "20 messages coach / jour", "5 fiches IA / semaine", "Planning IA hebdo"],
      gradient: "from-primary to-primary-glow",
    },
    {
      id: "max_monthly",
      tier: "max" as const,
      name: "Max",
      price: "8,99 €",
      tagline: "Quotas maximaux, zéro limite",
      perks: ["30 quizz IA / jour", "50 messages coach / jour", "3 fiches IA / jour", "Planning IA illimité"],
      gradient: "from-amber-500 to-orange-600",
      highlight: true,
    },
  ];

  return (
    <AppLayout>
      <PageHeader emoji="👤" title="Profil" />

      <AvatarCropper
        file={pendingFile}
        open={cropOpen}
        onClose={() => { setCropOpen(false); setPendingFile(null); }}
        onCropped={uploadCropped}
      />

      <div className="px-5 space-y-5 stagger-in">
        <div className="flex items-center gap-3">
          <label className="relative cursor-pointer group">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.display_name ?? "Avatar"} className="object-cover" />}
              <AvatarFallback className="gradient-primary text-primary-foreground text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              {uploading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white" />}
            </div>
            <input type="file" accept="image/*" className="sr-only" onChange={onAvatarChange} disabled={uploading} />
          </label>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-xl truncate">{profile.display_name ?? "Sans nom"}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase tracking-wider">{profile.plan}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { v: stats.courses, l: "Cours" },
            { v: stats.quizzes, l: "Quizz" },
            { v: `${stats.avg}%`, l: "Moyenne" },
            { v: `${profile.streak_days ?? 0}j`, l: "Streak" },
            { v: `${profile.streak_record ?? 0}j`, l: "Record" },
          ].map(s => (
            <div key={s.l} className="rounded-xl border bg-card p-3 text-center">
              <p className="font-serif text-2xl">{s.v}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Section abonnement */}
        <div className="space-y-3 scroll-mt-20" id="abonnement">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Abonnement</p>

            {isActive ? (
              <div className="rounded-md border-[2.5px] border-foreground bg-card p-4 shadow-brutal-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <p className="font-serif text-lg">Revix {tier === "max" ? "Max" : "Pro"}</p>
                  <span className="ml-auto text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border-[1.5px] border-foreground bg-primary text-primary-foreground">
                    Actif
                  </span>
                </div>
                {subscription?.current_period_end && (
                  <p className="text-xs text-muted-foreground">
                    {subscription.cancel_at_period_end
                      ? `Se termine le ${new Date(subscription.current_period_end).toLocaleDateString("fr-FR")}`
                      : `Prochain renouvellement : ${new Date(subscription.current_period_end).toLocaleDateString("fr-FR")}`}
                  </p>
                )}
                <Button
                  onClick={openManagePortal}
                  disabled={portalLoading}
                  variant="outline"
                  size="sm"
                  className="rounded-full w-full mt-1"
                >
                  {portalLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <CreditCard className="h-3.5 w-3.5 mr-1" />}
                  Gérer mon abonnement
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {PLANS.map((p) => (
                  <div
                    key={p.id}
                    className={`rounded-md border-[2.5px] border-foreground bg-gradient-to-br ${p.gradient} p-4 shadow-brutal-sm text-primary-foreground relative overflow-hidden`}
                  >
                    {p.highlight && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider bg-foreground text-background px-2 py-0.5 rounded">
                        Best
                      </span>
                    )}
                    <div className="flex items-baseline gap-2">
                      <p className="font-serif text-2xl">{p.name}</p>
                      <p className="font-bold text-xl">{p.price}<span className="text-xs opacity-80">/mois TTC</span></p>
                    </div>
                    <p className="text-xs opacity-90 mt-0.5">{p.tagline}</p>
                    <ul className="mt-3 space-y-1">
                      {p.perks.map((perk) => (
                        <li key={perk} className="flex items-center gap-1.5 text-xs">
                          <Check className="h-3 w-3 shrink-0" /> {perk}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-full mt-3 w-full"
                      onClick={() => setCheckoutPriceId(p.id)}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" /> Choisir {p.name}
                    </Button>
                  </div>
                ))}
              </div>
            )}
        </div>

        <Dialog
          open={!!checkoutPriceId}
          onOpenChange={(open) => {
            if (!open) setCheckoutPriceId(null);
          }}
        >
          <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
            <DialogHeader className="px-5 pt-5">
              <DialogTitle className="font-serif text-xl">Finaliser l'abonnement</DialogTitle>
            </DialogHeader>
            <div className="px-2 pb-4">
              {checkoutPriceId && user && (
                <StripeEmbeddedCheckout
                  priceId={checkoutPriceId}
                  userId={user.id}
                  customerEmail={user.email ?? undefined}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        <ReferralCard />

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personnalisation</p>
          <Link to="/app/cosmetics" className="flex items-center gap-3 rounded-md border-[2.5px] border-foreground bg-card p-3 shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
            <div className="h-10 w-10 rounded-md gradient-primary border-2 border-foreground flex items-center justify-center text-primary-foreground">
              <Shirt className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Mes cosmétiques</p>
              <p className="text-[11px] text-muted-foreground">Cadres, stickers, fonds, titres</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link to="/app/revision" className="flex items-center gap-3 rounded-md border-[2.5px] border-foreground bg-card p-3 shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
            <div className="h-10 w-10 rounded-md bg-secondary border-2 border-foreground flex items-center justify-center">
              <BookMarked className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Révisions ciblées</p>
              <p className="text-[11px] text-muted-foreground">Heatmap chapitres + boss</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          {isAdmin && (
            <Link to="/admin/ai-usage" className="flex items-center gap-3 rounded-md border-[2.5px] border-foreground bg-card p-3 shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
              <div className="h-10 w-10 rounded-md bg-primary border-2 border-foreground flex items-center justify-center text-primary-foreground">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">Suivi IA Claude <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground ml-1">ADMIN</span></p>
                <p className="text-[11px] text-muted-foreground">Coûts, appels, top users</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Informations</p>
          <div className="space-y-1.5"><Label>Prénom</Label><Input value={profile.display_name ?? ""} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>École</Label><Input value={profile.school ?? ""} onChange={(e) => setProfile({ ...profile, school: e.target.value })} /></div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Bio</Label>
              <span className="text-[10px] text-muted-foreground">{(profile.bio ?? "").length}/200</span>
            </div>
            <Textarea
              value={profile.bio ?? ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value.slice(0, 200) })}
              placeholder="Parle un peu de toi, tes objectifs, ta passion..."
              rows={3}
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5"><Label>Cursus</Label>
            <select value={profile.cursus ?? ""} onChange={(e) => setProfile({ ...profile, cursus: e.target.value })} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">—</option>
              {CURSUS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5"><Label>Je suis</Label>
            <select
              value={profile.gender ?? ""}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value || null })}
              className="w-full h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">—</option>
              {GENDER_OPTIONS.map(g => (
                <option key={g.value} value={g.value}>{g.emoji} {g.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Formation précise</Label>
            <SearchableCombobox
              items={formationItems}
              value={profile.formation ?? ""}
              onChange={(v) => setProfile({ ...profile, formation: v })}
              placeholder="ex : BUT GEA, Licence Droit..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Mes matières</Label>
            <SearchableMultiCombobox
              items={subjectItems}
              values={(profile.subjects as string[]) ?? []}
              onChange={(v) => setProfile({ ...profile, subjects: v })}
              placeholder="Ajouter une matière"
              max={20}
            />
          </div>
          <Button onClick={save} className="w-full rounded-full gradient-primary border-0">Enregistrer</Button>
        </div>

        <Button onClick={logout} variant="outline" className="w-full rounded-full">
          <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
        </Button>

        <Button
          variant="ghost"
          className="w-full text-destructive"
          onClick={() => setDeleteDialogOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" /> Supprimer mon compte
        </Button>

        {/* Dialog de confirmation pour la suppression de compte (RGPD art. 17) */}
        <Dialog open={deleteDialogOpen} onOpenChange={(open) => { if (!deleting) setDeleteDialogOpen(open); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-destructive">
                Supprimer définitivement ton compte ?
              </DialogTitle>
              <DialogDescription className="space-y-2 pt-2">
                <span className="block">Cette action est <strong>irréversible</strong>. Vont être supprimés :</span>
                <span className="block text-sm">
                  • Ton profil et tes statistiques<br />
                  • Tes cours, fiches et quiz générés<br />
                  • Ton historique de révisions et planning<br />
                  • Tes XP, niveau, streak et cosmétiques<br />
                  • Tes participations à des duels et study rooms
                </span>
                {isActive && (
                  <span className="block text-sm text-amber-600 dark:text-amber-400 pt-2">
                    ⚠️ Tu as un abonnement actif. Pense à le résilier d'abord depuis « Gérer mon abonnement »
                    pour ne plus être facturé.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleting}
                className="rounded-full"
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={deleteAccount}
                disabled={deleting}
                className="rounded-full"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Suppression…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" /> Supprimer définitivement
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}