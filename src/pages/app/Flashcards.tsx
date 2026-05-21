import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { awardXp, bumpQuest } from "@/hooks/useGamification";
import { sm2, DEFAULT_EASE } from "@/lib/sm2";
import { toast } from "sonner";
import {
  BookOpen, Sparkles, RotateCcw, ChevronRight,
  CheckCircle2, XCircle, Minus, Trophy, ArrowLeft, Layers,
} from "lucide-react";

type Deck = {
  course_id: string;
  course_title: string;
  course_emoji: string;
  subject: string | null;
  total: number;
  due: number;
};

type Flashcard = {
  id: string;
  course_id: string;
  front: string;
  back: string;
  position: number;
  ease: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  due_at: string | null;
};

type Phase = "decks" | "session" | "end";

export default function Flashcards() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const [phase, setPhase] = useState<Phase>("decks");
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ known: 0, hard: 0, unknown: 0 });
  const [sessionXp, setSessionXp] = useState(0);

  const loadDecks = useCallback(async () => {
    if (!user) return;
    setLoadingDecks(true);
    try {
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, emoji, subject")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!courses?.length) { setDecks([]); return; }

      const deckList: Deck[] = [];
      for (const c of courses) {
        const { count: total } = await supabase
          .from("flashcards" as any)
          .select("id", { count: "exact", head: true })
          .eq("course_id", c.id)
          .eq("user_id", user.id);

        if (!total) continue;

        const today = new Date().toISOString().slice(0, 10);
        const { count: due } = await supabase
          .from("flashcards" as any)
          .select("id", { count: "exact", head: true })
          .eq("course_id", c.id)
          .eq("user_id", user.id)
          .or(`due_at.is.null,due_at.lte.${today}`);

        deckList.push({
          course_id: c.id,
          course_title: c.title,
          course_emoji: c.emoji ?? "📚",
          subject: c.subject,
          total: total ?? 0,
          due: due ?? 0,
        });
      }
      setDecks(deckList);
    } finally {
      setLoadingDecks(false);
    }
  }, [user]);

  useEffect(() => { loadDecks(); }, [loadDecks]);

  // Auto-start if ?deck=courseId in URL
  useEffect(() => {
    const deckId = searchParams.get("deck");
    if (deckId && decks.length > 0) {
      const d = decks.find(d => d.course_id === deckId);
      if (d) startSession(d);
    }
  }, [searchParams, decks]);

  const startSession = async (deck: Deck) => {
    if (!user) return;
    setActiveDeck(deck);
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("flashcards" as any)
      .select("*")
      .eq("course_id", deck.course_id)
      .eq("user_id", user.id)
      .or(`due_at.is.null,due_at.lte.${today}`)
      .order("position");

    if (!data?.length) {
      toast.info("Aucune carte due aujourd'hui pour ce deck !");
      return;
    }
    setCards(data as Flashcard[]);
    setIdx(0);
    setFlipped(false);
    setStats({ known: 0, hard: 0, unknown: 0 });
    setSessionXp(0);
    setPhase("session");
  };

  const grade = async (g: 0 | 2 | 4) => {
    if (!user || !cards[idx]) return;
    const card = cards[idx];

    const next = sm2({
      ease: card.ease ?? DEFAULT_EASE,
      intervalDays: card.interval_days ?? 0,
      repetitions: card.repetitions ?? 0,
      lapses: card.lapses ?? 0,
      grade: g,
    });

    // Persist SM-2 update
    await (supabase as any).from("flashcards").update({
      ease: next.ease,
      interval_days: next.intervalDays,
      repetitions: next.repetitions,
      lapses: next.lapses,
      due_at: next.dueAt,
      last_reviewed_at: new Date().toISOString(),
    }).eq("id", card.id);

    const xpEarned = g === 4 ? 5 : g === 2 ? 2 : 0;
    setSessionXp(prev => prev + xpEarned);
    setStats(prev => ({
      known:   prev.known   + (g === 4 ? 1 : 0),
      hard:    prev.hard    + (g === 2 ? 1 : 0),
      unknown: prev.unknown + (g === 0 ? 1 : 0),
    }));

    if (idx + 1 >= cards.length) {
      endSession(xpEarned);
    } else {
      setIdx(i => i + 1);
      setFlipped(false);
    }
  };

  const endSession = async (lastXp: number) => {
    if (!user) return;
    const totalXp = sessionXp + lastXp;
    if (totalXp > 0) {
      await awardXp(user.id, totalXp, "flashcard_session");
      await bumpQuest(user.id, "revision");
    }
    setPhase("end");
  };

  // ─── Decks list ───────────────────────────────────────────────────────────
  if (phase === "decks") {
    return (
      <AppLayout>
        <PageHeader title="Flashcards" subtitle="Répétition espacée SM-2" />
        <div className="p-4 max-w-2xl mx-auto space-y-4 pb-28">
          {loadingDecks ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 rounded-xl border-[2.5px] border-foreground bg-muted animate-pulse" />
              ))}
            </div>
          ) : decks.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="text-5xl">🃏</div>
              <p className="font-display text-2xl">Aucun deck disponible</p>
              <p className="text-muted-foreground text-sm">
                Ouvre un cours et génère des flashcards pour commencer.
              </p>
              <Button onClick={() => nav("/app/fiches")} className="gradient-primary border-0 rounded-full">
                Mes cours <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {decks.length} deck{decks.length > 1 ? "s" : ""}
              </p>
              {decks.map(deck => (
                <button
                  key={deck.course_id}
                  onClick={() => startSession(deck)}
                  className="w-full text-left border-[2.5px] border-foreground rounded-xl bg-card shadow-brutal hover:shadow-brutal-sm hover:translate-y-[2px] transition-all p-4 flex items-center gap-4"
                >
                  <div className="w-14 h-14 rounded-xl border-[2.5px] border-foreground bg-secondary flex items-center justify-center text-2xl shrink-0">
                    {deck.course_emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{deck.course_title}</p>
                    {deck.subject && (
                      <p className="text-xs text-muted-foreground">{deck.subject}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-mono-tag bg-muted px-2 py-0.5 rounded-full">
                        {deck.total} cartes
                      </span>
                      {deck.due > 0 && (
                        <span className="text-xs font-mono-tag bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                          {deck.due} à revoir
                        </span>
                      )}
                      {deck.due === 0 && (
                        <span className="text-xs font-mono-tag text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                          ✓ À jour
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </>
          )}
        </div>
      </AppLayout>
    );
  }

  // ─── Study session ─────────────────────────────────────────────────────────
  if (phase === "session" && cards[idx]) {
    const card = cards[idx];
    const progress = ((idx) / cards.length) * 100;

    return (
      <AppLayout>
        <div className="min-h-screen flex flex-col">
          {/* Top bar */}
          <div className="sticky top-0 z-10 bg-background border-b-[2.5px] border-foreground px-4 py-3 flex items-center gap-3">
            <button onClick={() => { setPhase("decks"); loadDecks(); }} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden border border-foreground/20">
                <div
                  className="h-full gradient-primary transition-all duration-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <span className="font-mono-tag text-xs text-muted-foreground tabular-nums">
              {idx + 1}/{cards.length}
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-4 pb-8 gap-6 max-w-xl mx-auto w-full">
            {/* Deck label */}
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {activeDeck?.course_emoji} {activeDeck?.course_title}
            </p>

            {/* Flip card */}
            <div
              className="w-full cursor-pointer"
              style={{ perspective: "1200px" }}
              onClick={() => setFlipped(f => !f)}
            >
              <div
                className="relative w-full transition-transform duration-500"
                style={{
                  transformStyle: "preserve-3d",
                  transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  minHeight: "280px",
                }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 border-[2.5px] border-foreground rounded-2xl bg-card shadow-brutal flex flex-col items-center justify-center p-6 text-center"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <Layers className="w-5 h-5 text-muted-foreground mb-3" />
                  <p className="font-display text-xl leading-tight">{card.front}</p>
                  <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Appuie pour révéler
                  </p>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 border-[2.5px] border-primary rounded-2xl bg-primary/5 shadow-brutal flex flex-col items-center justify-center p-6 text-center"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <Sparkles className="w-5 h-5 text-primary mb-3" />
                  <p className="font-display text-xl leading-tight">{card.front}</p>
                  <div className="w-full h-px bg-foreground/20 my-4" />
                  <p className="text-sm leading-relaxed text-foreground/90">{card.back}</p>
                </div>
              </div>
            </div>

            {/* Grade buttons — only visible after flip */}
            <div
              className={`w-full grid grid-cols-3 gap-3 transition-opacity duration-300 ${flipped ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <button
                onClick={() => grade(0)}
                className="flex flex-col items-center gap-1.5 border-[2.5px] border-foreground rounded-xl bg-card hover:bg-red-50 dark:hover:bg-red-950/20 p-3 shadow-brutal-sm hover:shadow-none hover:translate-y-[2px] transition-all"
              >
                <XCircle className="w-6 h-6 text-destructive" />
                <span className="text-xs font-bold">Je ne savais pas</span>
              </button>
              <button
                onClick={() => grade(2)}
                className="flex flex-col items-center gap-1.5 border-[2.5px] border-foreground rounded-xl bg-card hover:bg-amber-50 dark:hover:bg-amber-950/20 p-3 shadow-brutal-sm hover:shadow-none hover:translate-y-[2px] transition-all"
              >
                <Minus className="w-6 h-6 text-amber-500" />
                <span className="text-xs font-bold">Difficile</span>
              </button>
              <button
                onClick={() => grade(4)}
                className="flex flex-col items-center gap-1.5 border-[2.5px] border-foreground rounded-xl bg-card hover:bg-emerald-50 dark:hover:bg-emerald-950/20 p-3 shadow-brutal-sm hover:shadow-none hover:translate-y-[2px] transition-all"
              >
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <span className="text-xs font-bold">Je savais !</span>
              </button>
            </div>

            {!flipped && (
              <Button
                onClick={() => setFlipped(true)}
                className="gradient-primary border-0 rounded-full px-8"
              >
                Révéler la réponse
              </Button>
            )}
          </div>

          {/* Mini stats bar */}
          <div className="border-t-[2.5px] border-foreground bg-card px-6 py-3 flex justify-center gap-8 text-xs font-bold">
            <span className="text-emerald-500">✓ {stats.known}</span>
            <span className="text-amber-500">~ {stats.hard}</span>
            <span className="text-destructive">✗ {stats.unknown}</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ─── End of session ────────────────────────────────────────────────────────
  if (phase === "end") {
    const total = stats.known + stats.hard + stats.unknown;
    const pct = total > 0 ? Math.round((stats.known / total) * 100) : 0;
    const stamp =
      pct >= 80 ? { label: "Excellent !", emoji: "🏆", color: "text-yellow-500" }
      : pct >= 50 ? { label: "Bien joué !", emoji: "💪", color: "text-primary" }
      : { label: "Continue !", emoji: "📖", color: "text-muted-foreground" };

    return (
      <AppLayout>
        <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6 max-w-sm mx-auto">
          <div className={`text-6xl ${stamp.color}`}>{stamp.emoji}</div>
          <div className="text-center">
            <p className={`font-display text-3xl ${stamp.color}`}>{stamp.label}</p>
            <p className="text-muted-foreground text-sm mt-1">Session terminée</p>
          </div>

          {/* Score circle */}
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/30" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeLinecap="round"
                className="text-primary transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl">{pct}%</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">sus</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="w-full border-[2.5px] border-foreground rounded-xl bg-card shadow-brutal-sm overflow-hidden">
            {[
              { label: "Je savais", count: stats.known, color: "text-emerald-500", icon: "✓" },
              { label: "Difficile", count: stats.hard, color: "text-amber-500", icon: "~" },
              { label: "Je ne savais pas", count: stats.unknown, color: "text-destructive", icon: "✗" },
            ].map((row, i, arr) => (
              <div key={row.label} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? "border-b-[2px] border-foreground/10" : ""}`}>
                <span className={`font-bold text-sm ${row.color}`}>{row.icon} {row.label}</span>
                <span className="font-mono-tag text-sm font-bold">{row.count}</span>
              </div>
            ))}
          </div>

          {sessionXp > 0 && (
            <div className="flex items-center gap-2 text-sm font-bold text-primary">
              <Sparkles className="w-4 h-4" />
              +{sessionXp} XP gagnés
            </div>
          )}

          <div className="flex flex-col gap-3 w-full">
            <Button
              onClick={() => { setPhase("decks"); loadDecks(); }}
              className="gradient-primary border-0 rounded-full"
            >
              <Trophy className="w-4 h-4 mr-2" /> Retour aux decks
            </Button>
            <Button
              variant="outline"
              onClick={() => { if (activeDeck) startSession(activeDeck); }}
              className="rounded-full border-[2px] border-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Refaire le deck
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return null;
}
