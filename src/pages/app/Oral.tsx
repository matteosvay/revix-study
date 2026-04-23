import { useEffect, useRef, useState } from "react";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Mic, Square, Loader2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Web Speech API recognition
type SpeechRec = any;

export default function Oral() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<{ id: string; title: string; source_content: string | null }[]>([]);
  const [courseId, setCourseId] = useState<string>("");
  const [topic, setTopic] = useState("");
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any | null>(null);
  const recRef = useRef<SpeechRec | null>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const r = new SR();
    r.lang = "fr-FR"; r.continuous = true; r.interimResults = true;
    r.onresult = (e: any) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript + " ";
      setTranscript(txt.trim());
    };
    r.onerror = (e: any) => { console.error(e); toast.error("Erreur micro"); setRecording(false); };
    r.onend = () => setRecording(false);
    recRef.current = r;
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("courses").select("id,title,source_content").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setCourses((data as any) ?? []));
  }, [user]);

  const start = () => { setTranscript(""); setFeedback(null); recRef.current?.start(); setRecording(true); };
  const stop = () => { recRef.current?.stop(); setRecording(false); };

  const submit = async () => {
    if (!user) return;
    if (transcript.trim().length < 10) { toast.error("Réponse trop courte."); return; }
    if (!topic.trim()) { toast.error("Indique un sujet."); return; }
    setLoading(true);
    try {
      const course = courses.find(c => c.id === courseId);
      const { data, error } = await supabase.functions.invoke("oral-feedback", {
        body: { topic, transcript, courseContent: course?.source_content ?? null },
      });
      if (error) throw error;
      setFeedback(data);
      await supabase.from("oral_sessions").insert({
        user_id: user.id, course_id: courseId || null, topic, transcript,
        feedback: data, score: data?.score ?? null,
      });
      await supabase.rpc("bump_streak", { p_user_id: user.id });
    } catch (e: any) { toast.error(e?.message ?? "Erreur"); }
    finally { setLoading(false); }
  };

  return (
    <AppLayout>
      <PageHeader emoji="🎤" title="Mode oral" subtitle="Entraîne-toi à l'oral, l'IA te corrige." />

      <div className="px-5 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cours (optionnel)</Label>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger><SelectValue placeholder="Aucun cours lié" /></SelectTrigger>
            <SelectContent>
              {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Sujet à traiter</Label>
          <Textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex. Explique la force obligatoire du contrat" rows={2} />
        </div>

        {!supported && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            La reconnaissance vocale n'est pas supportée par ce navigateur. Utilise Chrome / Safari, ou tape directement ta réponse ci-dessous.
          </div>
        )}

        <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 text-center">
          {recording ? (
            <>
              <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive shadow-glow animate-pulse-glow">
                <Mic className="h-9 w-9 text-destructive-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium">Enregistrement... parle clairement</p>
              <Button onClick={stop} className="mt-3 rounded-full" variant="destructive">
                <Square className="h-4 w-4 mr-2" /> Arrêter
              </Button>
            </>
          ) : (
            <>
              <Button onClick={start} disabled={!supported} className="h-20 w-20 rounded-full gradient-primary border-0 shadow-glow">
                <Mic className="h-8 w-8" />
              </Button>
              <p className="mt-3 text-sm font-medium">{transcript ? "Touche pour réenregistrer" : "Touche pour commencer"}</p>
            </>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Transcription</Label>
          <Textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Ta réponse apparaîtra ici (modifiable)..." rows={5} />
        </div>

        <Button onClick={submit} disabled={loading || !transcript.trim()} className="w-full rounded-full gradient-primary border-0 h-12">
          {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Évaluation...</> : <><Sparkles className="h-4 w-4 mr-2" /> Évaluer ma prestation</>}
        </Button>

        {feedback && (
          <div className="rounded-2xl border-2 p-5 bg-card animate-scale-in">
            <div className="flex items-baseline justify-between">
              <p className="font-serif text-2xl">Note : <span className="gradient-text font-semibold">{feedback.score}/20</span></p>
            </div>
            <p className="text-sm mt-2">{feedback.summary}</p>

            {feedback.strengths?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-success mb-1.5">Points forts</p>
                <ul className="space-y-1">
                  {feedback.strengths.map((s: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" /> {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {feedback.improvements?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1.5">À améliorer</p>
                <ul className="space-y-1">
                  {feedback.improvements.map((s: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm"><AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" /> {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {feedback.follow_up && (
              <div className="mt-4 p-3 rounded-xl bg-muted">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Question de suivi</p>
                <p className="text-sm">{feedback.follow_up}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}