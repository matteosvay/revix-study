import { useEffect, useMemo, useState } from "react";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Copy, Check, X, UserPlus, Search, Trophy, Flame, Sparkles, AtSign, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type SearchResult = {
  id: string;
  display_name: string | null;
  username: string | null;
  student_code: string | null;
  avatar_url: string | null;
  level: number | null;
  cursus: string | null;
};

type Friend = SearchResult & {
  bio?: string | null;
  streak_days?: number | null;
  xp_total?: number | null;
  xp_week?: number | null;
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

  const loadAll = async () => {
    if (!user) return;
    setLoadingFriends(true);
    const [{ data: prof }, { data: fs }, { data: lb }] = await Promise.all([
      supabase.from("profiles").select("student_code, username").eq("id", user.id).maybeSingle(),
      supabase.from("friendships").select("*"),
      supabase.rpc("get_friends_leaderboard"),
    ]);
    setMe(prof as any);
    setUsernameInput((prof as any)?.username ?? "");
    const rows = (fs ?? []) as FriendshipRow[];
    setFriendships(rows);
    setLeaderboard((lb ?? []) as LeaderboardRow[]);

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
          <TabsList className="w-full grid grid-cols-2 bg-card border-2 border-foreground rounded-md p-1 font-mono text-xs">
            <TabsTrigger value="amis" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm font-bold uppercase tracking-wider">
              Mes amis
            </TabsTrigger>
            <TabsTrigger value="classement" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm font-bold uppercase tracking-wider">
              Classement 🏆
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
                        <Avatar className="h-10 w-10 border-2 border-foreground">
                          {r.avatar_url && <AvatarImage src={r.avatar_url} />}
                          <AvatarFallback className="bg-secondary text-foreground text-xs font-bold">{initialsOf(r.display_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{r.display_name ?? "Sans nom"}</p>
                          <p className="text-[10px] font-mono text-muted-foreground truncate">
                            {r.username ? `@${r.username} · ` : ""}#{r.student_code}
                          </p>
                        </div>
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
                      <Avatar className="h-10 w-10 border-2 border-foreground">
                        {p?.avatar_url && <AvatarImage src={p.avatar_url} />}
                        <AvatarFallback className="bg-card text-foreground text-xs font-bold">{initialsOf(p?.display_name)}</AvatarFallback>
                      </Avatar>
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
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-foreground">
                          {p.avatar_url && <AvatarImage src={p.avatar_url} />}
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">{initialsOf(p.display_name)}</AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-1 -right-1 text-[9px] font-mono font-bold bg-accent text-accent-foreground border border-foreground rounded px-1">
                          N{p.level ?? 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{p.display_name ?? "—"}</p>
                        <p className="text-[10px] font-mono text-muted-foreground truncate">
                          {p.username ? `@${p.username}` : `#${p.student_code}`}
                        </p>
                        <div className="flex gap-2 mt-1 text-[10px] font-bold">
                          <span className="flex items-center gap-0.5">🔥{p.streak_days ?? 0}</span>
                          <span className="flex items-center gap-0.5">⭐{p.xp_total ?? 0}</span>
                        </div>
                      </div>
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
                      <Avatar className="h-7 w-7 border border-foreground">
                        {p?.avatar_url && <AvatarImage src={p.avatar_url} />}
                        <AvatarFallback className="text-[10px]">{initialsOf(p?.display_name)}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate">{p?.display_name ?? "..."} — en attente</span>
                      <button onClick={() => rejectRequest(req.id)} className="text-destructive font-bold text-[10px]">Annuler</button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ==================== CLASSEMENT ==================== */}
          <TabsContent value="classement" className="mt-5 space-y-4">
            <div className="text-center">
              <p className="font-hand text-2xl">Tableau d'honneur</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Cette semaine · entre amis</p>
            </div>

            {leaderboard.length <= 1 ? (
              <div className="text-center py-8 px-4 bg-card border-2 border-dashed border-foreground rounded-md">
                <Trophy className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="font-display text-base mt-2">Aucun ami à classer</p>
                <p className="text-xs text-muted-foreground mt-1">Ajoute des amis pour comparer vos progrès.</p>
              </div>
            ) : (
              <>
                {/* Podium top 3 */}
                <div className="grid grid-cols-3 gap-2">
                  {[1, 0, 2].map(idx => {
                    const row = leaderboard[idx];
                    if (!row) return <div key={idx} />;
                    const medals = ["🥇", "🥈", "🥉"];
                    const stamps = ["MAJOR", "MENTION TB", "MENTION B"];
                    const heights = ["h-32", "h-24", "h-20"];
                    const realIdx = idx;
                    return (
                      <div key={row.id} className="flex flex-col items-center">
                        <Avatar className={`${realIdx === 0 ? "h-14 w-14" : "h-10 w-10"} border-2 border-foreground mb-1`}>
                          {row.avatar_url && <AvatarImage src={row.avatar_url} />}
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{initialsOf(row.display_name)}</AvatarFallback>
                        </Avatar>
                        <p className="text-xs font-bold truncate max-w-full">{row.is_me ? "Toi" : row.display_name?.split(" ")[0] ?? "—"}</p>
                        <div className={`${heights[realIdx]} w-full bg-secondary border-2 border-foreground rounded-t-md mt-1 flex flex-col items-center justify-end p-1`}>
                          <p className="text-2xl">{medals[realIdx]}</p>
                          <p className="font-mono text-[10px] font-bold">{row.xp_week} XP</p>
                          <p className="text-[8px] font-bold uppercase tracking-wider mt-1">{stamps[realIdx]}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Liste complète */}
                <div className="bg-card border-2 border-foreground rounded-md shadow-brutal-sm overflow-hidden">
                  {leaderboard.map((row, i) => {
                    const max = leaderboard[0]?.xp_week || 1;
                    const pct = Math.max(2, Math.round((row.xp_week / max) * 100));
                    return (
                      <div key={row.id} className={`flex items-center gap-2 p-2 border-b border-foreground/20 last:border-0 ${row.is_me ? "bg-[hsl(var(--highlight-yellow))]/40" : ""}`}>
                        <span className="font-mono font-bold text-sm w-6 text-center">{i + 1}</span>
                        <Avatar className="h-8 w-8 border border-foreground">
                          {row.avatar_url && <AvatarImage src={row.avatar_url} />}
                          <AvatarFallback className="text-[10px] font-bold">{initialsOf(row.display_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-bold truncate">{row.is_me ? "Toi" : row.display_name ?? "—"}</p>
                            <span className="text-[8px] font-mono bg-foreground text-background px-1 rounded">N{row.level}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-0.5">
                            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-xs font-bold">{row.xp_week}</p>
                          <p className="text-[9px] text-muted-foreground flex items-center gap-0.5 justify-end">
                            <Flame className="h-2.5 w-2.5" />{row.streak_days}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Banner motiv */}
                {(() => {
                  const myIdx = leaderboard.findIndex(r => r.is_me);
                  if (myIdx <= 0) return null;
                  const above = leaderboard[myIdx - 1];
                  const diff = above.xp_week - leaderboard[myIdx].xp_week;
                  return (
                    <div className="postit-pink p-3 rounded-md border-2 border-foreground shadow-brutal-sm">
                      <p className="text-xs font-bold">
                        T'es {myIdx + 1}{myIdx === 1 ? "ème" : "ème"} cette semaine !
                      </p>
                      <p className="text-[11px] mt-1">
                        Plus que <span className="font-mono font-bold">{diff} XP</span> pour dépasser {above.display_name?.split(" ")[0] ?? "lui"}. <Sparkles className="inline h-3 w-3" />
                      </p>
                    </div>
                  );
                })()}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}