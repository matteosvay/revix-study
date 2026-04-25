import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flame, Trophy, Loader2, Users, GraduationCap, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Row = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  xp_week: number;
  xp_total: number;
  streak_days: number;
  is_me: boolean;
  school?: string | null;
  cursus?: string | null;
  username?: string | null;
};

const initialsOf = (n?: string | null) => (n ?? "U").split(" ").map(s => s[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();

function Podium({ rows }: { rows: Row[] }) {
  if (rows.length < 3) return null;
  const order = [1, 0, 2];
  const medals = ["🥇", "🥈", "🥉"];
  const heights = ["h-32", "h-24", "h-20"];
  const stamps = ["MAJOR", "MENTION TB", "MENTION B"];
  return (
    <div className="grid grid-cols-3 gap-2">
      {order.map((idx) => {
        const row = rows[idx];
        if (!row) return <div key={idx} />;
        return (
          <div key={row.id} className="flex flex-col items-center">
            <Avatar className={`${idx === 0 ? "h-14 w-14" : "h-10 w-10"} border-2 border-foreground mb-1`}>
              {row.avatar_url && <AvatarImage src={row.avatar_url} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{initialsOf(row.display_name)}</AvatarFallback>
            </Avatar>
            <p className="text-xs font-bold truncate max-w-full">{row.is_me ? "Toi" : row.display_name?.split(" ")[0] ?? "—"}</p>
            <div className={`${heights[idx]} w-full bg-secondary border-2 border-foreground rounded-t-md mt-1 flex flex-col items-center justify-end p-1`}>
              <p className="text-2xl">{medals[idx]}</p>
              <p className="font-mono text-[10px] font-bold">{row.xp_week} XP</p>
              <p className="text-[8px] font-bold uppercase tracking-wider mt-1">{stamps[idx]}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RowList({ rows, scopeLabel }: { rows: Row[]; scopeLabel: string }) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-8 px-4 bg-card border-2 border-dashed border-foreground rounded-md">
        <Trophy className="h-10 w-10 mx-auto text-muted-foreground" />
        <p className="font-display text-base mt-2">Classement vide</p>
        <p className="text-xs text-muted-foreground mt-1">{scopeLabel}</p>
      </div>
    );
  }
  const max = rows[0]?.xp_week || 1;
  return (
    <>
      <Podium rows={rows} />
      <div className="bg-card border-2 border-foreground rounded-md shadow-brutal-sm overflow-hidden">
        {rows.map((row, i) => {
          const pct = Math.max(2, Math.round((row.xp_week / max) * 100));
          return (
            <Link
              key={row.id}
              to={row.is_me ? "/app/profil" : `/app/u/${row.id}`}
              className={`flex items-center gap-2 p-2 border-b border-foreground/20 last:border-0 hover:bg-secondary/40 transition-colors ${row.is_me ? "bg-[hsl(var(--highlight-yellow))]/40" : ""}`}
            >
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
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function LeaderboardTabs({ initialScope = "amis" }: { initialScope?: string }) {
  const { user } = useAuth();
  const [scope, setScope] = useState(initialScope);
  const [data, setData] = useState<Record<string, Row[]>>({});
  const [loading, setLoading] = useState(false);
  const [profileScopes, setProfileScopes] = useState<{ school?: string | null; cursus?: string | null }>({});

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("school, cursus").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfileScopes(data ?? {}));
  }, [user]);

  useEffect(() => {
    if (!user || data[scope]) return;
    setLoading(true);
    const rpc =
      scope === "amis" ? "get_friends_leaderboard"
        : scope === "ecole" ? "get_school_leaderboard"
          : scope === "cursus" ? "get_cursus_leaderboard"
            : "get_global_leaderboard";
    supabase.rpc(rpc as any).then(({ data: rows }) => {
      setData((d) => ({ ...d, [scope]: (rows ?? []) as Row[] }));
      setLoading(false);
    });
  }, [scope, user, data]);

  const rows = data[scope] ?? [];
  const scopeLabel =
    scope === "amis" ? "Ajoute des amis pour les classer."
      : scope === "ecole" ? (profileScopes.school ? `Personne d'autre dans ${profileScopes.school}.` : "Renseigne ton école dans ton profil.")
        : scope === "cursus" ? (profileScopes.cursus ? `Personne d'autre en ${profileScopes.cursus}.` : "Renseigne ton cursus dans ton profil.")
          : "Sois le premier à grimper !";

  return (
    <Tabs value={scope} onValueChange={setScope} className="w-full">
      <TabsList className="w-full grid grid-cols-4 bg-card border-2 border-foreground rounded-md p-1 font-mono text-[10px] mb-4">
        <TabsTrigger value="amis" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm font-bold uppercase tracking-wider">
          <Users className="h-3 w-3 mr-1" />Amis
        </TabsTrigger>
        <TabsTrigger value="ecole" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm font-bold uppercase tracking-wider">
          <GraduationCap className="h-3 w-3 mr-1" />École
        </TabsTrigger>
        <TabsTrigger value="cursus" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm font-bold uppercase tracking-wider">
          🎓 Cursus
        </TabsTrigger>
        <TabsTrigger value="global" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm font-bold uppercase tracking-wider">
          <Globe className="h-3 w-3 mr-1" />Top
        </TabsTrigger>
      </TabsList>
      <TabsContent value={scope} className="space-y-4">
        {loading ? (
          <div className="text-center py-12"><Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" /></div>
        ) : (
          <RowList rows={rows} scopeLabel={scopeLabel} />
        )}
      </TabsContent>
    </Tabs>
  );
}