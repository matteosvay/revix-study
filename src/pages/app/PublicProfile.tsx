import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flame, Trophy, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CosmeticAvatar } from "@/components/revix/CosmeticAvatar";
import { BackgroundDecor } from "@/components/revix/cosmetics/BackgroundDecor";
import { backgroundStyle, type Rarity } from "@/lib/cosmetics";
import { TitleBadge } from "@/components/revix/TitleBadge";
import { cn } from "@/lib/utils";

export default function PublicProfile() {
  const { id } = useParams();
  const [p, setP] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.rpc("get_public_profile", { p_user_id: id });
      setP((data as any)?.[0] ?? null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <AppLayout><div className="p-5 text-sm text-muted-foreground">Chargement...</div></AppLayout>;
  if (!p) return <AppLayout><div className="p-5 text-sm text-muted-foreground">Profil introuvable.</div></AppLayout>;

  const initials = (p.display_name ?? "U").split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <AppLayout>
      <div className="px-3 pt-3 flex items-center gap-1">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link to="/app/campus"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <p className="text-xs text-muted-foreground">Profil</p>
      </div>

      <div className="px-5">
        <div className="rounded-md border-[2.5px] border-foreground overflow-hidden shadow-brutal-sm">
          <div className="h-28 relative overflow-hidden" style={backgroundStyle(p.equipped_background)}>
            <BackgroundDecor itemKey={p.equipped_background} />
            <div className="absolute -bottom-10 left-4 z-10">
              <CosmeticAvatar fallback={initials} avatarUrl={p.avatar_url} frame={p.equipped_frame} sticker={p.sticker_emoji} stickerKey={p.equipped_sticker} size="lg" />
            </div>
          </div>
          <div className="bg-card pt-12 pb-4 px-4">
            <p className="font-serif text-2xl leading-tight">{p.display_name ?? "Sans nom"}</p>
            {p.username && <p className="text-xs text-muted-foreground">@{p.username}</p>}
            <div className="mt-1">
              <TitleBadge
                itemKey={p.equipped_title}
                name={p.title_name}
                emoji={p.title_emoji}
                rarity={p.title_rarity as Rarity}
              />
            </div>
            {p.bio && <p className="text-sm mt-3 text-foreground/80">{p.bio}</p>}
            {(p.cursus || p.formation) && (
              <p className="text-xs text-muted-foreground mt-2">
                {[p.formation, p.cursus].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="rounded-xl border bg-card p-3 text-center">
            <Trophy className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="font-serif text-xl">Niv. {p.level}</p>
            <p className="text-[11px] text-muted-foreground">{p.xp_total} XP</p>
          </div>
          <div className="rounded-xl border bg-card p-3 text-center">
            <Flame className="h-4 w-4 mx-auto text-orange-500 mb-1" />
            <p className="font-serif text-xl">{p.streak_days}j</p>
            <p className="text-[11px] text-muted-foreground">Record {p.streak_record}j</p>
          </div>
          <div className="rounded-xl border bg-card p-3 text-center col-span-2">
            <Zap className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="font-serif text-xl">{p.xp_week} XP</p>
            <p className="text-[11px] text-muted-foreground">cette semaine</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
