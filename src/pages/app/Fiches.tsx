import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ChevronRight, BookOpen, Trash2, Loader2, Send, Hash, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tape, Pin, ScribbleUnderline } from "@/components/revix/AcademicDecor";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SendCourseDialog } from "@/components/revix/SendCourseDialog";

type SummarySection = { title?: string; blocks?: any[] };
type SummaryData = { intro?: string; sections?: SummarySection[] } | null;
type CourseRow = {
  id: string; title: string; subject: string | null; emoji: string | null;
  created_at: string; summary: SummaryData;
};

// Extracts plain text from a summary block of any kind for keyword search.
function blockText(b: any): string {
  if (!b) return "";
  if (typeof b.text === "string") return b.text;
  if (b.kind === "definition") return `${b.term ?? ""} ${b.text ?? ""}`;
  if (b.kind === "list" && Array.isArray(b.items)) return b.items.join(" ");
  return "";
}

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const PAGE_SIZE = 12;

export default function Fiches() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<CourseRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toShare, setToShare] = useState<CourseRow | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("courses")
        .select("id, title, subject, emoji, created_at, summary")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setCourses((data ?? []) as CourseRow[]);
      setLoading(false);
    })();
  }, [user]);

  const subjects = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const c of courses) {
      if (c.subject && !seen.has(c.subject)) { seen.add(c.subject); out.push(c.subject); }
    }
    return out.sort();
  }, [courses]);

  const filtered = useMemo(() => {
    const q = norm(search.trim());
    return courses
      .filter(c => !subjectFilter || c.subject === subjectFilter)
      .map(c => {
        const titleMatch = !q || norm(c.title).includes(q) || norm(c.subject ?? "").includes(q);
        const sections = c.summary?.sections ?? [];
        const chapterHits: string[] = [];
        if (q) {
          for (const s of sections) {
            const title = s.title ?? "";
            const body = (s.blocks ?? []).map(blockText).join(" ");
            if (norm(title).includes(q) || norm(body).includes(q)) {
              if (title) chapterHits.push(title);
            }
          }
        }
        if (!q || titleMatch || chapterHits.length) {
          return { course: c, chapters: chapterHits.slice(0, 4), titleMatch };
        }
        return null;
      })
      .filter((r): r is { course: CourseRow; chapters: string[]; titleMatch: boolean } => !!r);
  }, [courses, search, subjectFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const results = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const applyFilter = (s: string | null) => { setSubjectFilter(s); setPage(1); };
  const applySearch = (v: string) => { setSearch(v); setPage(1); };

  const removeCourse = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const { error } = await supabase.from("courses").delete().eq("id", toDelete.id);
    setDeleting(false);
    if (error) { toast.error("Suppression impossible"); return; }
    setCourses(prev => prev.filter(c => c.id !== toDelete.id));
    toast.success("Cours supprimé");
    setToDelete(null);
  };

  return (
    <AppLayout>
      <PageHeader
        emoji="📚"
        title="Mes cours"
        subtitle={subjectFilter ? `${filtered.length} cours · ${subjectFilter}` : `${courses.length} cours`}
        action={
          <Button asChild size="sm" className="rounded-full gradient-primary border-0">
            <Link to="/app/upload"><Plus className="h-4 w-4" /></Link>
          </Button>
        }
      />

      <div className="px-5 mb-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => applySearch(e.target.value)}
            placeholder="Rechercher un cours, chapitre ou mot-clé…"
            className="pl-9 pr-9 bg-muted/50 border-0"
          />
          {search && (
            <button
              onClick={() => applySearch("")}
              aria-label="Effacer la recherche"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {subjects.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => applyFilter(null)}
              className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold transition ${!subjectFilter ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground"}`}
            >
              Tous
            </button>
            {subjects.map(s => (
              <button
                key={s}
                onClick={() => applyFilter(subjectFilter === s ? null : s)}
                className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold transition ${subjectFilter === s ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground"}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {(search.trim() || subjectFilter) && (
          <p className="text-[11px] text-muted-foreground px-1 font-mono-tag uppercase tracking-wider">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {loading ? (
        <div className="px-5 text-sm text-muted-foreground">Chargement...</div>
      ) : results.length === 0 ? (
        <div className="px-5 mt-10 text-center">
          <div className="notebook-card dog-ear p-6 max-w-xs mx-auto">
            <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/50" />
            {search.trim() ? (
              <>
                <p className="font-hand text-2xl mt-2">Aucun résultat</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Rien ne correspond à « {search} ».
                </p>
                <Button onClick={() => setSearch("")} variant="outline" className="mt-4 rounded-full">
                  Effacer la recherche
                </Button>
              </>
            ) : (
              <>
                <p className="font-hand text-2xl mt-2">Cahier vide</p>
                <p className="text-sm text-muted-foreground mt-1">Crée ton premier cours pour commencer.</p>
                <Button asChild className="mt-4 rounded-full gradient-primary border-0">
                  <Link to="/app/upload"><Plus className="h-4 w-4 mr-1" /> Nouveau cours</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="px-4 space-y-3 stagger-in">
          {results.map((r, i) => {
            const c = r.course;
            const tape = i % 3 === 0 ? "yellow" : i % 3 === 1 ? "pink" : "mint";
            const tilt = i % 2 === 0 ? "tilt-l" : "tilt-r";
            return (
              <div key={c.id} className={`notebook-card dog-ear ${tilt} relative hover:shadow-glow transition-shadow`}>
                <Tape variant={tape as any} position={i % 2 === 0 ? "top-left" : "top-right"} />
                <div className="flex items-center gap-3 p-4">
                  <Link to={`/app/fiches/${c.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-3xl shrink-0">{c.emoji ?? "📘"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-lg leading-tight truncate">{c.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {c.subject && <span className="label-tape">{c.subject}</span>}
                        <span className="font-mono-tag text-[10px] uppercase text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      {r.chapters.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {r.chapters.map((ch, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[10.5px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 max-w-[180px]"
                            >
                              <Hash className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{ch}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setToShare(c); }}
                    className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition shrink-0"
                    aria-label="Envoyer à un ami"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setToDelete(c); }}
                    className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition shrink-0"
                    aria-label="Supprimer le cours"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 w-8 rounded-lg border-2 border-foreground flex items-center justify-center font-bold text-sm disabled:opacity-30 shadow-brutal-sm tap-press"
              >
                ‹
              </button>
              <span className="text-sm font-mono font-semibold px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 w-8 rounded-lg border-2 border-foreground flex items-center justify-center font-bold text-sm disabled:opacity-30 shadow-brutal-sm tap-press"
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce cours ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {toDelete?.title} » et tous les quizz / révisions liés seront supprimés. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={removeCourse} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Suppression…</> : <>Supprimer</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {toShare && (
        <SendCourseDialog
          open={!!toShare}
          onOpenChange={(o) => !o && setToShare(null)}
          courseId={toShare.id}
          courseTitle={toShare.title}
        />
      )}
    </AppLayout>
  );
}