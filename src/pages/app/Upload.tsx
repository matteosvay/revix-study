import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Sparkles, Loader2, FileText, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { extractPdfText, fileToBase64 } from "@/lib/pdf";
import { toast } from "sonner";
import { awardXp, bumpQuest } from "@/hooks/useGamification";
import { XP_REWARDS } from "@/lib/gamification";

const STEPS = ["Lecture du fichier...", "Extraction du contenu...", "Analyse IA...", "Création des fiches..."];

export default function Upload() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [step, setStep] = useState<number>(-1); // -1 idle

  const onFile = (f: File | null) => { if (!f) return; setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, "")); };

  const generate = async () => {
    if (!user) return;
    if (!file && text.trim().length < 20) { toast.error("Ajoute un fichier ou colle du texte."); return; }
    if (!title.trim()) { toast.error("Donne un titre à ton cours."); return; }

    try {
      setStep(0);
      let content = text.trim();
      let storagePath: string | null = null;

      if (file) {
        // upload to storage
        const path = `${user.id}/${Date.now()}_${file.name}`;
        const { error: upErr } = await supabase.storage.from("course-uploads").upload(path, file);
        if (upErr) throw upErr;
        storagePath = path;

        setStep(1);
        if (file.type === "application/pdf") {
          content = await extractPdfText(file);
        } else if (file.type.startsWith("image/")) {
          const b64 = await fileToBase64(file);
          const { data, error } = await supabase.functions.invoke("extract-pdf", { body: { imageBase64: b64, mimeType: file.type } });
          if (error) throw error;
          content = data?.text ?? "";
        }
      }

      if (content.trim().length < 20) throw new Error("Contenu illisible. Essaie un fichier plus net ou colle le texte.");

      setStep(2);
      // Insert course
      const { data: course, error: cErr } = await supabase.from("courses").insert({
        user_id: user.id, title, subject, level: null, source_content: content,
        source_file_path: storagePath, exam_date: examDate || null,
      }).select().single();
      if (cErr) throw cErr;

      // Generate flashcards
      const { data: gen, error: gErr } = await supabase.functions.invoke("generate-fiches", {
        body: { content, subject, title },
      });
      if (gErr) throw gErr;
      const fiches: { front: string; back: string }[] = gen?.flashcards ?? [];
      if (fiches.length === 0) throw new Error("L'IA n'a pas pu générer de fiches. Réessaie.");

      setStep(3);
      // Save rich summary on the course
      if (gen?.summary) {
        await supabase.from("courses").update({ summary: gen.summary }).eq("id", course.id);
      }
      const rows = fiches.map((f, i) => ({ course_id: course.id, user_id: user.id, front: f.front, back: f.back, position: i }));
      const { error: fErr } = await supabase.from("flashcards").insert(rows);
      if (fErr) throw fErr;

      // Bump streak
      await supabase.rpc("bump_streak", { p_user_id: user.id });

      // XP : +50 pour un upload
      await awardXp(user.id, XP_REWARDS.upload, "course_upload");
      await bumpQuest(user.id, "course_uploaded", 1);
      await bumpQuest(user.id, "streak_kept", 1);

      toast.success(`${fiches.length} fiches créées ✨`);
      nav(`/app/fiches/${course.id}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Une erreur est survenue.");
      setStep(-1);
    }
  };

  if (step >= 0) {
    return (
      <AppLayout>
        <div className="px-6 pt-20 text-center">
          <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
          <p className="font-serif text-2xl mt-6">{STEPS[step]}</p>
          <p className="text-sm text-muted-foreground mt-2">Encore quelques secondes...</p>
          <div className="mt-8 max-w-xs mx-auto flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader emoji="📥" title="Nouveau cours" subtitle="Upload un PDF ou une photo, l'IA s'occupe du reste." />

      <div className="px-5 space-y-5">
        <label className="block rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center hover:border-primary cursor-pointer transition">
          <input type="file" className="hidden" accept="application/pdf,image/*" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
          {file ? (
            <>
              {file.type.startsWith("image/") ? <ImageIcon className="h-10 w-10 mx-auto text-primary" /> : <FileText className="h-10 w-10 mx-auto text-primary" />}
              <p className="mt-3 text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Cliquer pour changer</p>
            </>
          ) : (
            <>
              <UploadCloud className="h-10 w-10 mx-auto text-primary" />
              <p className="mt-3 text-sm font-medium">Choisir un PDF ou une photo</p>
              <p className="text-xs text-muted-foreground mt-0.5">Glisse ou clique ici</p>
            </>
          )}
        </label>

        <div className="text-center text-xs text-muted-foreground">— OU —</div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Coller du texte</Label>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Tape ou colle tes notes ici..." rows={4} className="resize-none" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Titre</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Droit des contrats — chap. 3" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Matière</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                {["Maths", "Histoire", "Droit", "Marketing", "Lettres", "Économie", "Philo", "Anglais", "Bio", "Physique", "Autre"].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Examen</Label>
            <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          </div>
        </div>

        <Button onClick={generate} className="w-full rounded-full gradient-primary border-0 h-12 text-base shadow-glow">
          <Sparkles className="h-4 w-4 mr-2" /> Générer mes fiches
        </Button>
      </div>
    </AppLayout>
  );
}