import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, Trash2, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type VN = {
  id: string;
  audio_path: string | null;
  transcript: string | null;
  duration_seconds: number | null;
  created_at: string;
};

export function VoiceNotes({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<VN[]>([]);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTsRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("voice_notes")
      .select("id, audio_path, transcript, duration_seconds, created_at")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });
    setNotes((data as any) ?? []);
  };

  useEffect(() => { load(); }, [user, courseId]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        await onStop();
      };
      rec.start();
      recRef.current = rec;
      startTsRef.current = Date.now();
      setRecording(true);
      setElapsed(0);
      tickRef.current = window.setInterval(() => setElapsed(Math.floor((Date.now() - startTsRef.current) / 1000)), 250);
    } catch {
      toast.error("Micro indisponible");
    }
  };

  const stop = () => {
    if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    setRecording(false);
  };

  const onStop = async () => {
    if (!user) return;
    setProcessing(true);
    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const duration = Math.max(1, Math.floor((Date.now() - startTsRef.current) / 1000));
      if (blob.size < 2000) { toast.error("Trop court"); return; }

      // Upload to storage
      const path = `${user.id}/${courseId}/${Date.now()}.webm`;
      const { error: upErr } = await supabase.storage.from("voice-notes").upload(path, blob, {
        contentType: "audio/webm", upsert: false,
      });
      if (upErr) throw upErr;

      // Transcribe
      const base64 = await blobToBase64(blob);
      let transcript = "";
      try {
        const { data, error } = await supabase.functions.invoke("transcribe-voice", {
          body: { audioBase64: base64, mimeType: "audio/webm" },
        });
        if (!error) transcript = data?.transcript ?? "";
      } catch { /* ignore — keep audio without transcript */ }

      const { error: insErr } = await supabase.from("voice_notes").insert({
        user_id: user.id, course_id: courseId,
        audio_path: path, transcript, duration_seconds: duration,
      });
      if (insErr) throw insErr;
      toast.success("Note vocale enregistrée");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setProcessing(false);
    }
  };

  const remove = async (n: VN) => {
    if (!confirm("Supprimer cette note ?")) return;
    if (n.audio_path) await supabase.storage.from("voice-notes").remove([n.audio_path]);
    await supabase.from("voice_notes").delete().eq("id", n.id);
    await load();
  };

  const playPause = async (n: VN) => {
    if (!n.audio_path) return;
    if (playingId === n.id && audioRef.current) {
      audioRef.current.pause(); setPlayingId(null); return;
    }
    const { data } = await supabase.storage.from("voice-notes").createSignedUrl(n.audio_path, 600);
    if (!data?.signedUrl) { toast.error("Audio introuvable"); return; }
    if (audioRef.current) audioRef.current.pause();
    const a = new Audio(data.signedUrl);
    a.onended = () => setPlayingId(null);
    audioRef.current = a;
    setPlayingId(n.id);
    a.play();
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="font-mono-tag text-[11px] uppercase tracking-wider text-muted-foreground">Notes vocales</p>
        {recording ? (
          <Button onClick={stop} size="sm" className="rounded-full bg-destructive text-destructive-foreground gap-2 animate-pulse">
            <Square className="h-3.5 w-3.5" /> Stop · {elapsed}s
          </Button>
        ) : (
          <Button onClick={start} disabled={processing} size="sm" className="rounded-full gradient-primary border-0 gap-2">
            {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />}
            {processing ? "Transcription..." : "Enregistrer"}
          </Button>
        )}
      </div>

      {notes.length === 0 ? (
        <p className="text-xs text-muted-foreground italic px-1">Aucune note vocale. Enregistre-toi pour réviser à l'oral.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="notebook-card p-3">
              <div className="flex items-start gap-2">
                <button
                  onClick={() => playPause(n)}
                  className="h-9 w-9 rounded-full gradient-primary text-primary-foreground flex items-center justify-center shrink-0"
                >
                  {playingId === n.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-mono-tag uppercase text-muted-foreground">{n.duration_seconds ?? 0}s · {new Date(n.created_at).toLocaleDateString("fr-FR")}</p>
                    <button onClick={() => remove(n)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {n.transcript && <p className="font-hand text-base mt-1 leading-snug">{n.transcript}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      resolve(res.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}