import { Button } from "@/components/ui/button";
import { CoachContext, pickSmartAlert } from "@/lib/coachContext";

export function SmartAlertBanner({
  ctx,
  weekTaskCount,
  onAction,
}: {
  ctx: CoachContext | null;
  weekTaskCount: number;
  onAction: (action: "generate_plan" | "open_techniques" | "open_subject" | "none") => void;
}) {
  if (!ctx) return null;
  const alert = pickSmartAlert(ctx, weekTaskCount);
  if (!alert) return null;

  const toneStyles: Record<string, string> = {
    urgent: "border-l-red-500 bg-red-50 dark:bg-red-950/30",
    warn: "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/30",
    ok: "border-l-green-500 bg-green-50 dark:bg-green-950/30",
    info: "border-l-blue-500 bg-blue-50 dark:bg-blue-950/30",
  };

  return (
    <div
      className={`relative rounded-r-lg border-l-4 px-4 py-3 mb-4 ${toneStyles[alert.tone]}`}
      style={{
        clipPath: "polygon(0 5%, 100% 0, 99% 95%, 1% 100%)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-foreground/90 flex-1">{alert.text}</p>
        {alert.ctaAction !== "none" && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full text-xs whitespace-nowrap shrink-0"
            onClick={() => onAction(alert.ctaAction)}
          >
            {alert.cta}
          </Button>
        )}
      </div>
    </div>
  );
}