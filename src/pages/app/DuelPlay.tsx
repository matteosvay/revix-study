import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Swords, Trophy, Wifi, WifiOff } from "lucide-react";

type Q = { id: string; position: number; question: string; answers: string[]; correct_index: number; explanation: string | null };
type Profile = { id: string; display_name: string | null; avatar_url: string | null };

const initials = (n?: string | null) => (n ?? "?").split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();

export default function DuelPlay() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const nav = useNavigate();
  const [duel, setDuel] = useState<any>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [waitingAccept, setWaitingAccept] = useState(false);
  const [opponentPresence, setOpponentPresence] = useState<{ ready: boolean; current_question: number; last_seen: string } | null>(null);

  const loadDuel = async () => {
    if (!id || !user) return;
    const [{ data: d }, { data: qs }, { data: mine }] = await Promise.all([
      supabase.from("duels").select("*").eq("id", id).maybeSingle(),
      supabase.rpc("get_duel_questions", { p_duel_id: id }),
      supabase.from("duel_attempts").select("*").eq("duel_id", id).eq("user_id", user.id).maybeSingle(),
    ]);
    setDuel(d);
    const mapped = (qs ?? []).map((r: any) => ({
      id: r.q_id, position: r.q_position, question: r.q_question,
      answers: r.q_answers, correct_index: -1, explanation: null,
    }));
    setQuestions(mapped as any);
    if (d && questions.length === 0) setTimeLeft(d.seconds_per_question ?? 30);
    if (mine) setDone(true);
    setWaitingAccept(d?.status === "pending");
    // Charger les profils des deux joueurs
    if (d) {
      const ids = [d.challenger_id, d.opponent_id];
      const profs = await Promise.all(ids.map((uid) =>
        supabase.rpc("get_public_profile", { p_user_id: uid }).then((r) => r.data?.[0])
      ));
      const map: Record<string, Profile> = {};
      profs.filter(Boolean).forEach((p: any) => { map[p.id] = p; });
      setProfiles(map);
    }
  };

  useEffect(() => { loadDuel(); }, [id, user]);

  // Realtime : statut, scores, et présence live de l'adversaire
  useEffect(() => {
    if (!id || !user) return;
    const loadPresence = async () => {
      const { data } = await supabase.from("duel_presence").select("*").eq("duel_id", id).neq("user_id", user.id).maybeSingle();
      setOpponentPresence(data as any);
    };
    loadPresence();
    const ch = supabase.channel(`duel:${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "duels", filter: `id=eq.${id}` }, () => loadDuel())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "duel_attempts", filter: `duel_id=eq.${id}` }, () => loadDuel())
      .on("postgres_changes", { event: "*", schema: "public", table: "duel_presence", filter: `duel_id=eq.${id}` }, () => loadPresence())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, user]);

  // Annonce ma présence + index de question actuel à chaque changement
  useEffect(() => {
    if (!id || !user || done || waitingAccept) return;
    supabase.rpc("set_duel_presence", { p_duel_id: id, p_ready: true, p_current_question: idx });
    const ping = setInterval(() => {
      supabase.rpc("set_duel_presence", { p_duel_id: id, p_ready: true, p_current_question: idx });
    }, 15000);
    return () => clearInterval(ping);
  }, [id, user, idx, done, waitingAccept]);

  useEffect(() => {
    if (done || !duel || selected !== null || waitingAccept) return;
    if (timeLeft <= 0) { handleConfirm(-1); return; }
    const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, selected, done, duel, waitingAccept]);

  const handleConfirm = async (chosen: number) => {
    setSelected(chosen);
    const next = [...answers, chosen];
    setAnswers(next);
    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        submit(next);
      } else {
        setIdx(idx + 1);
        setSelected(null);
        setTimeLeft(duel?.seconds_per_question ?? 30);
      }
    }, 1200);
  };

  const submit = async (finalAnswers: number[]) => {
    setSubmitting(true);
    // Score is recomputed server-side from stored correct answers; client value is ignored.
    const { data, error } = await supabase.rpc("submit_duel_attempt", {
      p_duel_id: id, p_answers: finalAnswers, p_score: 0,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
    await loadDuel();
  };

  if (!duel) {
    return <AppLayout><div className="p-5 text-sm text-muted-foreground">Chargement du duel...</div></AppLayout>;
  }

  // Lobby : duel encore "pending" — l'opposant n'a pas accepté
  if (waitingAccept && !done) {
    const opponent = profiles[duel.opponent_id];
    const challenger = profiles[duel.challenger_id];
    const isChall = duel.challenger_id === user?.id;
    const other = isChall ? opponent : challenger;
    return (
      <AppLayout>
        <PageHeader emoji="⚔️" title="Salle d'attente" />
        <div className="px-5 pt-8 pb-6 text-center space-y-4">
          <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
          <p className="font-display text-lg">
            En attente de <strong>{other?.display_name ?? "l'adversaire"}</strong>...
          </p>
          <p className="text-xs text-muted-foreground">
            {isChall ? "Le duel se lancera dès qu'il/elle aura accepté." : "Tu vas être redirigé(e) au démarrage."}
          </p>
          <Button variant="outline" onClick={() => nav("/app/campus")} className="rounded-md border-2 border-foreground">Retour Campus</Button>
        </div>
      </AppLayout>
    );
  }

  // Écran terminé — score perso + score adverse synchronisés en temps réel
  if (done) {
    const isChall = duel.challenger_id === user?.id;
    const myScore = isChall ? duel.challenger_score : duel.opponent_score;
    const otherScore = isChall ? duel.opponent_score : duel.challenger_score;
    const otherId = isChall ? duel.opponent_id : duel.challenger_id;
    const me = profiles[user!.id];
    const other = profiles[otherId];
    const isCompleted = duel.status === "completed";
    const won = isCompleted && duel.winner_id === user?.id;
    const tie = isCompleted && duel.winner_id === null;
    const lost = isCompleted && duel.winner_id && duel.winner_id !== user?.id;
    return (
      <AppLayout>
        <PageHeader emoji="⚔️" title="Duel terminé" />
        <div className="px-5 pt-6 pb-6 space-y-5">
          <div className="text-center">
            {isCompleted ? (
              <>
                <p className="text-5xl mb-2">{won ? "🏆" : tie ? "🤝" : "💔"}</p>
                <p className="font-display text-2xl">
                  {won ? "Victoire !" : tie ? "Égalité" : "Défaite"}
                </p>
              </>
            ) : (
              <>
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-2" />
                <p className="font-display text-lg">En attente de l'adversaire...</p>
                <p className="text-xs text-muted-foreground">Tes réponses sont enregistrées.</p>
              </>
            )}
          </div>

          {/* Tableau de scores côte-à-côte */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-4 rounded-md border-2 border-foreground shadow-brutal-sm text-center ${won ? "bg-success/20" : tie ? "bg-card" : "bg-card"}`}>
              <Avatar className="h-14 w-14 mx-auto border-2 border-foreground">
                {me?.avatar_url && <AvatarImage src={me.avatar_url} className="object-cover" />}
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">{initials(me?.display_name)}</AvatarFallback>
              </Avatar>
              <p className="text-xs font-bold mt-2">Toi</p>
              <p className="font-mono text-3xl font-bold mt-1">{myScore ?? "?"}</p>
              <p className="text-[10px] text-muted-foreground">/ {duel.num_questions}</p>
            </div>
            <div className={`p-4 rounded-md border-2 border-foreground shadow-brutal-sm text-center ${lost ? "bg-destructive/10" : "bg-card"}`}>
              <Avatar className="h-14 w-14 mx-auto border-2 border-foreground">
                {other?.avatar_url && <AvatarImage src={other.avatar_url} className="object-cover" />}
                <AvatarFallback className="bg-secondary text-foreground font-bold">{initials(other?.display_name)}</AvatarFallback>
              </Avatar>
              <p className="text-xs font-bold mt-2 truncate">{other?.display_name ?? "Adversaire"}</p>
              <p className="font-mono text-3xl font-bold mt-1">{otherScore ?? "—"}</p>
              <p className="text-[10px] text-muted-foreground">{otherScore == null ? "en cours..." : `/ ${duel.num_questions}`}</p>
            </div>
          </div>

          {isCompleted && (
            <div className="text-center text-xs text-muted-foreground">
              <Trophy className="h-3 w-3 inline mr-1" />
              {won ? "+100 XP" : tie ? "+60 XP chacun" : "+40 XP de consolation"}
            </div>
          )}

          <Button onClick={() => nav("/app/campus")} className="w-full rounded-md gradient-primary border-2 border-foreground font-bold">
            Retour au Campus
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (questions.length === 0) {
    return <AppLayout>
      <div className="p-5 text-sm text-muted-foreground">Chargement des questions...</div>
    </AppLayout>;
  }

  const q = questions[idx];
  const totalSecs = duel.seconds_per_question;

  return (
    <AppLayout>
      <div className="px-5 pt-5 pb-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="label-tape">Q{idx + 1}/{questions.length}</span>
          <span className="font-mono text-2xl font-bold">{timeLeft}s</span>
        </div>
        {opponentPresence && (
          <div className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            <Wifi className="h-3 w-3 text-success" />
            <span>Adversaire à la question {Math.min(opponentPresence.current_question + 1, questions.length)}</span>
            {opponentPresence.current_question > idx && <span className="text-accent font-bold">⚡ il/elle te devance !</span>}
          </div>
        )}
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden border-2 border-foreground">
          <div className="h-full bg-accent transition-all" style={{ width: `${(timeLeft / totalSecs) * 100}%` }} />
        </div>

        <div className="bg-card border-2 border-foreground rounded-md p-4 shadow-brutal">
          <p className="font-display text-base leading-snug">{q.question}</p>
        </div>

        <div className="space-y-2">
          {q.answers.map((a, i) => {
            const isSelected = selected === i;
            return (
              <button
                key={i}
                disabled={selected !== null}
                onClick={() => handleConfirm(i)}
                className={`w-full text-left p-3 rounded-md border-2 border-foreground font-medium text-sm transition-all
                  ${isSelected ? "bg-primary text-primary-foreground" : selected !== null ? "bg-card opacity-60" : "bg-card hover:shadow-brutal-sm"}`}
              >
                <span className="font-mono font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{a}
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <p className="text-center text-xs text-muted-foreground">
            Réponse enregistrée ✓ — la correction sera révélée à la fin du duel.
          </p>
        )}

        <div className="text-center pt-2">
          <Swords className="h-5 w-5 inline text-primary" /> <span className="text-xs font-bold uppercase tracking-wider">Duel en cours</span>
        </div>
        {submitting && <p className="text-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 inline animate-spin" /> Envoi...</p>}
      </div>
    </AppLayout>
  );
}