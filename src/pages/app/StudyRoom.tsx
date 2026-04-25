import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Play, Pause, SkipForward, LogOut, Send, Plus, Check, Copy, BookOpen, Sparkles, X, Download, StickyNote, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type RoomMember = { id: string; user_id: string; status: string; last_seen: string };
type Msg = { id: string; user_id: string; content: string; is_system: boolean; created_at: string };
type Goal = { id: string; user_id: string; content: string; done: boolean };
type Profile = { id: string; display_name: string | null; avatar_url: string | null };
type SharedCourse = { id: string; room_id: string; course_id: string; shared_by: string; created_at: string };
type CourseInfo = { id: string; title: string; emoji: string | null; subject: string | null; summary: any; user_id: string };
type WhiteboardNote = { id: string; room_id: string; user_id: string; content: string; color: string; created_at: string };
type MyCourse = { id: string; title: string; emoji: string | null };

const PRESETS: Record<string, { focus: number; pause: number }> = {
  pomodoro_25_5: { focus: 25 * 60, pause: 5 * 60 },
  deep_50_10: { focus: 50 * 60, pause: 10 * 60 },
  sprint_15_3: { focus: 15 * 60, pause: 3 * 60 },
};

const initials = (n?: string | null) => (n ?? "?").split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();

const NOTE_COLORS = ["yellow", "mint", "pink", "blue"] as const;
const noteColorClass: Record<string, string> = {
  yellow: "bg-yellow-200 dark:bg-yellow-900/50",
  mint: "bg-emerald-200 dark:bg-emerald-900/50",
  pink: "bg-pink-200 dark:bg-pink-900/50",
  blue: "bg-sky-200 dark:bg-sky-900/50",
};

function summaryToText(summary: any): string {
  if (!summary) return "";
  if (typeof summary === "string") return summary;
  try {
    if (Array.isArray(summary)) {
      return summary.map((s) => (typeof s === "string" ? s : s?.content ?? s?.text ?? "")).filter(Boolean).join("\n\n");
    }
    if (typeof summary === "object") {
      if (summary.text) return String(summary.text);
      if (Array.isArray(summary.sections)) {
        return summary.sections
          .map((sec: any) => `${sec.title ? `## ${sec.title}\n` : ""}${sec.content ?? sec.text ?? ""}`)
          .join("\n\n");
      }
      return JSON.stringify(summary, null, 2);
    }
  } catch { /* ignore */ }
  return String(summary);
}

export default function StudyRoom() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const nav = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [messages, setMessages] = useState<Msg[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [now, setNow] = useState(Date.now());
  const msgEndRef = useRef<HTMLDivElement>(null);

  // Fiches partagées
  const [sharedCourses, setSharedCourses] = useState<SharedCourse[]>([]);
  const [courseInfos, setCourseInfos] = useState<Record<string, CourseInfo>>({});
  const [openCourseId, setOpenCourseId] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [myCourses, setMyCourses] = useState<MyCourse[]>([]);
  const [allFichesOpen, setAllFichesOpen] = useState(false);

  // Coach IA sur sélection
  const [selection, setSelection] = useState("");
  const [askingAI, setAskingAI] = useState(false);

  // Whiteboard
  const [notes, setNotes] = useState<WhiteboardNote[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [noteColor, setNoteColor] = useState<string>("yellow");

  // Tick every second for timer display
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadRoom = async () => {
    if (!id) return;
    const { data: r } = await supabase.from("study_rooms").select("*").eq("id", id).maybeSingle();
    setRoom(r);
  };

  const loadAll = async () => {
    if (!id) return;
    const [{ data: r }, { data: ms }, { data: msgs }, { data: gs }, { data: sc }, { data: nts }] = await Promise.all([
      supabase.from("study_rooms").select("*").eq("id", id).maybeSingle(),
      supabase.from("room_members").select("*").eq("room_id", id),
      supabase.from("room_messages").select("*").eq("room_id", id).order("created_at").limit(50),
      supabase.from("room_goals").select("*").eq("room_id", id),
      supabase.from("room_shared_courses").select("*").eq("room_id", id).order("created_at"),
      supabase.from("room_whiteboard").select("*").eq("room_id", id).order("created_at", { ascending: false }).limit(40),
    ]);
    setRoom(r);
    setMembers((ms ?? []) as any);
    setMessages((msgs ?? []) as any);
    setGoals((gs ?? []) as any);
    setSharedCourses((sc ?? []) as any);
    setNotes((nts ?? []) as any);

    // Charge les infos des cours partagés
    const courseIds = Array.from(new Set((sc ?? []).map((s: any) => s.course_id)));
    if (courseIds.length) {
      const { data: cs } = await supabase
        .from("courses")
        .select("id, title, emoji, subject, summary, user_id")
        .in("id", courseIds);
      const cmap: Record<string, CourseInfo> = {};
      (cs ?? []).forEach((c: any) => { cmap[c.id] = c; });
      setCourseInfos(cmap);
    } else {
      setCourseInfos({});
    }

    const ids = Array.from(new Set((ms ?? []).map((m: any) => m.user_id)));
    if (ids.length) {
      const profs = await Promise.all(ids.map(uid => supabase.rpc("get_public_profile", { p_user_id: uid }).then(r => r.data?.[0])));
      const map: Record<string, Profile> = {};
      profs.filter(Boolean).forEach((p: any) => { map[p.id] = p; });
      setProfiles(map);
    }
  };

  useEffect(() => {
    loadAll();
    if (!id) return;
    const ch = supabase.channel(`room:${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${id}` }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_messages", filter: `room_id=eq.${id}` }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_goals", filter: `room_id=eq.${id}` }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_shared_courses", filter: `room_id=eq.${id}` }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_whiteboard", filter: `room_id=eq.${id}` }, () => loadAll())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "study_rooms", filter: `id=eq.${id}` }, () => loadRoom())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  // Heartbeat de présence : met à jour last_seen toutes les 20s pour signaler qu'on est toujours là
  useEffect(() => {
    if (!id || !user) return;
    const beat = async () => {
      await supabase.from("room_members")
        .update({ last_seen: new Date().toISOString() })
        .eq("room_id", id)
        .eq("user_id", user.id);
    };
    beat();
    const t = setInterval(beat, 20000);
    return () => clearInterval(t);
  }, [id, user]);

  if (!room) return <AppLayout><div className="p-5 text-sm">Chargement de la salle...</div></AppLayout>;

  const isHost = room.host_id === user?.id;
  const preset = PRESETS[room.timer_preset] ?? PRESETS.pomodoro_25_5;
  const phaseLength = (room.timer_phase === "pause" ? preset.pause : preset.focus);
  const elapsed = room.timer_started_at ? Math.floor((now - new Date(room.timer_started_at).getTime()) / 1000) : 0;
  const remaining = room.timer_phase === "idle" ? phaseLength : Math.max(0, phaseLength - elapsed);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const startTimer = async () => {
    await supabase.from("study_rooms").update({
      timer_phase: "focus", timer_started_at: new Date().toISOString(),
    }).eq("id", room.id);
  };
  const pauseTimer = async () => {
    await supabase.from("study_rooms").update({ timer_phase: "idle", timer_started_at: null }).eq("id", room.id);
  };
  const skipPhase = async () => {
    const next = room.timer_phase === "focus" ? "pause" : "focus";
    await supabase.from("study_rooms").update({ timer_phase: next, timer_started_at: new Date().toISOString() }).eq("id", room.id);
  };

  const sendMsg = async () => {
    const c = msgInput.trim();
    if (!c || !user) return;
    const { error } = await supabase.from("room_messages").insert({ room_id: room.id, user_id: user.id, content: c.slice(0, 120) });
    if (error) toast.error(error.message);
    setMsgInput("");
  };

  const addGoal = async () => {
    const c = goalInput.trim();
    if (!c || !user) return;
    const { error } = await supabase.from("room_goals").insert({ room_id: room.id, user_id: user.id, content: c.slice(0, 100) });
    if (error) toast.error(error.message);
    setGoalInput("");
  };

  const toggleGoal = async (g: Goal) => {
    if (g.user_id !== user?.id) return;
    const { error } = await supabase.from("room_goals").update({ done: !g.done }).eq("id", g.id);
    if (error) toast.error(error.message);
    if (!g.done) {
      const myGoals = goals.filter(x => x.user_id === user?.id);
      const allDone = myGoals.every(x => x.id === g.id ? true : x.done);
      if (allDone && myGoals.length > 0) {
        toast.success("Tous tes objectifs ✓ Bien joué !");
      }
    }
  };

  const leaveRoom = async () => {
    if (!user) return;
    if (!confirm("Quitter la salle ?")) return;
    await supabase.from("room_members").delete().eq("room_id", room.id).eq("user_id", user.id);
    nav("/app/campus");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(room.invite_code);
    toast.success(`Code ${room.invite_code} copié !`);
  };

  // -------- Fiches partagées --------
  const openShareDialog = async () => {
    if (!user) return;
    const { data } = await supabase.from("courses").select("id, title, emoji").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    setMyCourses((data ?? []) as MyCourse[]);
    setShareDialogOpen(true);
  };

  const shareCourse = async (courseId: string) => {
    if (!user) return;
    const { error } = await supabase.from("room_shared_courses").insert({ room_id: room.id, course_id: courseId, shared_by: user.id });
    if (error) {
      if (error.code === "23505") toast.info("Cette fiche est déjà partagée.");
      else toast.error(error.message);
      return;
    }
    toast.success("Fiche partagée 📤");
    setShareDialogOpen(false);
  };

  const unshareCourse = async (sharedId: string) => {
    const { error } = await supabase.from("room_shared_courses").delete().eq("id", sharedId);
    if (error) toast.error(error.message);
  };

  const saveCourseToMine = async (courseId: string) => {
    if (!user) return;
    const original = courseInfos[courseId];
    if (!original) return;
    if (original.user_id === user.id) {
      toast.info("C'est déjà ta fiche !");
      return;
    }
    const { error } = await supabase.from("courses").insert({
      user_id: user.id,
      title: `${original.title} (partagé)`,
      emoji: original.emoji ?? "📘",
      subject: original.subject,
      summary: original.summary,
    });
    if (error) toast.error(error.message);
    else toast.success("Sauvegardée dans tes cours ✅");
  };

  const askCoach = async () => {
    const sel = selection.trim();
    if (!sel || !openCourseId || askingAI) return;
    setAskingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("room-explain", {
        body: { room_id: room.id, course_id: openCourseId, selection: sel },
      });
      if (error) throw error;
      if (data?.error === "rate_limited") toast.error("Trop de requêtes, réessaie dans un instant.");
      else if (data?.error === "credits_exhausted") toast.error("Crédits IA épuisés.");
      else if (data?.error) toast.error("Erreur du coach IA.");
      else {
        toast.success("Le coach a répondu dans le chat 💬");
        setSelection("");
        setOpenCourseId(null);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setAskingAI(false);
    }
  };

  // -------- Whiteboard --------
  const addNote = async () => {
    const c = noteInput.trim();
    if (!c || !user) return;
    const { error } = await supabase.from("room_whiteboard").insert({
      room_id: room.id, user_id: user.id, content: c.slice(0, 120), color: noteColor,
    });
    if (error) toast.error(error.message);
    setNoteInput("");
  };

  const removeNote = async (n: WhiteboardNote) => {
    const { error } = await supabase.from("room_whiteboard").delete().eq("id", n.id);
    if (error) toast.error(error.message);
  };

  const openCourse = courseInfos[openCourseId ?? ""];
  const openCourseSummary = openCourse ? summaryToText(openCourse.summary) : "";

  return (
    <AppLayout>
      <PageHeader emoji="📚" title={room.name} action={
        <Button variant="ghost" size="sm" onClick={leaveRoom} className="text-destructive font-bold text-xs h-8">
          <LogOut className="h-3 w-3 mr-1" /> Quitter
        </Button>
      } />
      <div className="px-5 pb-6 space-y-4">

        {/* Code invitation */}
        <button onClick={copyCode} className="w-full bg-muted border-2 border-dashed border-foreground rounded-md p-2 text-center font-mono text-sm font-bold flex items-center justify-center gap-2">
          <Copy className="h-3 w-3" /> Code : {room.invite_code}
        </button>

        {/* Bouton Fiches partagées (accès rapide) */}
        <Button
          onClick={() => setAllFichesOpen(true)}
          variant="outline"
          className="w-full border-2 border-foreground font-bold flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Fiches partagées
          </span>
          <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-black">
            {sharedCourses.length}
          </span>
        </Button>

        {/* Pomodoro */}
        <div className="bg-card border-2 border-foreground rounded-md p-5 shadow-brutal text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {room.timer_phase === "focus" ? "🍅 Focus" : room.timer_phase === "pause" ? "☕ Pause" : "⏸ En attente"}
          </p>
          <p className="font-hand text-6xl leading-none">{mm}:{ss}</p>
          {isHost && (
            <div className="flex gap-2 justify-center mt-4">
              {room.timer_phase === "idle" ? (
                <Button onClick={startTimer} size="sm" className="rounded-md gradient-primary border-2 border-foreground font-bold">
                  <Play className="h-3 w-3 mr-1" /> Démarrer
                </Button>
              ) : (
                <Button onClick={pauseTimer} size="sm" variant="outline" className="rounded-md border-2 border-foreground font-bold">
                  <Pause className="h-3 w-3 mr-1" /> Stop
                </Button>
              )}
              <Button onClick={skipPhase} size="sm" variant="outline" className="rounded-md border-2 border-foreground font-bold">
                <SkipForward className="h-3 w-3 mr-1" /> Suivant
              </Button>
            </div>
          )}
        </div>

        {/* Membres */}
        <div>
          <div className="label-tape inline-block mb-2">DANS LA SALLE ({members.length}/{room.max_members})</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {members.map(m => {
              const p = profiles[m.user_id];
              return (
                <div key={m.id} className="flex flex-col items-center min-w-[60px]">
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-foreground">
                      {p?.avatar_url && <AvatarImage src={p.avatar_url} />}
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{initials(p?.display_name)}</AvatarFallback>
                    </Avatar>
                    <span className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-card ${
                      m.status === "focus" ? "bg-success" : m.status === "pause" ? "bg-accent" : "bg-muted-foreground"
                    }`} />
                  </div>
                  <p className="text-[9px] font-bold mt-1 truncate max-w-[60px]">
                    {m.user_id === user?.id ? "Toi" : p?.display_name?.split(" ")[0] ?? "?"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Objectifs */}
        <div>
          <div className="label-tape label-tape-mint inline-block mb-2">📊 OBJECTIFS DU SOIR</div>
          <div className="bg-card border-2 border-foreground rounded-md p-3 space-y-2">
            {goals.length === 0 && <p className="text-xs text-muted-foreground italic">Personne n'a posé d'objectif. Lance-toi !</p>}
            {goals.map(g => {
              const p = profiles[g.user_id];
              const mine = g.user_id === user?.id;
              return (
                <div key={g.id} className="flex items-center gap-2 text-sm">
                  <button
                    onClick={() => toggleGoal(g)}
                    disabled={!mine}
                    className={`h-5 w-5 rounded border-2 border-foreground shrink-0 flex items-center justify-center
                      ${g.done ? "bg-success" : "bg-card"} ${mine ? "cursor-pointer" : "cursor-default opacity-70"}`}
                  >
                    {g.done && <Check className="h-3 w-3 text-success-foreground" />}
                  </button>
                  <span className={`flex-1 text-xs ${g.done ? "line-through text-muted-foreground" : ""}`}>
                    <span className="font-bold">{p?.display_name?.split(" ")[0] ?? "?"} :</span> {g.content}
                  </span>
                </div>
              );
            })}
            <div className="flex gap-2 pt-2 border-t border-foreground/10">
              <Input
                value={goalInput} onChange={(e) => setGoalInput(e.target.value.slice(0, 100))}
                placeholder="Ton objectif..."
                onKeyDown={(e) => e.key === "Enter" && addGoal()}
                className="text-xs h-8"
              />
              <Button onClick={addGoal} size="icon" className="h-8 w-8 gradient-primary border-2 border-foreground"><Plus className="h-4 w-4" /></Button>
            </div>
            {goals.length > 0 && (
              <div className="pt-2">
                <p className="text-[10px] text-muted-foreground font-bold">{goals.filter(g => g.done).length}/{goals.length} objectifs atteints 🎯</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat minimaliste */}
        <div>
          <div className="label-tape label-tape-violet inline-block mb-2">💬 CHAT</div>
          <div className="bg-card border-2 border-foreground rounded-md p-3">
            <div className="space-y-1.5 max-h-48 overflow-y-auto mb-2">
              {messages.length === 0 && <p className="text-xs text-muted-foreground italic">Reste focus 🎯</p>}
              {messages.slice(-8).map(m => {
                const p = profiles[m.user_id];
                const mine = m.user_id === user?.id;
                if (m.is_system) {
                  return (
                    <div key={m.id} className="text-xs bg-accent/15 border-l-2 border-accent rounded px-2 py-1 whitespace-pre-wrap">
                      {m.content}
                    </div>
                  );
                }
                return (
                  <div key={m.id} className={`text-xs ${mine ? "text-right" : ""}`}>
                    <span className="font-bold">{mine ? "Toi" : p?.display_name?.split(" ")[0] ?? "?"} :</span> <span className={`inline-block px-2 py-0.5 rounded ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{m.content}</span>
                  </div>
                );
              })}
              <div ref={msgEndRef} />
            </div>
            <div className="flex gap-2 pt-2 border-t border-foreground/10">
              <Input
                value={msgInput} onChange={(e) => setMsgInput(e.target.value.slice(0, 120))}
                placeholder="Un message rapide... reste focus 🎯"
                onKeyDown={(e) => e.key === "Enter" && sendMsg()}
                className="text-xs h-8"
              />
              <Button onClick={sendMsg} size="icon" className="h-8 w-8 gradient-primary border-2 border-foreground"><Send className="h-4 w-4" /></Button>
            </div>
            <p className="text-[9px] text-right text-muted-foreground mt-1">{msgInput.length}/120</p>
          </div>
        </div>

        {/* Fiches partagées */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="label-tape label-tape-mint inline-block">📚 FICHES PARTAGÉES</div>
            <Button onClick={openShareDialog} size="sm" variant="outline" className="h-7 text-[10px]">
              <Plus className="h-3 w-3 mr-1" /> Partager
            </Button>
          </div>
          <div className="bg-card border-2 border-foreground rounded-md p-3 space-y-2">
            {sharedCourses.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Aucune fiche partagée. Lance le bal 📤</p>
            )}
            {sharedCourses.map(sc => {
              const c = courseInfos[sc.course_id];
              if (!c) return null;
              const sharedByMe = sc.shared_by === user?.id;
              const sharer = profiles[sc.shared_by];
              return (
                <div key={sc.id} className="flex items-center gap-2 p-2 rounded border border-foreground/10 bg-muted/30">
                  <button onClick={() => { setOpenCourseId(c.id); setSelection(""); }} className="flex items-center gap-2 flex-1 text-left min-w-0">
                    <span className="text-xl shrink-0">{c.emoji ?? "📘"}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{c.title}</p>
                      <p className="text-[9px] text-muted-foreground">par {sharedByMe ? "toi" : sharer?.display_name?.split(" ")[0] ?? "?"}</p>
                    </div>
                  </button>
                  {!sharedByMe && (
                    <Button onClick={() => saveCourseToMine(c.id)} size="icon" variant="ghost" className="h-7 w-7" title="Sauvegarder dans mes cours">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {sharedByMe && (
                    <Button onClick={() => unshareCourse(sc.id)} size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Retirer">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tableau blanc collaboratif */}
        <div>
          <div className="label-tape inline-block mb-2">🧠 TABLEAU BLANC</div>
          <div className="bg-card border-2 border-foreground rounded-md p-3 space-y-2">
            <p className="text-[10px] text-muted-foreground">Brainstormez ensemble : mots-clés, idées, formules…</p>
            <div className="flex flex-wrap gap-2 min-h-[60px]">
              {notes.length === 0 && <p className="text-xs text-muted-foreground italic">Encore vide. Lance une idée ✏️</p>}
              {notes.map(n => {
                const p = profiles[n.user_id];
                const mine = n.user_id === user?.id;
                return (
                  <div
                    key={n.id}
                    className={`group relative ${noteColorClass[n.color] ?? noteColorClass.yellow} border-2 border-foreground rounded-md px-2 py-1.5 max-w-[180px] shadow-brutal-sm`}
                  >
                    <p className="text-xs font-bold leading-tight whitespace-pre-wrap break-words">{n.content}</p>
                    <p className="text-[8px] text-foreground/60 mt-1">— {mine ? "toi" : p?.display_name?.split(" ")[0] ?? "?"}</p>
                    <button
                      onClick={() => removeNote(n)}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      title="Supprimer"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 pt-2 border-t border-foreground/10">
              <div className="flex gap-1">
                {NOTE_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNoteColor(c)}
                    className={`h-6 w-6 rounded border-2 ${noteColorClass[c]} ${noteColor === c ? "border-foreground" : "border-foreground/20"}`}
                    aria-label={c}
                  />
                ))}
              </div>
              <Input
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value.slice(0, 120))}
                placeholder="Une idée, un mot-clé..."
                onKeyDown={(e) => e.key === "Enter" && addNote()}
                className="text-xs h-8 flex-1"
              />
              <Button onClick={addNote} size="icon" className="h-8 w-8 gradient-primary border-2 border-foreground"><StickyNote className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog : choisir une fiche à partager */}
      {/* Dialog : toutes les fiches partagées avec résumés */}
      <Dialog open={allFichesOpen} onOpenChange={setAllFichesOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Fiches partagées dans la salle
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {sharedCourses.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground italic mb-3">Aucune fiche partagée pour l'instant.</p>
                <Button onClick={() => { setAllFichesOpen(false); openShareDialog(); }} size="sm" className="gradient-primary">
                  <Plus className="h-4 w-4 mr-1" /> Partager une fiche
                </Button>
              </div>
            )}
            {sharedCourses.map((sc) => {
              const c = courseInfos[sc.course_id];
              if (!c) return null;
              const sharedByMe = sc.shared_by === user?.id;
              const sharer = profiles[sc.shared_by];
              const summaryText = summaryToText(c.summary);
              return (
                <div key={sc.id} className="border-2 border-foreground rounded-md bg-card overflow-hidden">
                  <div className="flex items-center gap-2 p-3 bg-muted/40 border-b border-foreground/10">
                    <span className="text-2xl">{c.emoji ?? "📘"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{c.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Partagé par {sharedByMe ? "toi" : sharer?.display_name?.split(" ")[0] ?? "un membre"}
                        {c.subject && ` · ${c.subject}`}
                      </p>
                    </div>
                    {!sharedByMe ? (
                      <Button onClick={() => saveCourseToMine(c.id)} size="sm" variant="outline" className="text-[10px] h-8">
                        <Download className="h-3 w-3 mr-1" /> Sauvegarder
                      </Button>
                    ) : (
                      <Button onClick={() => unshareCourse(sc.id)} size="sm" variant="ghost" className="text-destructive text-[10px] h-8">
                        <X className="h-3 w-3 mr-1" /> Retirer
                      </Button>
                    )}
                  </div>
                  <div className="p-3 max-h-60 overflow-y-auto bg-muted/10">
                    {summaryText ? (
                      <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed">{summaryText}</pre>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Pas de résumé pour cette fiche.</p>
                    )}
                  </div>
                  <div className="p-2 border-t border-foreground/10 flex justify-end">
                    <Button
                      onClick={() => { setAllFichesOpen(false); setOpenCourseId(c.id); setSelection(""); }}
                      size="sm" variant="ghost" className="text-[10px] h-7"
                    >
                      <Sparkles className="h-3 w-3 mr-1" /> Approfondir avec l'IA
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          {sharedCourses.length > 0 && (
            <div className="border-t pt-3 flex justify-end">
              <Button onClick={() => { setAllFichesOpen(false); openShareDialog(); }} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" /> Partager une autre fiche
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog : choisir une fiche à partager */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Partager une fiche</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {myCourses.length === 0 && <p className="text-sm text-muted-foreground">Tu n'as pas encore de fiche. Crées-en une depuis "Mes cours" 📚</p>}
            {myCourses.map(c => (
              <button
                key={c.id}
                onClick={() => shareCourse(c.id)}
                className="w-full flex items-center gap-3 p-3 rounded border-2 border-foreground/10 hover:border-foreground hover:bg-muted text-left"
              >
                <span className="text-2xl">{c.emoji ?? "📘"}</span>
                <span className="text-sm font-bold flex-1 truncate">{c.title}</span>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog : voir une fiche partagée + sélection coach IA */}
      <Dialog open={!!openCourseId} onOpenChange={(o) => { if (!o) { setOpenCourseId(null); setSelection(""); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{openCourse?.emoji ?? "📘"}</span>
              <span>{openCourse?.title ?? "Fiche"}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-muted/30 rounded p-3 text-sm whitespace-pre-wrap font-mono">
            {openCourseSummary || <span className="text-muted-foreground italic">Cette fiche n'a pas encore de résumé.</span>}
          </div>
          <div className="space-y-2 border-t pt-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Demander au coach IA
            </p>
            <p className="text-[10px] text-muted-foreground">Colle/écris un point précis à approfondir. La réponse sera postée dans le chat pour toute la salle.</p>
            <Textarea
              value={selection}
              onChange={(e) => setSelection(e.target.value.slice(0, 800))}
              placeholder="Ex: Explique-moi ce passage / cette formule..."
              className="min-h-[60px] text-sm"
            />
            <div className="flex gap-2 justify-between items-center">
              <span className="text-[10px] text-muted-foreground">{selection.length}/800</span>
              <div className="flex gap-2">
                {openCourse && openCourse.user_id !== user?.id && (
                  <Button onClick={() => saveCourseToMine(openCourse.id)} variant="outline" size="sm">
                    <Download className="h-3.5 w-3.5 mr-1" /> Sauvegarder
                  </Button>
                )}
                <Button onClick={askCoach} disabled={!selection.trim() || askingAI} size="sm" className="gradient-primary">
                  {askingAI ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                  Approfondir
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}