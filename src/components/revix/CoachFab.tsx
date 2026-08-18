import { useState } from "react";
import { X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CoachChat } from "@/components/revix/coach/CoachChat";
import { DiploFace } from "./DiploFace";

export function CoachFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Demander de l'aide à Diplo"
        className="fixed bottom-[76px] right-4 z-40 rounded-2xl bg-card border-[2.5px] border-foreground shadow-brutal flex items-center justify-center press transition-transform hover:-translate-y-0.5 active:translate-y-0.5 lg:bottom-6"
        style={{ height: 56, width: 56 }}
      >
        <DiploFace size={40} animClass="" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl h-[82vh] flex flex-col p-0 overflow-hidden border-t-[3px] border-foreground">
          <SheetHeader className="shrink-0 px-5 pt-5 pb-3 border-b-2 border-foreground flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl border-2 border-foreground bg-background flex items-center justify-center overflow-hidden shrink-0">
                <DiploFace size={34} animClass="" />
              </div>
              <div className="text-left">
                <SheetTitle className="text-base leading-tight font-display">Diplo, ton coach</SheetTitle>
                <p className="text-[11px] text-muted-foreground">Ton compagnon de révision</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fermer" className="h-9 w-9 rounded-lg border-2 border-foreground bg-card flex items-center justify-center hover:-translate-y-0.5 transition-transform">
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            <CoachChat ctx={null} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
