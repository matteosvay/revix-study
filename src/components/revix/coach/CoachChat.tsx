import { useEffect, useRef, useState } from "react";
import { Bot, Bookmark, CalendarPlus, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { awardXp, bumpQuest } from "@/hooks/useGamification";
import { CoachContext } from "@/lib/coachContext";
import { StudyPlan, StudyPlanCard } from "./StudyPlanCard";
import { localDateKey } from "@/lib/date";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  plan?: StudyPlan;
  created_at: string;
};

const SUGGESTIONS = [
  { label: "📅 Fais-moi un planning", text: "Fais-moi un planning de révision pour les 5 prochains jours.", isPlan: true },
  { label: "😰 J'ai un exam demain", text: "J'ai un exam demain, qu'est-ce que je fais ?", isPlan: false },
  { label: "🧠 Je comprends rien à ce cours", text: "Je comprends rien à mon cours, comment je fais ?", isPlan: false },
  { label: "🔥 Motive-moi", text: "J'ai pas envie de réviser, motive-moi !", isPlan: false },
];

const MOCK_HISTORY: Msg[] = [
  { id: "m1", role: "user", content: "Comment je révise le marketing mix efficacement ?", created_at: new Date().toISOString() },
  { id: "m2", role: "assistant", content: "Le mix marketing (4P) c'est du par cœur pur. Fiche par P, puis restitution à blanc le lendemain. Ton quizz Revix est parfait pour ça — lance-le après ce soir. 🎯", created_at: new Date().toISOString() },
  { id: "m3", role: "user", content: "Et si j'ai la flemme ?", created_at: new Date().toISOString() },
  { id: "m4", role: "assistant", content: "Commence par 5 min. Juste 5. Le cerveau déteste commencer, pas continuer. Lance le timer et après t'arrêtes si tu veux — spoiler: tu t'arrêteras pas.", created_at: new Date().toISOString() },
];

function todayKey() { return localDateKey(new Date()); }

export function CoachChat({ ctx }: { ctx: CoachContext | null }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("coach_messages")
        .select("id, role, content, metadata, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(20);
      const history = (data ?? []).map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        plan: m.metadata?.plan,
        created_at: m.created_at,
      })) as Msg[];
      if (history.length) {
        setMessages(history);
      } else {
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: "Salut ! Je suis ton coach Revix 👋 Pose-moi une question sur tes révisions, demande un planning, ou dis-moi comment tu te sens. Je suis là pour t'aider.",
          created_at: new Date().toISOString(),
        }]);
      }
      setHydrated(true);
    })();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const persistMsg = async (m: Omit<Msg, "id" | "created_at">) => {
    if (!user) return;
    const { data } = await supabase
      .from("coach_messages")
      .insert({
        user_id: user.id,
        role: m.role,
        content: m.content,
        metadata: m.plan ? { plan: m.plan } : null,
      })
      .select("id, created_at")
      .single();
    return data;
  };

  const send = async (text: string, isPlan = false) => {
    if (!user || !text.trim() || loading) return;
    const userMsg: Msg = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((ms) => [...ms, userMsg]);
    setInput("");
    setLoading(true);

    persistMsg({ role: "user", content: userMsg.content });

    // XP cap: 3/day for chat questions
    try {
      const { count } = await supabase
        .from("coach_messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("role", "user")
        .gte("created_at", `${todayKey()}T00:00:00.000Z`);
      if ((count ?? 0) <= 3) {
        await awardXp(user.id, 5, "coach:question");
      }
      await bumpQuest(user.id, "coach_question", 1);
    } catch { /* non-bloquant */ }

    try {
      const startDate = todayKey();
      const { data, error } = await supabase.functions.invoke("coach-chat", {
        body: {
          messages: [...messages, userMsg].slice(-10).map((m) => ({ role: m.role, content: m.content })),
          mode: isPlan ? "plan" : "chat",
          context: ctx
            ? {
                cursus: ctx.cursus,
                weakSubjects: ctx.weakSubjects,
                nextExam: ctx.nextExam,
                streak: ctx.streak,
                currentTime: ctx.currentTime,
                startDate,
                durationDays: 5,
              }
            : undefined,
        },
      });
      if (error) throw error;

      if (data?.type === "plan" && data.plan) {
        const aiMsg: Msg = {
          id: `tmp-${Date.now() + 1}`,
          role: "assistant",
          content: data.plan.coach_note ?? "Voici ton plan 👇",
          plan: data.plan,
          created_at: new Date().toISOString(),
        };
        setMessages((ms) => [...ms, aiMsg]);
        persistMsg({ role: "assistant", content: aiMsg.content, plan: data.plan });
        await awardXp(user.id, 30, "coach:plan_generated");
      } else {
        const aiMsg: Msg = {
          id: `tmp-${Date.now() + 1}`,
          role: "assistant",
          content: data?.reply ?? "Hmm…",
          created_at: new Date().toISOString(),
        };
        setMessages((ms) => [...ms, aiMsg]);
        persistMsg({ role: "assistant", content: aiMsg.content });
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur du coach");
    } finally {
      setLoading(false);
    }
  };

  const saveTip = async (content: string) => {
    if (!user) return;
    const { error } = await supabase.from("coach_saved_tips").insert({
      user_id: user.id,
      content,
      source: "coach",
    });
    if (error) return toast.error(error.message);
    await awardXp(user.id, 10, "coach:tip_saved");
    toast.success("Conseil sauvegardé 🔖");
  };

  const addToPlanning = async (content: string) => {
    if (!user) return;
    const { error } = await supabase.from("planning_tasks").insert({
      user_id: user.id,
      task_date: todayKey(),
      subject: "Conseil coach",
      title: content.slice(0, 80),
    });
    if (error) return toast.error(error.message);
    await bumpQuest(user.id, "task_added", 1);
    toast.success("Ajouté au planning du jour 📅");
  };

  return (
    <div className="notebook-card p-3">
      <p className="font-hand text-xl text-foreground mb-2">💬 Pose ta question à Revix</p>

      <div ref={scrollRef} className="max-h-[340px] overflow-y-auto space-y-2.5 pr-1 mb-3">
        {!hydrated && (
          <div className="text-xs text-muted-foreground italic px-2">Chargement…</div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "user" ? (
              <div className="label-tape !rotate-0 !text-xs !normal-case !tracking-normal label-tape-blue max-w-[80%] !py-1.5 !px-3" style={{ borderRadius: 10 }}>
                {m.content}
              </div>
            ) : (
              <div className="max-w-[88%]">
                <div className="postit p-2.5 rounded-md text-sm text-foreground/90" style={{ transform: "rotate(-0.5deg)", fontFamily: "inherit" }}>
                  <div className="flex items-start gap-2">
                    <Bot className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="leading-snug">{m.content}</p>
                  </div>
                </div>
                {m.plan && <StudyPlanCard plan={m.plan} />}
                {!m.plan && (
                  <div className="flex gap-1.5 mt-1.5 ml-2">
                    <button
                      onClick={() => addToPlanning(m.content)}
                      className="postit !rounded text-[10px] px-2 py-1 hover:opacity-80"
                      style={{ transform: "rotate(-2deg)", fontFamily: "inherit" }}
                    >
                      <CalendarPlus className="h-2.5 w-2.5 inline mr-1" /> Au planning
                    </button>
                    <button
                      onClick={() => saveTip(m.content)}
                      className="postit postit-pink !rounded text-[10px] px-2 py-1 hover:opacity-80"
                      style={{ transform: "rotate(2deg)", fontFamily: "inherit" }}
                    >
                      <Bookmark className="h-2.5 w-2.5 inline mr-1" /> Sauver
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="postit p-2.5 rounded-md text-sm" style={{ fontFamily: "inherit" }}>
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => send(s.text, s.isPlan)}
            disabled={loading}
            className="label-tape !text-[10px] !rotate-0 hover:opacity-80 disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-end gap-2 border-t border-dashed border-border pt-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex: Comment réviser le droit en 3 jours ?"
          disabled={loading}
          className="flex-1 bg-transparent border-0 border-b border-foreground/20 focus:border-primary outline-none text-sm py-1.5 placeholder:text-foreground/40 placeholder:italic"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="stamp hover:scale-105 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : <>Envoyer <Send className="h-3 w-3 inline ml-0.5" /></>}
        </button>
      </form>
    </div>
  );
}