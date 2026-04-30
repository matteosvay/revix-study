import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export function ReferralCard() {
  const { user } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [hasReferrer, setHasReferrer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { count: c }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("referral_code").eq("id", user.id).single(),
        supabase.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_id", user.id),
        supabase.from("referrals").select("id").eq("referred_id", user.id).maybeSingle(),
      ]);
      setCode(p?.referral_code ?? null);
      setCount(c ?? 0);
      setHasReferrer(!!r);
    })();
  }, [user]);

  const shareUrl = code ? `${window.location.origin}/signup?ref=${code}` : "";

  const copy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Rejoins-moi sur Revix",
          text: "Mon app pour réviser plus vite avec l'IA — utilise mon code et gagne 100 XP 🎁",
          url: shareUrl,
        });
      } catch {/* user cancelled */}
    } else {
      copy();
    }
  };

  const submit = async () => {
    const c = inputCode.trim().toUpperCase();
    if (!c) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc("apply_referral_code", { _code: c });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    const res = data as { ok: boolean; error?: string };
    if (!res.ok) {
      const map: Record<string, string> = {
        invalid_code: "Code invalide",
        self_referral: "Tu ne peux pas utiliser ton propre code",
        already_referred: "Tu as déjà utilisé un code de parrainage",
        too_late: "Trop tard : le code doit être utilisé dans les 7 jours suivant l'inscription",
        not_authenticated: "Connexion requise",
      };
      toast.error(map[res.error ?? ""] ?? "Erreur");
      return;
    }
    toast.success("+100 XP ! Code appliqué 🎉");
    setHasReferrer(true);
    setInputCode("");
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parrainage</p>
      <div className="rounded-md border-[2.5px] border-foreground bg-card p-4 shadow-brutal-sm space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-md gradient-primary border-2 border-foreground flex items-center justify-center text-primary-foreground shrink-0">
            <Gift className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-base">Invite un ami, gagne 200 XP</p>
            <p className="text-[11px] text-muted-foreground">Ton ami reçoit +100 XP, toi +200 XP par filleul.</p>
          </div>
        </div>

        {code && (
          <>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md border-2 border-foreground bg-muted/30 px-3 py-2 font-mono text-sm font-bold tracking-wider text-center">
                {code}
              </div>
              <Button size="sm" variant="outline" onClick={copy} className="shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button onClick={share} className="w-full" size="sm">Partager mon lien</Button>
            <p className="text-[11px] text-muted-foreground text-center">
              {count > 0 ? `${count} ami${count > 1 ? "s" : ""} déjà parrainé${count > 1 ? "s" : ""} 🎉` : "Aucun filleul pour l'instant"}
            </p>
          </>
        )}

        {!hasReferrer && (
          <div className="pt-2 border-t border-foreground/10 space-y-2">
            <p className="text-[11px] text-muted-foreground">As-tu un code de parrainage ?</p>
            <div className="flex items-center gap-2">
              <Input
                placeholder="ABC1234"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase().slice(0, 7))}
                className="font-mono uppercase tracking-wider"
                maxLength={7}
              />
              <Button size="sm" onClick={submit} disabled={submitting || inputCode.length !== 7}>
                Valider
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}