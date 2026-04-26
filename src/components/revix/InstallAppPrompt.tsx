import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share, Plus, MoreVertical, X, Smartphone } from "lucide-react";

const STORAGE_KEY = "revix.installPrompt.dismissed.v1";

type Platform = "ios" | "android" | "desktop" | "other";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
  if (isIOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Mobi|Tablet/i.test(ua)) return "other";
  return "desktop";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia?.("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as any).standalone === true;
  return Boolean(mq || iosStandalone);
}

function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Popup proposant d'installer Revix sur l'écran d'accueil.
 * - Affiché 1 seule fois par appareil (localStorage).
 * - Ne s'affiche pas en iframe (preview Lovable) ni si déjà installée.
 * - Android/Desktop : utilise le prompt natif beforeinstallprompt.
 * - iOS : affiche les instructions visuelles "Partager → Sur l'écran d'accueil".
 */
export const InstallAppPrompt = () => {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isInIframe()) return;
    if (isStandalone()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const p = detectPlatform();
    setPlatform(p);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // iOS n'émet jamais beforeinstallprompt → on ouvre directement après un court délai
    let t: number | undefined;
    if (p === "ios") {
      t = window.setTimeout(() => setOpen(true), 800);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      if (t) window.clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const triggerNativePrompt = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      // ignore
    } finally {
      dismiss();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && dismiss()}>
      <DialogContent className="border-[3px] border-foreground shadow-brutal max-w-[400px] p-0 overflow-hidden">
        <div className="bg-accent border-b-[3px] border-foreground p-5 flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl border-[2.5px] border-foreground bg-background flex items-center justify-center shrink-0 shadow-brutal">
            <Smartphone className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <DialogHeader className="space-y-0.5 text-left">
              <DialogTitle className="font-display text-xl leading-tight">
                Installe Revix
              </DialogTitle>
              <DialogDescription className="font-mono-tag text-[11px] uppercase tracking-wider text-foreground/70">
                Accès direct depuis l'écran d'accueil
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {platform === "ios" && (
            <>
              <p className="text-sm">
                Sur iPhone, ajoute Revix à ton écran d'accueil pour l'ouvrir comme une vraie app.
              </p>
              <ol className="space-y-3">
                <li className="flex items-center gap-3 p-3 rounded-lg border-2 border-foreground bg-secondary">
                  <span className="font-display text-lg w-6 shrink-0">1.</span>
                  <span className="text-sm flex-1">Appuie sur</span>
                  <Share className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                  <span className="text-sm font-bold">Partager</span>
                </li>
                <li className="flex items-center gap-3 p-3 rounded-lg border-2 border-foreground bg-secondary">
                  <span className="font-display text-lg w-6 shrink-0">2.</span>
                  <span className="text-sm flex-1">Choisis</span>
                  <Plus className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                  <span className="text-sm font-bold">Sur l'écran d'accueil</span>
                </li>
                <li className="flex items-center gap-3 p-3 rounded-lg border-2 border-foreground bg-secondary">
                  <span className="font-display text-lg w-6 shrink-0">3.</span>
                  <span className="text-sm flex-1 font-bold">Ajouter</span>
                </li>
              </ol>
            </>
          )}

          {(platform === "android" || platform === "desktop" || platform === "other") && deferred && (
            <>
              <p className="text-sm">
                Installe Revix pour un accès rapide, sans passer par le navigateur.
              </p>
              <Button onClick={triggerNativePrompt} className="w-full font-display gap-2" size="lg">
                <Download className="h-5 w-5" strokeWidth={2.5} />
                Installer maintenant
              </Button>
            </>
          )}

          {(platform === "android" || platform === "desktop" || platform === "other") && !deferred && (
            <>
              <p className="text-sm">
                Pour installer Revix, ouvre le menu de ton navigateur et choisis « Installer l'application » ou « Ajouter à l'écran d'accueil ».
              </p>
              <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-foreground bg-secondary">
                <MoreVertical className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                <span className="text-sm">Menu navigateur → Installer</span>
              </div>
            </>
          )}

          <button
            onClick={dismiss}
            className="w-full font-mono-tag text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition flex items-center justify-center gap-1 py-2"
          >
            <X className="h-3 w-3" strokeWidth={2.5} />
            Plus tard
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};