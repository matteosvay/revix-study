import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ChevronRight, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type CourseRow = { id: string; title: string; subject: string | null; emoji: string | null; created_at: string; flashcard_count: number };

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
        .select("id, title, subject, emoji, created_at, flashcards(count)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setCourses((data ?? []).map((c: any) => ({ ...c, flashcard_count: c.flashcards?.[0]?.count ?? 0 })));
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
          <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/50" />
          <p className="font-serif text-xl mt-3">Pas encore de cours</p>
          <p className="text-sm text-muted-foreground mt-1">Crée ton premier cours pour commencer.</p>
          <Button asChild className="mt-5 rounded-full gradient-primary border-0">
            <Link to="/app/upload"><Plus className="h-4 w-4 mr-1" /> Nouveau cours</Link>
          </Button>
        </div>
      ) : (
        <div className="px-2">
          {filtered.map(c => (
            <Link key={c.id} to={`/app/fiches/${c.id}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg notion-row">
              <span className="text-2xl shrink-0">{c.emoji ?? "📘"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {c.subject ?? "—"} · {c.flashcard_count} fiches
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}