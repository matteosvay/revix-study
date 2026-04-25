import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, Folder, BookOpen, Flame, Loader2, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type MasteryRow = {
  course_id: string;
  course_title: string;
  course_emoji: string | null;
  chapter: string;
  total_questions: number;
  reviewed_questions: number;
  mastered_questions: number;
  due_today: number;
  mastery_pct: number;
};

type CourseMeta = {
  id: string;
  subject: string | null;
  source_content: string | null;
};

function colorFor(pct: number) {
  if (pct >= 80) return "bg-success text-success-foreground";
  if (pct >= 50) return "bg-primary/70 text-primary-foreground";
  if (pct >= 20) return "bg-amber-400/80 text-foreground";
  return "bg-destructive/70 text-destructive-foreground";
}

function avg(rows: MasteryRow[]) {
  if (!rows.length) return 0;
  const totalQ = rows.reduce((s, r) => s + r.total_questions, 0);
  const totalM = rows.reduce((s, r) => s + r.mastered_questions, 0);
  if (!totalQ) return 0;
  return Math.round((100 * totalM) / totalQ);
}

export function RevisionExplorer() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<MasteryRow[]>([]);
  const [meta, setMeta] = useState<Record<string, CourseMeta>>({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"subject" | "course" | "chapter">("subject");
  const [selSubject, setSelSubject] = useState<string | null>(null);
  const [selCourse, setSelCourse] = useState<string | null>(null);
  const [bossLoading, setBossLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: m }, { data: c }] = await Promise.all([
        supabase.rpc("get_global_chapter_mastery"),
        supabase.from("courses").select("id,subject,source_content").eq("user_id", user.id),
      ]);
      setRows((m as any) ?? []);
      const map: Record<string, CourseMeta> = {};
      (c ?? []).forEach((x: any) => { map[x.id] = x; });
      setMeta(map);
      setLoading(false);
    })();
  }, [user]);

  // Group rows by subject
  const subjects = useMemo(() => {
    const groups: Record<string, MasteryRow[]> = {};
    rows.forEach(r => {
      const subj = meta[r.course_id]?.subject?.trim() || "Sans matière";
      (groups[subj] ||= []).push(r);
    });
    return Object.entries(groups)
      .map(([subject, items]) => ({
        subject,
        items,
        courseCount: new Set(items.map(i => i.course_id)).size,
        mastery: avg(items),
        due: items.reduce((s, r) => s + r.due_today, 0),
      }))
      .sort((a, b) => a.mastery - b.mastery);
  }, [rows, meta]);

  const coursesInSubject = useMemo(() => {
    if (!selSubject) return [];
    const inSubject = rows.filter(r => (meta[r.course_id]?.subject?.trim() || "Sans matière") === selSubject);
    const byCourse: Record<string, MasteryRow[]> = {};
    inSubject.forEach(r => { (byCourse[r.course_id] ||= []).push(r); });
    return Object.entries(byCourse).map(([course_id, items]) => ({
      course_id,
      title: items[0].course_title,
      emoji: items[0].course_emoji,
      mastery: avg(items),
      due: items.reduce((s, r) => s + r.due_today, 0),
      chapters: items.length,
    })).sort((a, b) => a.mastery - b.mastery);
  }, [rows, meta, selSubject]);

  const chaptersInCourse = useMemo(() => {
    if (!selCourse) return [];
    return rows.filter(r => r.course_id === selCourse).sort((a, b) => a.mastery_pct - b.mastery_pct);
  }, [rows, selCourse]);

  const launchBoss = async (row: MasteryRow) => {
    if (!user) return;
    const c = meta[row.course_id];
    if (!c?.source_content) { toast.error("Contenu source indisponible"); return; }
    const key = row.course_id + row.chapter;
    setBossLoading(key);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: {
          content: c.source_content, subject: c.subject, title: row.course_title,
          count: 15, quizType: "qcm", chapter: row.chapter, chapters: [row.chapter],
        },
      });
      if (error) throw error;
      const qs = data?.questions ?? [];
      if (!qs.length) throw new Error("Aucune question générée");
      const { data: quiz, error: qErr } = await supabase.from("quizzes").insert({
        user_id: user.id, course_id: row.course_id,
        title: `👹 Boss · ${row.chapter}`, quiz_type: "qcm",
      }).select().single();
      if (qErr) throw qErr;
      await supabase.from("quiz_questions").insert(qs.map((q: any, i: number) => ({
        quiz_id: quiz.id, user_id: user.id, question: q.question,
        type: q.type ?? "qcm", answers: q.answers ?? null,
        correct_index: typeof q.correct_index === "number" ? q.correct_index : null,
        accepted_answers: q.accepted_answers ?? null,
        explanation: q.explanation, position: i, chapter: row.chapter,
      })));
      toast.success("👹 Boss prêt !");
      nav(`/app/quizz?id=${quiz.id}`);
    } catch (e: any) { toast.error(e?.message ?? "Erreur"); }
    finally { setBossLoading(null); }
  };

  if (loading) return <div className="text-xs text-muted-foreground px-1">Chargement de ta progression…</div>;
  if (!rows.length) return (
    <div className="text-center text-sm text-muted-foreground px-2">
      Termine quelques quizz pour voir ta progression par chapitre apparaître ici.
    </div>
  );

  // Breadcrumb / back
  const Breadcrumb = () => (
    <div className="flex items-center gap-2 mb-3 text-xs">
      <button
        onClick={() => { setView("subject"); setSelSubject(null); setSelCourse(null); }}
        className={`font-mono-tag uppercase tracking-wider ${view === "subject" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
      >Matières</button>
      {selSubject && (
        <>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <button
            onClick={() => { setView("course"); setSelCourse(null); }}
            className={`font-serif truncate max-w-[120px] ${view === "course" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
          >{selSubject}</button>
        </>
      )}
      {selCourse && (
        <>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="font-serif text-primary font-bold truncate max-w-[120px]">
            {chaptersInCourse[0]?.course_title ?? "Cours"}
          </span>
        </>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 px-1">
        <Flame className="h-4 w-4 text-primary" />
        <p className="font-mono-tag text-[11px] uppercase tracking-wider text-muted-foreground">
          Maîtrise par chapitre
        </p>
      </div>
      <Breadcrumb />

      {view === "subject" && (
        <div className="space-y-2 animate-fade-in">
          {subjects.map((s) => (
            <button
              key={s.subject}
              onClick={() => { setSelSubject(s.subject); setView("course"); }}
              className="w-full notebook-card p-3 text-left hover:shadow-glow transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Folder className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-base truncate">{s.subject}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {s.courseCount} cours · {s.items.length} chapitres
                    {s.due > 0 && <> · <span className="text-primary font-medium">{s.due} à réviser</span></>}
                  </p>
                </div>
                <span className={`font-mono-tag text-[10px] px-2 py-0.5 rounded-full font-bold ${colorFor(s.mastery)}`}>
                  {s.mastery}%
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${colorFor(s.mastery).split(" ")[0]} transition-all`} style={{ width: `${s.mastery}%` }} />
              </div>
            </button>
          ))}
        </div>
      )}

      {view === "course" && (
        <div className="space-y-2 animate-fade-in">
          {coursesInSubject.map((c) => (
            <button
              key={c.course_id}
              onClick={() => { setSelCourse(c.course_id); setView("chapter"); }}
              className="w-full notebook-card p-3 text-left hover:shadow-glow transition-shadow"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl shrink-0">{c.emoji ?? "📘"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-base truncate">{c.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {c.chapters} chapitres
                    {c.due > 0 && <> · <span className="text-primary font-medium">{c.due} à réviser</span></>}
                  </p>
                </div>
                <span className={`font-mono-tag text-[10px] px-2 py-0.5 rounded-full font-bold ${colorFor(c.mastery)}`}>
                  {c.mastery}%
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${colorFor(c.mastery).split(" ")[0]} transition-all`} style={{ width: `${c.mastery}%` }} />
              </div>
            </button>
          ))}
        </div>
      )}

      {view === "chapter" && (
        <div className="space-y-2 animate-fade-in">
          {chaptersInCourse.map((d) => {
            const key = d.course_id + d.chapter;
            return (
              <div key={key} className="notebook-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm truncate">{d.chapter}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {d.mastered_questions}/{d.total_questions} maîtrisées
                      {d.due_today > 0 && <> · <span className="text-primary font-medium">{d.due_today} à réviser</span></>}
                    </p>
                  </div>
                  <span className={`font-mono-tag text-[10px] px-2 py-0.5 rounded-full font-bold ${colorFor(d.mastery_pct)}`}>
                    {d.mastery_pct}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${colorFor(d.mastery_pct).split(" ")[0]} transition-all`} style={{ width: `${d.mastery_pct}%` }} />
                </div>
                {meta[d.course_id]?.source_content && (
                  <Button
                    onClick={() => launchBoss(d)}
                    disabled={bossLoading === key}
                    size="sm"
                    variant="outline"
                    className="w-full mt-2.5 rounded-full text-xs h-8"
                  >
                    {bossLoading === key
                      ? <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Préparation…</>
                      : <><Trophy className="h-3 w-3 mr-1.5" /> Quiz boss · ce chapitre</>}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}