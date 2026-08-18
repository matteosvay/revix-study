import { X } from "lucide-react";
import { DiploFace, DiploDefs } from "./DiploFace";
import {
  TOQUES,
  type ToqueRarity,
  TOQUE_RARITY_LABEL,
  TOQUE_RARITY_COLOR,
  setDiploCapId,
  useDiploCapId,
  capColorFor,
} from "@/lib/diploCap";
import { playPop } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const ORDER: ToqueRarity[] = ["common", "rare", "epic", "legend"];

/** Modale de personnalisation : choisir la toque de Diplo. */
export function DiploCapPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const currentId = useDiploCapId();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border-[3px] border-foreground bg-card shadow-brutal-lg p-5 animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 h-9 w-9 rounded-lg border-2 border-foreground bg-background flex items-center justify-center hover:-translate-y-0.5 transition-transform"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>

        <div className="flex flex-col items-center text-center">
          <DiploDefs />
          <DiploFace cap={capColorFor(currentId)} expr="happy" size={96} />
          <h2 className="font-display text-lg mt-1">Choisis la toque de Diplo</h2>
          <p className="text-xs text-muted-foreground">Elle apparaît partout où Diplo t'accompagne.</p>
        </div>

        {ORDER.map((r) => (
          <div key={r} className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full" style={{ background: TOQUE_RARITY_COLOR[r] }} />
              <span className="font-display text-sm">{TOQUE_RARITY_LABEL[r]}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TOQUES.filter((t) => t.rarity === r).map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setDiploCapId(t.id);
                    playPop();
                  }}
                  className={cn(
                    "relative rounded-xl border-2 p-2 bg-background flex flex-col items-center gap-1 transition-transform hover:-translate-y-0.5",
                    currentId === t.id ? "border-primary ring-2 ring-primary" : "border-foreground"
                  )}
                >
                  <DiploFace cap={t.cap} size={52} animClass="" />
                  <span className="text-[11px] font-semibold leading-tight">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
