import { useEffect, useMemo, useState } from "react";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Copy, Check, X, UserPlus, Search, Trophy, Flame, Sparkles, AtSign, Loader2, Swords, BookOpen, Plus, LogIn } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { LeaderboardTabs } from "@/components/revix/leaderboard/LeaderboardTabs";
import { CosmeticAvatar } from "@/components/revix/CosmeticAvatar";
import { type Rarity } from "@/lib/cosmetics";
import { TitleBadge } from "@/components/revix/TitleBadge";
import { cn } from "@/lib/utils";

type SearchResult = {
  id: string;
  display_name: string | null;
  username: string | null;
  student_code: string | null;
  avatar_url: string | null;
  level: number | null;
  cursus: string | null;
  equipped_frame?: string | null;
  equipped_sticker?: string | null;
  equipped_title?: string | null;
  sticker_emoji?: string | null;
  title_name?: string | null;
  title_emoji?: string | null;
  title_rarity?: Rarity | null;
};

type Friend = SearchResult & {
  bio?: string | null;
  streak_days?: number | null;
  xp_total?: number | null;
  xp_week?: number | null;
  equipped_background?: string | null;
  equipped_title?: string | null;
};

type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
};

type LeaderboardRow = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  level: number;
  xp_week: number;
  xp_total: number;
  streak_days: number;
  is_me: boolean;
};

const initialsOf = (name?: string | null) =>
  (name ?? "U").split(" ").map(s => s[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();

export default function Campus() {
  const { user } = useAuth();
  const [me, setMe] = useState<{ student_code: string | null; username: string | null } | null>(null);
  const [tab, setTab] = useState("amis");

  // Amis
  const [friendships, setFriendships] = useState<FriendshipRow[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, Friend>>({});
  const [loadingFriends, setLoadingFriends] = useState(true);

  // Recherche
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Pseudo
  const [usernameInput, setUsernameInput] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);

  // Duels & Salles
  const nav = useNavigate();
  const [duels, setDuels] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [createDuelOpen, setCreateDuelOpen] = useState(false);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [joinCodeOpen, setJoinCodeOpen] = useState(false);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [duelOpponent, setDuelOpponent] = useState("");
  const [duelCourse, setDuelCourse] = useState("");
  const [duelNum, setDuelNum] = useState(10);
  const [duelSecs, setDuelSecs] = useState(30);
  const [roomName, setRoomName] = useState("");
  const [roomPreset, setRoomPreset] = useState("pomodoro_25_5");
  const [roomMax, setRoomMax] = useState(4);
  const [joinCode, setJoinCode] = useState("");

  const loadAll = async () => {
    if (!user) return;
    setLoadingFriends(true);
    const [{ data: prof }, { data: fs }, { data: lb }, { data: ds }, { data: rs }, { data: cs }] = await Promise.all([
      supabase.from("profiles").select("student_code, username").eq("id", user.id).maybeSingle(),
      supabase.from("friendships").select("*"),
      supabase.rpc("get_friends_leaderboard"),
      supabase.from("duels").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("study_rooms").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(10),
      supabase.from("courses").select("id, title, subject, emoji").eq("user_id", user.id),
    ]);
    setMe(prof as any);
    setUsernameInput((prof as any)?.username ?? "");
    const rows = (fs ?? []) as FriendshipRow[];
    setFriendships(rows);
    setLeaderboard((lb ?? []) as LeaderboardRow[]);
    setDuels(ds ?? []);
    setRooms(rs ?? []);
    setMyCourses(cs ?? []);

    // Récupérer les profils des autres utilisateurs liés
    const otherIds = Array.from(new Set(
      rows.map(r => r.requester_id === user.id ? r.addressee_id : r.requester_id)
    ));
    if (otherIds.length) {
      const profiles = await Promise.all(
        otherIds.map(id => supabase.rpc("get_public_profile", { p_user_id: id }).then(r => r.data?.[0]))
      );
      const map: Record<string, Friend> = {};
      profiles.filter(Boolean).forEach((p: any) => { map[p.id] = p; });
      setProfilesMap(map);
    } else {
      setProfilesMap({});
    }
    setLoadingFriends(false);
  };

  useEffect(() => { loadAll(); }, [user]);

  // Realtime : duels (auto-redirect quand un duel passe à "accepted") + salles
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`campus:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "duels" }, (payload: any) => {
        loadAll();
        const row = payload.new ?? payload.old;
        if (!row) return;
        // Si je suis le challenger et que l'opposant vient d'accepter, j'entre dans le duel
        if (
          payload.eventType === "UPDATE" &&
          row.status === "accepted" &&
          row.challenger_id === user.id &&
          payload.old?.status === "pending"
        ) {
          toast.success("Ton adversaire a accepté ⚔️ Le duel commence !");
          nav(`/app/duel/${row.id}`);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "study_rooms" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, nav]);

  // Recherche debounce
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase.rpc("search_users_public", { p_query: query.trim() });
      setResults((data ?? []) as SearchResult[]);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const accepted = friendships.filter(f => f.status === "accepted");
  const incoming = friendships.filter(f => f.status === "pending" && f.addressee_id === user?.id);
  const outgoing = friendships.filter(f => f.status === "pending" && f.requester_id === user?.id);

  const friendIds = new Set(accepted.map(f => f.requester_id === user?.id ? f.addressee_id : f.requester_id));
  const pendingWith = new Set(friendships.filter(f => f.status === "pending").map(f => f.requester_id === user?.id ? f.addressee_id : f.requester_id));

  const copyCode = () => {
    if (!me?.student_code) return;
    navigator.clipboard.writeText(me.student_code);
    toast.success("Code copié !");
  };

  const sendRequest = async (addresseeId: string) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: addresseeId,
      status: "pending",
    });
    if (error) {
      if (error.code === "23505") toast.error("Demande déjà envoyée");
      else toast.error(error.message);
    } else {
      toast.success("Demande envoyée 📨");
      loadAll();
    }
  };

  const acceptRequest = async (id: string) => {
    const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Ami ajouté ✨ +15 XP"); loadAll(); }
  };

  const rejectRequest = async (id: string) => {
    const { error } = await supabase.from("friendships").delete().eq("id", id);
    if (error) toast.error(error.message);
    else loadAll();
  };

  const removeFriend = async (otherId: string) => {
    if (!user) return;
    if (!confirm("Retirer cet ami ?")) return;
    const f = friendships.find(f =>
      (f.requester_id === user.id && f.addressee_id === otherId) ||
      (f.addressee_id === user.id && f.requester_id === otherId)
    );
    if (!f) return;
    const { error } = await supabase.from("friendships").delete().eq("id", f.id);
    if (error) toast.error(error.message); else loadAll();
  };

  const submitCreateDuel = async () => {
    if (!duelOpponent || !duelCourse) { toast.error("Choisis un ami et un cours"); return; }
    const { data, error } = await supabase.rpc("create_duel", {
      p_opponent_id: duelOpponent, p_course_id: duelCourse,
      p_num_questions: duelNum, p_seconds_per_question: duelSecs,
    });
    if (error) {
      const msg = error.message.includes("not_enough_questions") ? "Pas assez de QCM dans ce cours (mini 3). Génère un quiz d'abord."
        : error.message.includes("not_friends") ? "Tu dois être ami avec cette personne"
        : error.message;
      toast.error(msg);
      return;
    }
    toast.success("Défi envoyé ⚔️");
    setCreateDuelOpen(false);
    loadAll();
  };

  const acceptDuel = async (duelId: string) => {
    const { error } = await supabase.rpc("accept_duel", { p_duel_id: duelId });
    if (error) { toast.error(error.message); return; }
    nav(`/app/duel/${duelId}`);
  };

  const submitCreateRoom = async () => {
    if (!roomName.trim() || !user) return;
    const { data, error } = await supabase.from("study_rooms").insert({
      host_id: user.id, name: roomName.trim(), invite_code: "",
      timer_preset: roomPreset, max_members: roomMax, privacy: "open",
    }).select().single();
    if (error) { toast.error(error.message); return; }
    toast.success("Salle créée 📚");
    setCreateRoomOpen(false);
    setRoomName("");
    nav(`/app/room/${data.id}`);
  };

  const submitJoinCode = async () => {
    if (!joinCode.trim()) return;
    const { data, error } = await supabase.rpc("join_room_by_code", { p_code: joinCode.trim().toUpperCase() });
    if (error) {
      const msg = error.message.includes("room_not_found") ? "Salle introuvable"
        : error.message.includes("room_full") ? "Salle pleine" : error.message;
      toast.error(msg);
      return;
    }
    setJoinCodeOpen(false);
    setJoinCode("");
    nav(`/app/room/${data}`);
  };

  const acceptedFriends = accepted.map(f => {
    const otherId = f.requester_id === user?.id ? f.addressee_id : f.requester_id;
    return profilesMap[otherId];
  }).filter(Boolean);

  const saveUsername = async () => {
    if (!usernameInput.trim()) return;
    setSavingUsername(true);
    const { data, error } = await supabase.rpc("set_username", { p_username: usernameInput.trim() });
    setSavingUsername(false);
    if (error) { toast.error(error.message); return; }
    const res = data as any;
    if (!res?.success) {
      const msg = res?.error === "taken" ? "Pseudo déjà pris"
        : res?.error === "invalid_format" ? "3-20 caractères, lettres/chiffres/_"
        : "Erreur";
      toast.error(msg);
    } else {
      toast.success(`Pseudo réservé : @${res.username}`);
      setMe(m => m ? { ...m, username: res.username } : m);
    }
  };

  return (
    <AppLayout>
      <PageHeader emoji="🏫" title="Le Campus" subtitle="Tes amis · ton classement" />

      <div className="px-5 pb-6">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-card border-2 border-foreground rounded-md p-1 font-mono text-[10px]">
            <TabsTrigger value="amis" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm font-bold uppercase tracking-wider">
              Amis
            </TabsTrigger>
            <TabsTrigger value="duels" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm font-bold uppercase tracking-wider">
              Duels ⚔️
            </TabsTrigger>
            <TabsTrigger value="salles" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm font-bold uppercase tracking-wider">
              Salles 📚
            </TabsTrigger>
            <TabsTrigger value="classement" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm font-bold uppercase tracking-wider">
              Top 🏆
            </TabsTrigger>
          </TabsList>

          {/* ==================== AMIS ==================== */}
          <TabsContent value="amis" className="mt-5 space-y-5">

            {/* Carte code étudiant — post-it rose */}
            <div className="postit-pink p-4 rounded-md border-2 border-foreground shadow-brutal">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Ton code étudiant</p>
              <p className="font-mono text-2xl font-bold mt-1 select-all">#{me?.student_code ?? "..."}</p>
              {me?.username && (
                <p className="text-xs font-mono mt-1 opacity-80">@{me.username}</p>
              )}
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={copyCode} variant="outline" className="rounded-md border-2 border-foreground bg-card font-bold text-xs h-8">
                  <Copy className="h-3 w-3 mr-1" /> Copier
                </Button>
              </div>
            </div>

            {/* Pseudo */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <AtSign className="h-3 w-3" /> Ton pseudo (optionnel)
              </label>
              <div className="flex gap-2">
                <Input
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="ex: marie_btsco"
                  maxLength={20}
                  className="font-mono text-sm"
                />
                <Button onClick={saveUsername} disabled={savingUsername || !usernameInput.trim() || usernameInput === (me?.username ?? "")} className="rounded-md gradient-primary border-2 border-foreground font-bold">
                  {savingUsername ? <Loader2 className="h-4 w-4 animate-spin" /> : "OK"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">3-20 caractères · lettres, chiffres, _</p>
            </div>

            {/* Recherche */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Search className="h-3 w-3" /> Trouver un étudiant
              </label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pseudo, code REVIX-XXXX, ou prénom..."
              />
              {searching && <p className="text-xs text-muted-foreground">Recherche...</p>}
              {!searching && query.length >= 2 && results.length === 0 && (
                <p className="text-xs text-muted-foreground">Aucun étudiant trouvé.</p>
              )}
              {results.length > 0 && (
                <div className="space-y-2">
                  {results.map(r => {
                    const isFriend = friendIds.has(r.id);
                    const isPending = pendingWith.has(r.id);
                    return (
                      <div key={r.id} className="flex items-center gap-3 p-3 bg-card rounded-md border-2 border-foreground shadow-brutal-sm">
                        <Link to={`/app/u/${r.id}`} className="shrink-0">
                          <CosmeticAvatar
                            fallback={initialsOf(r.display_name)}
                            avatarUrl={r.avatar_url}
                            frame={r.equipped_frame}
                            sticker={r.sticker_emoji}
                            size="sm"
                          />
                        </Link>
                        <Link to={`/app/u/${r.id}`} className="flex-1 min-w-0 hover:underline">
                          <p className="font-bold text-sm truncate">{r.display_name ?? "Sans nom"}</p>
                          <TitleBadge
                            itemKey={r.equipped_title}
                            name={r.title_name}
                            emoji={r.title_emoji}
                            rarity={r.title_rarity ?? "common"}
                            size="text-[9px]"
                          />
                          <p className="text-[10px] font-mono text-muted-foreground truncate">
                            {r.username ? `@${r.username} · ` : ""}#{r.student_code}
                          </p>
                        </Link>
                        {isFriend ? (
                          <span className="text-[10px] font-bold uppercase text-success px-2">Ami ✓</span>
                        ) : isPending ? (
                          <span className="text-[10px] font-bold uppercase text-muted-foreground px-2">En attente</span>
                        ) : (
                          <Button size="sm" onClick={() => sendRequest(r.id)} className="rounded-md border-2 border-foreground gradient-primary text-xs font-bold h-8">
                            <UserPlus className="h-3 w-3 mr-1" /> Ajouter
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Demandes reçues */}
            {incoming.length > 0 && (
              <div className="space-y-2">
                <div className="label-tape label-tape-violet inline-block">DEMANDES EN ATTENTE</div>
                {incoming.map(req => {
                  const p = profilesMap[req.requester_id];
                  return (
                    <div key={req.id} className="postit p-3 rounded-md border-2 border-foreground shadow-brutal-sm flex items-center gap-3">
                      <CosmeticAvatar
                        fallback={initialsOf(p?.display_name)}
                        avatarUrl={p?.avatar_url}
                        frame={p?.equipped_frame}
                        sticker={p?.sticker_emoji}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{p?.display_name ?? "..."}</p>
                        <p className="text-[10px]">veut t'ajouter</p>
                      </div>
                      <Button size="icon" onClick={() => acceptRequest(req.id)} className="h-8 w-8 rounded-md bg-success text-success-foreground border-2 border-foreground">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" onClick={() => rejectRequest(req.id)} className="h-8 w-8 rounded-md bg-destructive text-destructive-foreground border-2 border-foreground">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Liste amis */}
            <div className="space-y-2">
              <div className="label-tape inline-block">MES AMIS ({accepted.length})</div>
              {loadingFriends ? (
                <p className="text-xs text-muted-foreground">Chargement...</p>
              ) : accepted.length === 0 ? (
                <div className="text-center py-8 px-4 bg-card border-2 border-dashed border-foreground rounded-md">
                  <p className="text-4xl mb-2">👀</p>
                  <p className="font-display text-base">Ton campus est vide</p>
                  <p className="text-xs text-muted-foreground mt-2">Partage ton code à tes amis de promo. En groupe, on retient 40% de plus.</p>
                  <Button onClick={copyCode} className="mt-3 rounded-md gradient-primary border-2 border-foreground font-bold text-xs h-8">
                    <Copy className="h-3 w-3 mr-1" /> Copier mon code
                  </Button>
                </div>
              ) : (
                accepted.map(f => {
                  const otherId = f.requester_id === user?.id ? f.addressee_id : f.requester_id;
                  const p = profilesMap[otherId];
                  if (!p) return null;
                  return (
                    <div key={f.id} className="bg-card p-3 rounded-md border-2 border-foreground shadow-brutal-sm flex items-center gap-3">
                      <Link to={`/app/u/${otherId}`} className="relative shrink-0">
                        <CosmeticAvatar
                          fallback={initialsOf(p.display_name)}
                          avatarUrl={p.avatar_url}
                          frame={p.equipped_frame}
                          sticker={p.sticker_emoji}
                          size="md"
                        />
                        <span className="absolute -bottom-1 -right-1 text-[9px] font-mono font-bold bg-accent text-accent-foreground border border-foreground rounded px-1">
                          N{p.level ?? 1}
                        </span>
                      </Link>
                      <Link to={`/app/u/${otherId}`} className="flex-1 min-w-0 hover:underline">
                        <p className="font-bold text-sm truncate">{p.display_name ?? "—"}</p>
                        <TitleBadge
                          itemKey={p.equipped_title}
                          name={p.title_name}
                          emoji={p.title_emoji}
                          rarity={p.title_rarity ?? "common"}
                          size="text-[9px]"
                        />
                        <p className="text-[10px] font-mono text-muted-foreground truncate">
                          {p.username ? `@${p.username}` : `#${p.student_code}`}
                        </p>
                        <div className="flex gap-2 mt-1 text-[10px] font-bold">
                          <span className="flex items-center gap-0.5">🔥{p.streak_days ?? 0}</span>
                          <span className="flex items-center gap-0.5">⭐{p.xp_total ?? 0}</span>
                        </div>
                      </Link>
                      <Button size="sm" variant="ghost" onClick={() => removeFriend(otherId)} className="text-destructive h-7 text-[10px] font-bold">
                        Retirer
                      </Button>
                    </div>
                  );
                })
              )}
            </div>

            {outgoing.length > 0 && (
              <div className="space-y-2">
                <div className="label-tape label-tape-mint inline-block">ENVOYÉES ({outgoing.length})</div>
                {outgoing.map(req => {
                  const p = profilesMap[req.addressee_id];
                  return (
                    <div key={req.id} className="bg-muted p-2 rounded-md border-2 border-dashed border-foreground flex items-center gap-2 text-xs">
                      <CosmeticAvatar
                        fallback={initialsOf(p?.display_name)}
                        avatarUrl={p?.avatar_url}
                        frame={p?.equipped_frame}
                        sticker={p?.sticker_emoji}
                        size="sm"
                      />
                      <span className="flex-1 truncate">{p?.display_name ?? "..."} — en attente</span>
                      <button onClick={() => rejectRequest(req.id)} className="text-destructive font-bold text-[10px]">Annuler</button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ==================== DUELS ==================== */}
          <TabsContent value="duels" className="mt-5 space-y-4">
            <Button onClick={() => setCreateDuelOpen(true)} className="w-full rounded-md gradient-primary border-2 border-foreground font-bold">
              <Swords className="h-4 w-4 mr-2" /> Lancer un duel
            </Button>
            {duels.length === 0 ? (
              <div className="text-center py-8 px-4 bg-card border-2 border-dashed border-foreground rounded-md">
                <p className="text-4xl mb-2">⚔️</p>
                <p className="font-display text-base">Aucun duel</p>
                <p className="text-xs text-muted-foreground mt-2">Défie un ami sur un de tes cours.</p>
              </div>
            ) : duels.map(d => {
              const isChall = d.challenger_id === user?.id;
              const otherId = isChall ? d.opponent_id : d.challenger_id;
              const p = profilesMap[otherId];
              const incoming = !isChall && d.status === "pending";
              const myTurn = d.status === "accepted";
              const won = d.status === "completed" && d.winner_id === user?.id;
              const lost = d.status === "completed" && d.winner_id && d.winner_id !== user?.id;
              return (
                <div key={d.id} className={`p-3 rounded-md border-2 border-foreground shadow-brutal-sm ${won ? "bg-success/20" : lost ? "bg-destructive/10" : "bg-card"}`}>
                  <div className="flex items-center gap-3">
                    <CosmeticAvatar
                      fallback={initialsOf(p?.display_name)}
                      avatarUrl={p?.avatar_url}
                      frame={p?.equipped_frame}
                      sticker={p?.sticker_emoji}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{isChall ? "Tu défies " : ""}{p?.display_name ?? "..."}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{d.subject ?? "—"} · {d.num_questions}Q · {d.seconds_per_question}s</p>
                      {d.status === "completed" && (
                        <p className="text-[11px] font-bold mt-0.5">
                          {won ? "🏆 Victoire" : lost ? "Défaite" : "Égalité"} — {d.challenger_score ?? "?"} vs {d.opponent_score ?? "?"}
                        </p>
                      )}
                    </div>
                    {incoming && <Button size="sm" onClick={() => acceptDuel(d.id)} className="rounded-md gradient-primary border-2 border-foreground text-xs h-8 font-bold">Accepter</Button>}
                    {myTurn && <Button size="sm" onClick={() => nav(`/app/duel/${d.id}`)} className="rounded-md gradient-primary border-2 border-foreground text-xs h-8 font-bold">Jouer</Button>}
                    {d.status === "pending" && isChall && <span className="text-[10px] font-bold text-muted-foreground">En attente</span>}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* ==================== SALLES ==================== */}
          <TabsContent value="salles" className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => setCreateRoomOpen(true)} className="rounded-md gradient-primary border-2 border-foreground font-bold text-xs h-9">
                <Plus className="h-3 w-3 mr-1" /> Créer
              </Button>
              <Button onClick={() => setJoinCodeOpen(true)} variant="outline" className="rounded-md border-2 border-foreground font-bold text-xs h-9">
                <LogIn className="h-3 w-3 mr-1" /> Code
              </Button>
            </div>
            {rooms.length === 0 ? (
              <div className="text-center py-8 px-4 bg-card border-2 border-dashed border-foreground rounded-md">
                <p className="text-4xl mb-2">📚</p>
                <p className="font-display text-base">Aucune salle active</p>
                <p className="text-xs text-muted-foreground mt-2">Crée une salle pour réviser ensemble.</p>
              </div>
            ) : rooms.map(r => (
              <div key={r.id} className="bg-card p-3 rounded-md border-2 border-foreground shadow-brutal-sm flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-hand text-lg truncate">{r.name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {r.timer_phase === "focus" ? "🍅 Focus en cours" : r.timer_phase === "pause" ? "☕ Pause" : "⏸ Idle"} · code {r.invite_code}
                  </p>
                </div>
                <Button size="sm" onClick={() => nav(`/app/room/${r.id}`)} className="rounded-md gradient-primary border-2 border-foreground text-xs h-8 font-bold">Rejoindre</Button>
              </div>
            ))}
          </TabsContent>

          {/* ==================== CLASSEMENT ==================== */}
          <TabsContent value="classement" className="mt-5 space-y-4">
            <div className="text-center">
              <p className="font-hand text-2xl">Tableau d'honneur</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Cette semaine</p>
            </div>
            <LeaderboardTabs initialScope="amis" />
          </TabsContent>
        </Tabs>
      </div>

      {/* DUELS et SALLES rendus hors Tabs ? Non, on les a omis. Les modals : */}
      <Dialog open={createDuelOpen} onOpenChange={setCreateDuelOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Lancer un duel ⚔️</DialogTitle><DialogDescription>Choisis un cours, un ami et la durée.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase">Adversaire</label>
              <select value={duelOpponent} onChange={(e) => setDuelOpponent(e.target.value)} className="w-full h-10 rounded-md border-2 border-foreground bg-card px-3 text-sm">
                <option value="">— choisir —</option>
                {acceptedFriends.map((p: any) => <option key={p.id} value={p.id}>{p.display_name ?? p.username ?? p.student_code}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase">Cours (avec QCM)</label>
              <select value={duelCourse} onChange={(e) => setDuelCourse(e.target.value)} className="w-full h-10 rounded-md border-2 border-foreground bg-card px-3 text-sm">
                <option value="">— choisir —</option>
                {myCourses.map((c: any) => <option key={c.id} value={c.id}>{c.emoji} {c.title}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase">Questions</label>
                <div className="flex gap-1">{[5,10,20].map(n => <button key={n} onClick={() => setDuelNum(n)} className={`flex-1 h-9 rounded-md border-2 border-foreground font-bold text-xs ${duelNum===n?"bg-primary text-primary-foreground":"bg-card"}`}>{n}</button>)}</div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase">Sec/Q</label>
                <div className="flex gap-1">{[20,30,45].map(n => <button key={n} onClick={() => setDuelSecs(n)} className={`flex-1 h-9 rounded-md border-2 border-foreground font-bold text-xs ${duelSecs===n?"bg-primary text-primary-foreground":"bg-card"}`}>{n}s</button>)}</div>
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={submitCreateDuel} className="rounded-md gradient-primary border-2 border-foreground font-bold w-full">Envoyer le défi ⚔️</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createRoomOpen} onOpenChange={setCreateRoomOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Créer une salle 📚</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Ex: Révisions BTS Marketing 🔥" />
            <div>
              <label className="text-[10px] font-bold uppercase">Timer</label>
              <div className="flex gap-1">
                {[{k:"pomodoro_25_5",l:"Pomodoro 25/5"},{k:"deep_50_10",l:"Deep 50/10"},{k:"sprint_15_3",l:"Sprint 15/3"}].map(p => (
                  <button key={p.k} onClick={() => setRoomPreset(p.k)} className={`flex-1 h-9 rounded-md border-2 border-foreground font-bold text-[10px] ${roomPreset===p.k?"bg-primary text-primary-foreground":"bg-card"}`}>{p.l}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase">Max membres : {roomMax}</label>
              <input type="range" min={2} max={6} value={roomMax} onChange={(e) => setRoomMax(parseInt(e.target.value))} className="w-full" />
            </div>
          </div>
          <DialogFooter><Button onClick={submitCreateRoom} className="rounded-md gradient-primary border-2 border-foreground font-bold w-full">Créer la salle 📚</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={joinCodeOpen} onOpenChange={setJoinCodeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejoindre une salle</DialogTitle><DialogDescription>Entre le code de la salle (6 caractères).</DialogDescription></DialogHeader>
          <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="ABC123" maxLength={6} className="font-mono text-center text-lg" />
          <DialogFooter><Button onClick={submitJoinCode} className="rounded-md gradient-primary border-2 border-foreground font-bold w-full">Rejoindre</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}