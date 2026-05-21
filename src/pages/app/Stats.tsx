import { useEffect, useState } from "react";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Layers, Brain, BookOpen, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

type Attempt = { score: number; total: number; created_at: string };
type SubjectStat = { subject: string; count: number; avg: number };

export default function Stats() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [subjects, setSubjects] = useState<SubjectStat[]>([]);
  const [flashTotal, setFlashTotal] = useState(0);
  const [flashDue, setFlashDue] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [
        { data: att },
        { count: ft },
        { count: fd },
        { count: tq },
        { count: tc },
        { data: courses },
      ] = await Promise.all([
        supabase.from("quiz_attempts").select("score, total, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
        supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", user.id).or(`due_at.is.null,due_at.lte.${today}`),
        supabase.from("quizzes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("courses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("courses").select("id, subject").eq("user_id", user.id),
      ]);

      setAttempts((att ?? []) as Attempt[]);
      setFlashTotal(ft ?? 0);
      setFlashDue(fd ?? 0);
      setTotalQuizzes(tq ?? 0);
      setTotalCourses(tc ?? 0);

      // Subject breakdown — needs quiz_attempts grouped by course subject
      if (courses?.length) {
        const courseMap = new Map<string, string>(); // course_id → subject
        (courses as { id: string; subject: string | null }[]).forEach(c => { if (c.subject) courseMap.set(c.id, c.subject); });

        const { data: quizzes } = await supabase
          .from("quizzes").select("id, course_id").eq("user_id", user.id);

        const quizMap = new Map<string, string>(); // quiz_id → subject
        (quizzes ?? []).forEach((q: any) => {
          const sub = q.course_id ? courseMap.get(q.course_id) : null;
          if (sub) quizMap.set(q.id, sub);
        });

        // Aggregate by subject from full attempts list
        const { data: allAtt } = await supabase
          .from("quiz_attempts").select("score, total, quiz_id").eq("user_id", user.id);

        const bySubject = new Map<string, { total: number; sum: number; count: number }>();
        (allAtt ?? []).forEach((a: any) => {
          const sub = quizMap.get(a.quiz_id);
          if (!sub) return;
          const cur = bySubject.get(sub) ?? { total: 0, sum: 0, count: 0 };
          cur.count++;
          cur.sum += (a.score / a.total) * 100;
          cur.total += a.total;
          bySubject.set(sub, cur);
        });

        const stats: SubjectStat[] = [...bySubject.entries()]
          .map(([subject, v]) => ({ subject, count: v.count, avg: Math.round(v.sum / v.count) }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);
        setSubjects(stats);
      }

      setLoading(false);
    })();
  }, [user]);

  const globalAvg = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / attempts.length)
    : 0;

  const chartAttempts = [...attempts].reverse().slice(-20);
  const maxPct = 100;

  if (loading) return <AppLayout><div className="p-5 text-sm text-muted-foreground">Chargement...</div></AppLayout>;

  return (
    <AppLayout>
      <PageHeader emoji="📊" title="Mes stats" subtitle="Progression & performance" />

      <div className="px-5 pb-8 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: BookOpen, label: "Cours", value: totalCourses },
            { icon: Brain, label: "Quizz", value: totalQuizzes },
            { icon: TrendingUp, label: "Moyenne", value: `${globalAvg}%` },
            { icon: Layers, label: "Flashcards", value: flashTotal },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border-2 border-foreground bg-card shadow-brutal-sm p-3 text-center">
              <Icon className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="font-serif text-2xl leading-none">{value}</p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-mono">{label}</p>
            </div>
          ))}
        </div>

        {/* Flashcards */}
        {flashTotal > 0 && (
          <Link to="/app/flashcards" className="block rounded-xl border-2 border-foreground bg-card shadow-brutal-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Flashcards SRS</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${flashDue > 0 ? "bg-primary/15 text-primary" : "bg-success/15 text-success"}`}>
                {flashDue > 0 ? `${flashDue} à réviser` : "Tout à jour ✓"}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-success transition-all" style={{ width: `${Math.round(((flashTotal - flashDue) / flashTotal) * 100)}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{flashTotal - flashDue} / {flashTotal} maîtrisées</p>
          </Link>
        )}

        {/* Score evolution chart */}
        {chartAttempts.length > 0 && (
          <div className="rounded-xl border-2 border-foreground bg-card shadow-brutal-sm p-4">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Évolution du score</p>
            <div className="flex items-end gap-1 h-24">
              {chartAttempts.map((a, i) => {
                const pct = Math.round((a.score / a.total) * 100);
                const h = Math.max(4, (pct / maxPct) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5" title={`${pct}% — ${new Date(a.created_at).toLocaleDateString("fr-FR")}`}>
                    <div
                      className="w-full rounded-t-sm transition-all"
                      style={{
                        height: `${h}%`,
                        background: pct >= 80 ? "hsl(var(--success))" : pct >= 50 ? "hsl(var(--primary))" : "hsl(var(--destructive))",
                        opacity: 0.75 + (i / chartAttempts.length) * 0.25,
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground font-mono">
              <span>Il y a {chartAttempts.length} quizz</span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-success inline-block" /> ≥80%</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-primary inline-block" /> ≥50%</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-destructive inline-block" /> &lt;50%</span>
              </div>
            </div>
          </div>
        )}

        {/* Par matière */}
        {subjects.length > 0 && (
          <div className="rounded-xl border-2 border-foreground bg-card shadow-brutal-sm p-4">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Performance par matière</p>
            <div className="space-y-2.5">
              {subjects.map(s => (
                <div key={s.subject}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold truncate flex-1 mr-2">{s.subject}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground font-mono">{s.count} quizz</span>
                      <span className={`text-xs font-bold ${s.avg >= 80 ? "text-success" : s.avg >= 50 ? "text-foreground" : "text-destructive"}`}>{s.avg}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${s.avg}%`, background: s.avg >= 80 ? "hsl(var(--success))" : s.avg >= 50 ? "hsl(var(--primary))" : "hsl(var(--destructive))" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {attempts.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <Brain className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="font-serif text-lg">Aucun quizz terminé</p>
            <p className="text-xs mt-1">Lance ton premier quizz pour voir ta progression ici.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
