import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ChevronRight, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tape, Pin, ScribbleUnderline } from "@/components/revix/AcademicDecor";

type CourseRow = { id: string; title: string; subject: string | null; emoji: string | null; created_at: string };

export default function Fiches() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("courses")
        .select("id, title, subject, emoji, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setCourses((data ?? []) as CourseRow[]);
      setLoading(false);
    })();
  }, [user]);

  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout>
      <PageHeader
        emoji="📚"
        title="Mes cours"
        subtitle={`${courses.length} cours`}
        action={
          <Button asChild size="sm" className="rounded-full gradient-primary border-0">
            <Link to="/app/upload"><Plus className="h-4 w-4" /></Link>
          </Button>
        }
      />

      <div className="px-5 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9 bg-muted/50 border-0" />
        </div>
      </div>

      {loading ? (
        <div className="px-5 text-sm text-muted-foreground">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="px-5 mt-10 text-center">
          <div className="notebook-card dog-ear p-6 max-w-xs mx-auto">
            <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="font-hand text-2xl mt-2">Cahier vide</p>
            <p className="text-sm text-muted-foreground mt-1">Crée ton premier cours pour commencer.</p>
            <Button asChild className="mt-4 rounded-full gradient-primary border-0">
              <Link to="/app/upload"><Plus className="h-4 w-4 mr-1" /> Nouveau cours</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-4 space-y-3 pb-4">
          {filtered.map((c, i) => {
            const tape = i % 3 === 0 ? "yellow" : i % 3 === 1 ? "pink" : "mint";
            const tilt = i % 2 === 0 ? "tilt-l" : "tilt-r";
            return (
              <Link
                key={c.id}
                to={`/app/fiches/${c.id}`}
                className={`block notebook-card dog-ear ${tilt} relative p-4 hover:shadow-glow transition-shadow`}
              >
                <Tape variant={tape as any} position={i % 2 === 0 ? "top-left" : "top-right"} />
                <div className="flex items-center gap-3">
                  <span className="text-3xl shrink-0">{c.emoji ?? "📘"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-lg leading-tight truncate">{c.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {c.subject && <span className="label-tape">{c.subject}</span>}
                      <span className="font-mono-tag text-[10px] uppercase text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}