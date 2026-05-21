import { useState } from "react";
import { Bot, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CoachChat } from "@/components/revix/coach/CoachChat";

export function CoachFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le coach IA"
        className="fixed bottom-[76px] right-4 z-40 h-13 w-13 rounded-full gradient-primary border-2 border-foreground shadow-brutal flex items-center justify-center tap-press transition-transform hover:scale-105 lg:bottom-6"
        style={{ height: 52, width: 52 }}
      >
        <Bot className="h-5 w-5 text-primary-foreground" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl h-[82vh] flex flex-col p-0 overflow-hidden">
          <SheetHeader className="shrink-0 px-5 pt-5 pb-3 border-b border-border flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <SheetTitle className="text-base leading-tight">Coach Revix</SheetTitle>
                <p className="text-[11px] text-muted-foreground">Ton assistant révision IA</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition">
              <X className="h-4 w-4" />
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
