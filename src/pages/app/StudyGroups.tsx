import { useEffect, useState } from "react";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, LogIn, Users, Flame, Crown, Loader2, Copy, LogOut, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { CosmeticAvatar } from "@/components/revix/CosmeticAvatar";
import { type Rarity } from "@/lib/cosmetics";
import { TitleBadge } from "@/components/revix/TitleBadge";
import { cn } from "@/lib/utils";

type Group = {
  id: string;
  name: string;
  emoji: string;
  invite_code: string;
  group_streak_days: number;
  group_streak_record: number;
  member_count: number;
  contributed_today: number;
  all_contributed_today: boolean;
  is_owner: boolean;
};

type Member = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  role: string;
  contributed_today: boolean;
  xp_today: number;
  equipped_frame?: string | null;
  equipped_sticker?: string | null;
  equipped_title?: string | null;
  sticker_emoji?: string | null;
  title_name?: string | null;
  title_emoji?: string | null;
  title_rarity?: Rarity | null;
};

const initials = (n?: string | null) => (n ?? "U").split(" ").map(s => s[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
const EMOJIS = ["👥", "🔥", "🎯", "🏆", "💪", "🚀", "🧠", "⚡", "🦄", "🌟"];

export default function StudyGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("👥");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const [openGroup, setOpenGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.rpc("get_my_groups");
    setGroups((data ?? []) as Group[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  // Realtime — refresh when activity changes
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`groups:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "study_group_activity" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "study_groups" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "study_group_members" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const loadMembers = async (g: Group) => {
    setOpenGroup(g);
    setLoadingMembers(true);
    const { data } = await supabase.rpc("get_group_members", { p_group_id: g.id });
    setMembers((data ?? []) as Member[]);
    setLoadingMembers(false);
  };

  const submitCreate = async () => {
    if (!name.trim() || name.trim().length < 2) { toast.error("Nom trop court"); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("create_study_group", { p_name: name.trim(), p_emoji: emoji });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Groupe créé ${emoji} — partage le code à tes potes !`);
    setCreateOpen(false); setName(""); setEmoji("👥");
    load();
  };

  const submitJoin = async () => {
    if (!code.trim()) return;
    setBusy(true);
    const { error } = await supabase.rpc("join_group_by_code", { p_code: code.trim().toUpperCase() });
    setBusy(false);
    if (error) {
      const msg = error.message.includes("not_found") ? "Groupe introuvable"
        : error.message.includes("group_full") ? "Groupe plein (max 10)"
          : error.message;
      toast.error(msg); return;
    }
    toast.success("Bienvenue dans le groupe 🎉");
    setJoinOpen(false); setCode("");
    load();
  };

  const leave = async (g: Group) => {
    if (!confirm(`Quitter "${g.name}" ?`)) return;
    const { error } = await supabase.rpc("leave_study_group", { p_group_id: g.id });
    if (error) { toast.error(error.message); return; }
    toast.success("Tu as quitté le groupe");
    setOpenGroup(null);
    load();
  };

  const copyCode = (c: string) => {
    navigator.clipboard.writeText(c);
    toast.success("Code copié !");
  };

  return (
    <AppLayout>
      <PageHeader emoji="👥" title="Groupes d'étude" subtitle="Streak partagée · entraidez-vous" />

      <div className="px-5 pb-6 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => setCreateOpen(true)} className="rounded-md gradient-primary border-2 border-foreground font-bold text-xs h-10">
            <Plus className="h-3 w-3 mr-1" /> Créer
          </Button>
          <Button onClick={() => setJoinOpen(true)} variant="outline" className="rounded-md border-2 border-foreground font-bold text-xs h-10">
            <LogIn className="h-3 w-3 mr-1" /> Rejoindre
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" /></div>
        ) : groups.length === 0 ? (
          <div className="text-center py-10 px-4 bg-card border-2 border-dashed border-foreground rounded-md">
            <p className="text-5xl mb-2">👥</p>
            <p className="font-display text-lg">Aucun groupe pour l'instant</p>
            <p className="text-xs text-muted-foreground mt-2">Crée un groupe avec tes potes pour booster vos streaks ensemble.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <button key={g.id} onClick={() => loadMembers(g)} className="w-full text-left bg-card p-4 rounded-md border-2 border-foreground shadow-brutal-sm hover:shadow-brutal transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="text-3xl shrink-0">{g.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-display text-base truncate">{g.name}</p>
                      {g.is_owner && <Crown className="h-3 w-3 text-accent shrink-0" />}
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      <Users className="h-2.5 w-2.5 inline" /> {g.member_count} · code {g.invite_code}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <Flame className={`h-4 w-4 ${g.group_streak_days > 0 ? "text-accent" : "text-muted-foreground"}`} />
                      <p className="font-mono text-lg font-bold">{g.group_streak_days}</p>
                    </div>
                    <p className="text-[9px] text-muted-foreground uppercase">jours</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                    <span>Aujourd'hui</span>
                    <span className={g.all_contributed_today ? "text-success" : "text-muted-foreground"}>
                      {g.contributed_today}/{g.member_count}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden border border-foreground/40">
                    <div className={`h-full transition-all ${g.all_contributed_today ? "bg-success" : "bg-accent"}`} style={{ width: `${g.member_count > 0 ? (g.contributed_today / g.member_count) * 100 : 0}%` }} />
                  </div>
                  {g.all_contributed_today && (
                    <p className="text-[10px] font-bold text-success mt-1">✓ Streak validée pour aujourd'hui !</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CREATE */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Créer un groupe</DialogTitle><DialogDescription>Donne-lui un nom et choisis un emoji.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Les warriors du BTS" maxLength={40} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2">Emoji</p>
              <div className="grid grid-cols-5 gap-2">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => setEmoji(e)} className={`h-10 rounded-md border-2 border-foreground text-xl ${emoji === e ? "bg-primary" : "bg-card"}`}>{e}</button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitCreate} disabled={busy} className="rounded-md gradient-primary border-2 border-foreground font-bold w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* JOIN */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejoindre un groupe</DialogTitle><DialogDescription>Entre le code à 6 caractères.</DialogDescription></DialogHeader>
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABC123" maxLength={6} className="font-mono text-center text-lg" />
          <DialogFooter>
            <Button onClick={submitJoin} disabled={busy || !code.trim()} className="rounded-md gradient-primary border-2 border-foreground font-bold w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rejoindre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MEMBER DETAIL */}
      <Dialog open={!!openGroup} onOpenChange={(o) => !o && setOpenGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{openGroup?.emoji} {openGroup?.name}</DialogTitle>
            <DialogDescription>
              Streak {openGroup?.group_streak_days} jour(s) · Record {openGroup?.group_streak_record}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md border border-foreground/30">
              <span className="text-[10px] font-bold uppercase">Code :</span>
              <span className="font-mono font-bold flex-1">{openGroup?.invite_code}</span>
              <Button size="sm" variant="outline" onClick={() => openGroup && copyCode(openGroup.invite_code)} className="h-7 px-2 rounded border-2 border-foreground">
                <Copy className="h-3 w-3" />
              </Button>
            </div>

            {loadingMembers ? (
              <div className="text-center py-6"><Loader2 className="h-5 w-5 mx-auto animate-spin" /></div>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {members.map((m) => (
                  <Link key={m.user_id} to={m.user_id === user?.id ? "/app/profil" : `/app/u/${m.user_id}`} className="flex items-center gap-2 p-2 bg-card border border-foreground/30 rounded-md hover:bg-secondary/40 transition-colors">
                    <CosmeticAvatar
                      fallback={initials(m.display_name)}
                      avatarUrl={m.avatar_url}
                      frame={m.equipped_frame}
                      sticker={m.sticker_emoji}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate flex items-center gap-1">
                        {m.display_name ?? "—"}
                        {m.role === "owner" && <Crown className="h-3 w-3 text-accent" />}
                      </p>
                      <TitleBadge
                        itemKey={m.equipped_title}
                        name={m.title_name}
                        emoji={m.title_emoji}
                        rarity={m.title_rarity ?? "common"}
                        size="text-[9px]"
                      />
                      <p className="text-[9px] text-muted-foreground">N{m.level} · {m.xp_today} XP today</p>
                    </div>
                    {m.contributed_today ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Link>
                ))}
              </div>
            )}

            <Button onClick={() => openGroup && leave(openGroup)} variant="outline" className="w-full rounded-md border-2 border-destructive text-destructive font-bold">
              <LogOut className="h-3 w-3 mr-1" /> Quitter le groupe
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}