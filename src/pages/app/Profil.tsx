import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, Trash2, Sparkles, Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CURSUS_OPTIONS } from "@/data/cursus";
import { SearchableCombobox, SearchableMultiCombobox } from "@/components/revix/SearchableCombobox";
import { FORMATIONS } from "@/data/formations";
import { SUBJECTS } from "@/data/subjects";
import { AvatarCropper } from "@/components/revix/AvatarCropper";

export default function Profil() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ courses: 0, quizzes: 0, avg: 0 });
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

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

  if (!profile) return <AppLayout><div className="p-5 text-sm text-muted-foreground">Chargement...</div></AppLayout>;

  const initials = (profile.display_name ?? "U").split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase();

  const formationItems = FORMATIONS.map(f => ({
    value: f.name,
    label: f.abbr ? `${f.abbr} — ${f.name.replace(`${f.abbr} - `, "").replace(`${f.abbr} `, "")}` : f.name,
    group: f.category,
  }));
  const subjectItems = SUBJECTS.map(s => ({ value: s.name, label: s.name, group: s.category, emoji: s.emoji }));

  return (
    <AppLayout>
      <PageHeader emoji="👤" title="Profil" />

      <AvatarCropper
        file={pendingFile}
        open={cropOpen}
        onClose={() => { setCropOpen(false); setPendingFile(null); }}
        onCropped={uploadCropped}
      />

      <div className="px-5 space-y-5">
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

        {profile.plan === "gratuit" && (
          <div className="rounded-2xl gradient-primary p-4 text-primary-foreground">
            <p className="font-serif text-lg">Passe en Pro ✨</p>
            <p className="text-xs opacity-90 mt-0.5">Uploads illimités, quizz adaptatifs, planning IA.</p>
            <Button variant="secondary" size="sm" className="rounded-full mt-3"><Sparkles className="h-3.5 w-3.5 mr-1" /> Découvrir</Button>
          </div>
        )}

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
          onClick={() => toast.info("Suppression de compte", { description: "Pour supprimer ton compte, écris-nous à support@revix.app — on s'en occupe sous 48h." })}
        >
          <Trash2 className="h-4 w-4 mr-2" /> Supprimer mon compte
        </Button>
      </div>
    </AppLayout>
  );
}