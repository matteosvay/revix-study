import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { buildCoachContext, CoachContext } from "@/lib/coachContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle } from "lucide-react";
import { DailyTipCard } from "./DailyTipCard";
import { CoachChat } from "./CoachChat";
import { TechniquesLibrary } from "./TechniquesLibrary";
import { SavedTipsTab } from "./SavedTipsTab";

function PanelInner({ ctx }: { ctx: CoachContext | null }) {
  return (
    <div className="space-y-4">
      <DailyTipCard ctx={ctx} />
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-full p-1 bg-muted/60 mb-3">
          <TabsTrigger value="chat" className="rounded-full text-xs">💬 Coach</TabsTrigger>
          <TabsTrigger value="saved" className="rounded-full text-xs">🔖 Mes conseils</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="space-y-3 mt-0">
          <CoachChat ctx={ctx} />
          <TechniquesLibrary />
        </TabsContent>
        <TabsContent value="saved" className="mt-0">
          <SavedTipsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function CoachPanel({ inline = false }: { inline?: boolean }) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [ctx, setCtx] = useState<CoachContext | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    buildCoachContext(user.id).then(setCtx).catch(() => {});
  }, [user]);

  if (inline || !isMobile) {
    return <PanelInner ctx={ctx} />;
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            className="fixed bottom-20 right-4 z-40 gradient-primary text-white rounded-full shadow-glow px-4 py-3 text-sm font-medium flex items-center gap-2 hover:scale-105 transition"
            aria-label="Ouvrir ton coach"
          >
            <MessageCircle className="h-4 w-4" />
            Demande à ton coach 💬
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[88vh] overflow-y-auto rounded-t-3xl px-4 pt-6 paper-grain">
          <PanelInner ctx={ctx} />
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Hook to load and expose ctx for parent (used by alert banner). */
export function useCoachContext() {
  const { user } = useAuth();
  const [ctx, setCtx] = useState<CoachContext | null>(null);
  useEffect(() => {
    if (!user) return;
    buildCoachContext(user.id).then(setCtx).catch(() => {});
  }, [user]);
  return ctx;
}