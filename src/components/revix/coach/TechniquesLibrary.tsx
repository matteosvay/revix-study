import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { localDateKey } from "@/lib/date";
import { bumpQuest } from "@/hooks/useGamification";

const TECHNIQUES = [
  {
    emoji: "🍅",
    name: "POMODORO",
    desc: "25 min de travail / 5 min de pause. Après 4 cycles : pause 20 min.",
    use: "Idéal pour : démarrer quand t'as pas envie.",
    cta: "Ajouter 25min au planning",
    action: "pomodoro" as const,
    tape: "tape" as const,
  },
  {
    emoji: "🧠",
    name: "ACTIVE RECALL",
    desc: "Ferme tes fiches. Écris tout ce dont tu te souviens. Compare. Recommence sur les trous.",
    use: "Idéal pour : mémoriser durablement.",
    cta: "Lancer un quizz",
    action: "quizz" as const,
    tape: "tape-pink" as const,
  },
  {
    emoji: "📆",
    name: "RÉVISION ESPACÉE",
    desc: "Révise J+1, J+3, J+7, J+14 après avoir appris. Revix calcule ça pour toi.",
    use: "Idéal pour : ne plus oublier avant l'exam.",
    cta: "Voir mes fiches",
    action: "fiches" as const,
    tape: "tape-mint" as const,
  },
  {
    emoji: "✏️",
    name: "FEYNMAN",
    desc: "Explique le concept comme si t'avais 12 ans. Si tu bloques, t'as trouvé ton point faible.",
    use: "Idéal pour : vraiment comprendre.",
    cta: "Mode Feynman",
    action: "feynman" as const,
    tape: "tape" as const,
  },
  {
    emoji: "🎯",
    name: "BLURTING",
    desc: "Prends une feuille blanche. Vide ta tête sur le sujet. Compare avec tes fiches.",
    use: "Idéal pour : avant un exam dans 24h.",
    cta: "Timer 10 min",
    action: "blurt" as const,
    tape: "tape-pink" as const,
  },
  {
    emoji: "😴",
    name: "SLEEP LEARNING",
    desc: "Révise 30 min avant de dormir. Le cerveau consolide pendant le sommeil.",
    use: "Idéal pour : les révisions du soir.",
    cta: "Rappel à 22h",
    action: "sleep" as const,
    tape: "tape-mint" as const,
  },
];

export function TechniquesLibrary() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAction = async (action: string, name: string) => {
    if (!user) return;
    if (action === "quizz") {
      navigate("/app/quizz");
      return;
    }
    if (action === "fiches") {
      navigate("/app/fiches");
      return;
    }
    if (action === "pomodoro") {
      const today = localDateKey(new Date());
      const { error } = await supabase.from("planning_tasks").insert({
        user_id: user.id,
        task_date: today,
        subject: "Pomodoro",
        title: "Session Pomodoro 25 min",
      });
      if (error) return toast.error(error.message);
      await bumpQuest(user.id, "task_added", 1);
      toast.success("Session Pomodoro ajoutée à aujourd'hui 🍅");
      return;
    }
    if (action === "feynman" || action === "blurt") {
      toast.success(`${name} : prends une feuille blanche, lance ton chrono 10 min !`, { duration: 5000 });
      return;
    }
    if (action === "sleep") {
      const today = localDateKey(new Date());
      const { error } = await supabase.from("planning_tasks").insert({
        user_id: user.id,
        task_date: today,
        start_time: "22:00",
        end_time: "22:30",
        subject: "Révision du soir",
        title: "Sleep learning — 30 min",
      });
      if (error) return toast.error(error.message);
      toast.success("Rappel ajouté à 22h ce soir 😴");
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 label-tape !text-xs !rotate-0 !px-3 !py-2 !w-full hover:opacity-90"
        style={{ borderRadius: 4 }}
      >
        <span>📚 TECHNIQUES QUI MARCHENT VRAIMENT</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {TECHNIQUES.map((t) => (
            <div key={t.name} className="relative notebook-card dog-ear p-3 pt-5">
              <div className={`tape ${t.tape === "tape-pink" ? "tape-pink" : t.tape === "tape-mint" ? "tape-mint" : ""}`} style={{ width: 50, height: 16 }} />
              <p className="font-mono text-[10px] tracking-widest text-foreground/70 mb-1">
                {t.emoji} {t.name}
              </p>
              <p className="text-xs leading-snug text-foreground/85">{t.desc}</p>
              <p className="text-[10px] italic text-foreground/55 mt-1.5">{t.use}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction(t.action, t.name)}
                className="rounded-full text-[10px] h-7 mt-2 w-full"
              >
                {t.cta}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}