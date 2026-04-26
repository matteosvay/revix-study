import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, Sparkles, Loader2, FileText, Image as ImageIcon, CheckCircle2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { extractPdfText, fileToBase64, extractDocxText, isDocx, DOCX_MIME } from "@/lib/pdf";
import { toast } from "sonner";
import { awardXp, bumpQuest } from "@/hooks/useGamification";
import { XP_REWARDS } from "@/lib/gamification";
import { localDateKey } from "@/lib/date";
import { SearchableCombobox } from "@/components/revix/SearchableCombobox";
import { SUBJECTS } from "@/data/subjects";

const STEPS = [
  "Fichier reçu",
  "Analyse du contenu...",
  "Lecture et compréhension en profondeur...",
  "Rédaction de ta fiche de cours...",
];

export default function Upload() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [step, setStep] = useState<number>(-1); // -1 idle
  const [dragOver, setDragOver] = useState(false);
  const [userSubjects, setUserSubjects] = useState<string[]>([]);

  // Récupère les matières ajoutées dans le profil pour les afficher en haut
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("subjects").eq("id", user.id).maybeSingle();
      const subs = (data?.subjects as string[] | null) ?? [];
      setUserSubjects(Array.isArray(subs) ? subs : []);
    })();
  }, [user]);

  // Empêche le navigateur d'ouvrir le fichier si l'utilisateur rate la zone de drop
  useEffect(() => {
    const prevent = (e: DragEvent) => { e.preventDefault(); };
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  const isAcceptedFile = (f: File) =>
    f.type === "application/pdf" || f.type.startsWith("image/") || isDocx(f);

  const addFiles = (incoming: File[]) => {
    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const f of incoming) {
      if (isAcceptedFile(f)) accepted.push(f);
      else rejected.push(f.name);
    }
    if (rejected.length) {
      toast.error(`Format non supporté: ${rejected.join(", ")}. PDF, Word (.docx) ou image uniquement.`);
    }
    if (!accepted.length) return;
    setFiles((prev) => {
      // Évite les doublons (même nom + taille)
      const seen = new Set(prev.map((f) => `${f.name}_${f.size}`));
      const merged = [...prev];
      for (const f of accepted) {
        const key = `${f.name}_${f.size}`;
        if (!seen.has(key)) { merged.push(f); seen.add(key); }
      }
      return merged;
    });
    if (!title) {
      const first = accepted[0];
      setTitle(first.name.replace(/\.[^.]+$/, ""));
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer?.files ?? []);
    if (!dropped.length) return;
    addFiles(dropped);
  };

  const generate = async () => {
    if (!user) return;
    if (files.length === 0 && text.trim().length < 20) { toast.error("Ajoute un fichier ou colle du texte."); return; }
    if (!title.trim()) { toast.error("Donne un titre à ton cours."); return; }

    try {
      setStep(0);
      const parts: string[] = [];
      let storagePath: string | null = null; // garde le chemin du premier fichier (référence)

      if (text.trim().length >= 20) parts.push(text.trim());

      if (files.length > 0) {
        // Garde-fou : taille totale (timeout extraction / upload)
        const totalSize = files.reduce((acc, f) => acc + f.size, 0);
        if (totalSize > 50 * 1024 * 1024) {
          throw new Error("Fichiers trop lourds (max 50 Mo au total). Réduis la sélection.");
        }
        for (const f of files) {
          if (f.size > 25 * 1024 * 1024) {
            throw new Error(`"${f.name}" dépasse 25 Mo. Compresse-le ou découpe-le.`);
          }
        }

        setStep(1);
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          // upload to storage — sanitise le nom
          const dotIdx = file.name.lastIndexOf(".");
          const rawBase = dotIdx > 0 ? file.name.slice(0, dotIdx) : file.name;
          const rawExt = dotIdx > 0 ? file.name.slice(dotIdx + 1) : "";
          const safeBase = rawBase
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9._-]+/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_+|_+$/g, "")
            .slice(0, 80) || "fichier";
          const safeExt = rawExt.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase().slice(0, 10);
          const safeName = safeExt ? `${safeBase}.${safeExt}` : safeBase;
          const path = `${user.id}/${Date.now()}_${i}_${safeName}`;
          const { error: upErr } = await supabase.storage.from("course-uploads").upload(path, file);
          if (upErr) throw upErr;
          if (!storagePath) storagePath = path;

          let extracted = "";
          if (file.type === "application/pdf") {
            try {
              extracted = await extractPdfText(file);
            } catch (err) {
              console.error("[upload] extractPdfText", err);
              throw new Error(`Impossible de lire "${file.name}". S'il est scanné, exporte-le en image ou .docx.`);
            }
            if (extracted.trim().length < 20) {
              throw new Error(`"${file.name}" ne contient pas de texte lisible (probablement scanné). Exporte-le en image ou en .docx.`);
            }
          } else if (isDocx(file)) {
            extracted = await extractDocxText(file);
          } else if (file.type.startsWith("image/")) {
            const b64 = await fileToBase64(file);
            const { data, error } = await supabase.functions.invoke("extract-pdf", { body: { imageBase64: b64, mimeType: file.type } });
            if (error) throw error;
            extracted = data?.text ?? "";
          }

          if (extracted.trim()) {
            parts.push(`# ${file.name}\n\n${extracted.trim()}`);
          }
        }
      }

      const content = parts.join("\n\n---\n\n").trim();

      if (content.trim().length < 20) throw new Error("Contenu illisible. Essaie un fichier plus net ou colle le texte.");

      setStep(2);
      // Insert course
      const { data: course, error: cErr } = await supabase.from("courses").insert({
        user_id: user.id, title, subject, level: null, source_content: content,
        source_file_path: storagePath, exam_date: examDate || null,
      }).select().single();
      if (cErr) throw cErr;

      // Génère la fiche de cours (résumé exhaustif)
      const { data: gen, error: gErr } = await supabase.functions.invoke("generate-fiches", {
        body: { content, subject, title },
      });
      if (gErr) throw gErr;
      if (!gen?.summary?.sections?.length) {
        throw new Error("L'IA n'a pas pu générer la fiche. Réessaie.");
      }

      setStep(3);
      // Sauvegarde le résumé riche sur le cours
      await supabase.from("courses").update({ summary: gen.summary }).eq("id", course.id);

      const { data: profileState } = await supabase.from("profiles").select("last_active_date").eq("id", user.id).maybeSingle();
      const todayKey = localDateKey(new Date());
      const isFirstActivityToday = profileState?.last_active_date !== todayKey;
      await supabase.rpc("bump_streak", { p_user_id: user.id });

      // XP : +50 pour un upload
      await awardXp(user.id, XP_REWARDS.upload, "course_upload");
      await bumpQuest(user.id, "course_uploaded", 1);
      if (isFirstActivityToday) {
        await bumpQuest(user.id, "streak_kept", 1);
        await bumpQuest(user.id, "w_7_streak", 1);
      }
      await bumpQuest(user.id, "w_4_uploads", 1);

      toast.success("Ta fiche de cours est prête ✨");
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
        <div className="px-6 pt-12 pb-6">
          <div className="notebook-page relative">
            <span className="rubber-stamp-blue rubber-stamp absolute top-3 right-4 stamp-pop">En cours</span>
            <p className="font-mono-tag text-[10px] uppercase tracking-widest text-muted-foreground">Lovable AI</p>
            <h2 className="font-hand text-3xl text-primary mt-1">L'IA bosse pour toi…</h2>

            <div className="mt-6 space-y-3">
              {STEPS.map((s, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-all ${done ? "bg-success/15" : active ? "bg-primary/15" : "bg-muted"}`}>
                      {done ? (
                        <CheckCircle2 className="h-5 w-5 text-success stamp-pop" />
                      ) : active ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      ) : (
                        <span className="font-mono-tag text-[10px] text-muted-foreground">{i + 1}</span>
                      )}
                    </div>
                    <span className={`font-hand text-lg ${done ? "text-success line-through opacity-70" : active ? "text-foreground" : "text-muted-foreground"}`}>
                      {s}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Crayon qui dessine la barre */}
            <div className="mt-6">
              <div className="ruler-bar !h-3">
                <div className="ruler-fill" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
              </div>
              <p className="font-mono-tag text-[10px] uppercase text-muted-foreground mt-2 text-right">{Math.round(((step + 1) / STEPS.length) * 100)} %</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader emoji="📥" title="Nouveau cours" subtitle="Upload un PDF ou une photo, l'IA s'occupe du reste." />

      <div className="px-5 space-y-5 pb-6">
        <label
          className={`block notebook-card dog-ear tilt-l p-6 text-center cursor-pointer transition-all ${dragOver ? "ring-2 ring-primary shadow-glow scale-[1.02]" : "hover:shadow-glow"}`}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!dragOver) setDragOver(true); }}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="hidden"
            accept={`application/pdf,image/*,.docx,${DOCX_MIME}`}
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <>
              {file.type.startsWith("image/") ? (
                <ImageIcon className="h-10 w-10 mx-auto text-primary" />
              ) : (
                <FileText className="h-10 w-10 mx-auto text-primary" />
              )}
              <p className="mt-3 font-hand text-xl truncate">{file.name}</p>
              <p className="font-mono-tag text-[10px] uppercase text-muted-foreground mt-0.5">Cliquer pour changer</p>
            </>
          ) : (
            <>
              <UploadCloud className="h-10 w-10 mx-auto text-primary" />
              <p className="mt-3 font-hand text-xl">📷 Photo · 📄 PDF · 📝 Word</p>
              <p className="font-mono-tag text-[10px] uppercase text-muted-foreground mt-0.5">Glisse ou clique ici</p>
              <p className="font-mono-tag text-[9px] uppercase text-muted-foreground/70 mt-1">
                Google Docs : Fichier → Télécharger → .docx
              </p>
            </>
          )}
        </label>

        <div className="clip-divider"><span className="font-mono-tag text-[10px] uppercase">ou</span></div>

        <div className="space-y-1.5">
          <Label className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground">✍️ Coller du texte</Label>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Tape ou colle tes notes ici..." rows={4} className="resize-none notebook-card !pl-12 font-hand !text-lg" />
        </div>

        <div className="space-y-1.5">
          <Label className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground">Titre</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Droit des contrats — chap. 3" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground">Matière</Label>
            <SearchableCombobox
              items={(() => {
                const seen = new Set<string>();
                const items: { value: string; label: string; group?: string; emoji?: string }[] = [];
                // 1) Matières du profil en premier
                for (const name of userSubjects) {
                  if (seen.has(name)) continue;
                  seen.add(name);
                  const match = SUBJECTS.find(s => s.name === name);
                  items.push({ value: name, label: name, group: "Mes matières", emoji: match?.emoji });
                }
                // 2) Toute la base curée
                for (const s of SUBJECTS) {
                  if (seen.has(s.name)) continue;
                  seen.add(s.name);
                  items.push({ value: s.name, label: s.name, group: s.category, emoji: s.emoji });
                }
                return items;
              })()}
              value={subject}
              onChange={setSubject}
              placeholder="Choisir une matière"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground">Examen</Label>
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