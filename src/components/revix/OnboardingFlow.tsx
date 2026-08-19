import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CURSUS_OPTIONS } from "@/data/cursus";
import { DiploFace } from "./DiploFace";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Sparkles, Brain, BookMarked } from "lucide-react";

const ONBOARDED_KEY = "revix-onboarded-v1";

export function hasOnboarded(): boolean {
  try { return localStorage.getItem(ONBOARDED_KEY) === "1"; } catch { return true; }
}

/**
 * Accueil première visite — les 60 premières secondes qui décident si le nouvel
 * utilisateur reste. Diplo se présente, on récupère le cursus, on pousse vers le
 * premier cours (le « moment aha »).
 */
export function OnboardingFlow({ userId, onClose }: { userId: string; onClose: () => void }) {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [cursus, setCursus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const finish = async (goUpload: boolean) => {
    setBusy(true);
    try { localStorage.setItem(ONBOARDED_KEY, "1"); } catch { /* ignore */ }
    if (cursus) {
      try { await supabase.from("profiles").update({ cursus }).eq("id", userId); } catch { /* ignore */ }
    }
    onClose();
    if (goUpload) nav("/app/upload");
  };

  return (
    <div className="fixed inset-0 z-[90] bg-background/97 backdrop-blur-sm flex flex-col overflow-y-auto animate-fade-in">
      {/* Passer */}
      <div className="shrink-0 flex justify-end p-4">
        <button onClick={() => finish(false)} className="text-xs font-semibold text-muted-foreground hover:text-foreground transition">Passer</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10 text-center max-w-md mx-auto w-full">
        {step === 0 && (
          <div className="rise-in">
            <DiploFace size={130} expr="happy" animClass="diplo-party" />
            <h1 className="font-display font-bold text-2xl mt-4 leading-tight">Salut, moi c'est Diplo !</h1>
            <p className="text-muted-foreground mt-2 text-[15px]">
              Ton compagnon de révision. En 30 secondes, je te montre comment transformer tes cours en quizz, fiches et flashcards.
            </p>
            <Button onClick={() => setStep(1)} className="rounded-full gradient-primary border-2 border-foreground mt-6 px-8">
              C'est parti <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="rise-in w-full">
            <DiploFace size={84} expr="normal" animClass="diplo-bob" />
            <h1 className="font-display font-bold text-2xl mt-3 leading-tight">Tu étudies quoi ?</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">Je personnalise Revix pour ton niveau.</p>
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {CURSUS_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCursus(c)}
                  className={`text-sm font-semibold px-3.5 py-2 rounded-full border-2 border-foreground transition-all ${
                    cursus === c ? "bg-primary text-primary-foreground shadow-brutal-sm -translate-y-0.5" : "bg-card hover:bg-secondary"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={!cursus}
              className="rounded-full gradient-primary border-2 border-foreground mt-6 px-8 disabled:opacity-40"
            >
              Continuer <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="rise-in w-full">
            <DiploFace size={110} expr="happy" animClass="diplo-bob" />
            <h1 className="font-display font-bold text-2xl mt-3 leading-tight">Prêt à réviser malin ?</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">Ajoute un cours (PDF ou photo) et je m'occupe du reste :</p>
            <div className="grid grid-cols-3 gap-2 mt-5 text-left">
              {[
                { Icon: BookMarked, t: "Fiches" },
                { Icon: Brain, t: "Quizz" },
                { Icon: Sparkles, t: "Flashcards" },
              ].map(({ Icon, t }) => (
                <div key={t} className="rounded-xl border-2 border-foreground bg-card p-3 text-center shadow-brutal-sm">
                  <Icon className="h-5 w-5 mx-auto text-primary" />
                  <p className="text-[11px] font-semibold mt-1">{t}</p>
                </div>
              ))}
            </div>
            <Button
              onClick={() => finish(true)}
              disabled={busy}
              className="rounded-full gradient-primary border-2 border-foreground mt-6 px-8 w-full"
            >
              <Plus className="h-4 w-4 mr-1" /> Créer mon premier cours
            </Button>
            <button onClick={() => finish(false)} disabled={busy} className="text-xs font-semibold text-muted-foreground hover:text-foreground transition mt-3">
              Plus tard, je regarde d'abord
            </button>
          </div>
        )}

        {/* progression */}
        <div className="flex items-center gap-2 mt-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-foreground" : "w-1.5 bg-foreground/25"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
