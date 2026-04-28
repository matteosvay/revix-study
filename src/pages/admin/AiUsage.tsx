import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert, ArrowLeft, TrendingUp, Users, Zap, DollarSign } from "lucide-react";

// Coût approximatif Claude Haiku 4.5 ($/1M tokens) — utilisé seulement pour estimation
// On n'a pas le détail tokens par appel donc on estime via une moyenne par action
const COST_PER_CALL_USD: Record<string, number> = {
  fiche: 0.012,        // ~3K input + 1K output
  quiz_ia: 0.004,
  coach: 0.002,
  planning: 0.003,
  oral: 0.002,
  explanation: 0.002,
  default: 0.003,
};

interface UsageRow {
  user_id: string;
  action_type: string;
  count: number;
  created_at: string;
  period_key: string;
  period_type: string;
}

interface DayBucket {
  day: string;
  total: number;
  byAction: Record<string, number>;
}

export default function AiUsage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();
  const [days, setDays] = useState(7);
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    supabase
      .from("usage_counters")
      .select("user_id, action_type, count, created_at, period_key, period_type")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000)
      .then(({ data, error }) => {
        if (!error && data) setRows(data as UsageRow[]);
        setLoading(false);
      });
  }, [isAdmin, days]);

  const stats = useMemo(() => {
    const totalCalls = rows.reduce((s, r) => s + r.count, 0);
    const uniqueUsers = new Set(rows.map((r) => r.user_id)).size;
    const byAction: Record<string, number> = {};
    let totalCost = 0;
    for (const r of rows) {
      byAction[r.action_type] = (byAction[r.action_type] ?? 0) + r.count;
      totalCost += r.count * (COST_PER_CALL_USD[r.action_type] ?? COST_PER_CALL_USD.default);
    }

    // Top users
    const userTotals: Record<string, number> = {};
    for (const r of rows) userTotals[r.user_id] = (userTotals[r.user_id] ?? 0) + r.count;
    const topUsers = Object.entries(userTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // By day
    const dayMap: Record<string, DayBucket> = {};
    for (const r of rows) {
      const day = r.created_at.slice(0, 10);
      if (!dayMap[day]) dayMap[day] = { day, total: 0, byAction: {} };
      dayMap[day].total += r.count;
      dayMap[day].byAction[r.action_type] = (dayMap[day].byAction[r.action_type] ?? 0) + r.count;
    }
    const byDay = Object.values(dayMap).sort((a, b) => a.day.localeCompare(b.day));

    return { totalCalls, uniqueUsers, byAction, totalCost, topUsers, byDay };
  }, [rows]);

  const maxDay = Math.max(1, ...stats.byDay.map((d) => d.total));

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-background">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-black">Accès refusé</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Cette page est réservée aux administrateurs.
        </p>
        <Button onClick={() => navigate("/app")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour à l'app
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/app")} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-1" /> Retour
            </Button>
            <h1 className="text-3xl font-black">📊 Suivi IA Claude</h1>
            <p className="text-muted-foreground text-sm">
              Consommation des appels IA et estimation des coûts
            </p>
          </div>
          <div className="flex gap-2">
            {[1, 7, 30].map((d) => (
              <Button
                key={d}
                variant={days === d ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(d)}
              >
                {d === 1 ? "24h" : `${d}j`}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={<Zap />} label="Appels IA" value={stats.totalCalls.toLocaleString("fr")} />
              <StatCard icon={<Users />} label="Utilisateurs actifs" value={stats.uniqueUsers.toString()} />
              <StatCard
                icon={<DollarSign />}
                label="Coût estimé"
                value={`$${stats.totalCost.toFixed(2)}`}
              />
              <StatCard
                icon={<TrendingUp />}
                label="Moy./user"
                value={
                  stats.uniqueUsers
                    ? (stats.totalCalls / stats.uniqueUsers).toFixed(1)
                    : "0"
                }
              />
            </div>

            {/* Activité par jour */}
            <Card className="p-4 border-2 border-foreground">
              <h2 className="font-black text-lg mb-3">📈 Activité par jour</h2>
              {stats.byDay.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune activité</p>
              ) : (
                <div className="space-y-2">
                  {stats.byDay.map((d) => (
                    <div key={d.day} className="flex items-center gap-3">
                      <div className="text-xs font-mono w-20 text-muted-foreground">
                        {d.day.slice(5)}
                      </div>
                      <div className="flex-1 bg-muted rounded h-6 overflow-hidden border border-foreground/20">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(d.total / maxDay) * 100}%` }}
                        />
                      </div>
                      <div className="text-sm font-bold w-12 text-right">{d.total}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Répartition par action */}
            <Card className="p-4 border-2 border-foreground">
              <h2 className="font-black text-lg mb-3">⚡ Par type d'action</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(stats.byAction)
                  .sort((a, b) => b[1] - a[1])
                  .map(([action, count]) => {
                    const cost = count * (COST_PER_CALL_USD[action] ?? COST_PER_CALL_USD.default);
                    return (
                      <div
                        key={action}
                        className="flex items-center justify-between p-3 bg-muted rounded border border-foreground/10"
                      >
                        <div>
                          <Badge variant="secondary" className="font-bold">
                            {action}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            ~${cost.toFixed(3)}
                          </div>
                        </div>
                        <div className="text-2xl font-black">{count}</div>
                      </div>
                    );
                  })}
              </div>
            </Card>

            {/* Top users */}
            <Card className="p-4 border-2 border-foreground">
              <h2 className="font-black text-lg mb-3">🔥 Top consommateurs</h2>
              {stats.topUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun utilisateur</p>
              ) : (
                <div className="space-y-1">
                  {stats.topUsers.map(([uid, count], i) => (
                    <div
                      key={uid}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black w-6 text-muted-foreground">
                          #{i + 1}
                        </span>
                        <code className="text-xs">{uid.slice(0, 8)}…</code>
                      </div>
                      <div className="font-bold">{count} appels</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <p className="text-xs text-muted-foreground text-center pt-4">
              💡 Pour les chiffres exacts (tokens, $) : <a href="https://console.anthropic.com/settings/usage" target="_blank" rel="noopener noreferrer" className="underline">console.anthropic.com</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4 border-2 border-foreground">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <div className="h-4 w-4">{icon}</div>
        <span className="text-xs font-bold uppercase">{label}</span>
      </div>
      <div className="text-2xl font-black">{value}</div>
    </Card>
  );
}
