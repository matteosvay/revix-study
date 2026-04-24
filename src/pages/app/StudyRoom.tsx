import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Play, Pause, SkipForward, LogOut, Send, Plus, Check, Copy } from "lucide-react";

type RoomMember = { id: string; user_id: string; status: string; last_seen: string };
type Msg = { id: string; user_id: string; content: string; is_system: boolean; created_at: string };
type Goal = { id: string; user_id: string; content: string; done: boolean };
type Profile = { id: string; display_name: string | null; avatar_url: string | null };

const PRESETS: Record<string, { focus: number; pause: number }> = {
  pomodoro_25_5: { focus: 25 * 60, pause: 5 * 60 },
  deep_50_10: { focus: 50 * 60, pause: 10 * 60 },
  sprint_15_3: { focus: 15 * 60, pause: 3 * 60 },
};

const initials = (n?: string | null) => (n ?? "?").split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();

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
    const [{ data: r }, { data: ms }, { data: msgs }, { data: gs }] = await Promise.all([
      supabase.from("study_rooms").select("*").eq("id", id).maybeSingle(),
      supabase.from("room_members").select("*").eq("room_id", id),
      supabase.from("room_messages").select("*").eq("room_id", id).order("created_at").limit(50),
      supabase.from("room_goals").select("*").eq("room_id", id),
    ]);
    setRoom(r);
    setMembers((ms ?? []) as any);
    setMessages((msgs ?? []) as any);
    setGoals((gs ?? []) as any);
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
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "study_rooms", filter: `id=eq.${id}` }, () => loadRoom())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

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
        try { await supabase.rpc("award_xp", { p_user_id: user!.id, p_amount: 50, p_reason: "room_all_goals" }); } catch {}
        toast.success("Tous tes objectifs ✓ +50 XP !");
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

        {/* Pomodoro */}
        <div className="bg-card border-2 border-foreground rounded-md p-5 shadow-brutal text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {room.timer_phase === "focus" ? "🍅 Focus" : room.timer_phase === "pause" ? "☕ Pause" : "⏸ Pause"}
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
      </div>
    </AppLayout>
  );
}