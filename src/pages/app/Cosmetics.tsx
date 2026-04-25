import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Check, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CosmeticAvatar } from "@/components/revix/CosmeticAvatar";
import { backgroundStyle, RARITY_LABEL, RARITY_RING, RARITY_TEXT, type Rarity } from "@/lib/cosmetics";
import { TitleBadge } from "@/components/revix/TitleBadge";
import { cn } from "@/lib/utils";

type Item = {
  item_key: string; name: string; description: string | null; emoji: string | null;
  category: "frame" | "background" | "sticker" | "title";
  rarity: Rarity; equipped: boolean;
};

export default function Cosmetics() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const [{ data: inv }, { data: p }] = await Promise.all([
      supabase.rpc("get_my_cosmetics_inventory"),
      supabase.from("profiles").select("display_name, avatar_url, equipped_frame, equipped_background, equipped_sticker, equipped_title").eq("id", user.id).single(),
    ]);
    setItems((inv as any) ?? []);
    setProfile(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const equip = async (item: Item, on: boolean) => {
    setBusy(item.item_key);
    try {
      const { error } = await supabase.rpc("equip_cosmetic", {
        p_item_key: on ? item.item_key : (null as any),
        p_category: item.category,
      });
      if (error) throw error;
      toast.success(on ? `${item.name} équipé` : `${item.name} retiré`);
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally { setBusy(null); }
  };

  if (loading) return <AppLayout><div className="p-5 text-sm text-muted-foreground">Chargement...</div></AppLayout>;

  const initials = (profile?.display_name ?? "U").split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase();
  const stickerEmoji = items.find(i => i.item_key === profile?.equipped_sticker)?.emoji ?? null;
  const titleItem = items.find(i => i.item_key === profile?.equipped_title);

  const byCat = (cat: Item["category"]) => items.filter(i => i.category === cat);

  const renderGrid = (list: Item[], cat: Item["category"]) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-10 text-sm text-muted-foreground">
          <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Aucun item dans cette catégorie.</p>
          <p className="text-xs mt-1">Ouvre la boîte mystère pour en découvrir !</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-3">
        {list.map(item => (
          <div key={item.item_key} className={cn("rounded-md border-[2.5px] border-foreground bg-card p-3 shadow-brutal-sm relative", item.equipped && "ring-2 ring-primary")}>
            {item.equipped && <span className="absolute top-1.5 right-1.5 text-[10px] font-mono uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm flex items-center gap-0.5"><Check className="h-3 w-3"/>Équipé</span>}
            <div className="h-20 rounded-md overflow-hidden border-2 border-foreground/20 mb-2 flex items-center justify-center" style={cat === "background" ? backgroundStyle(item.item_key) : undefined}>
              {cat === "frame" && (
                <CosmeticAvatar fallback={initials} avatarUrl={profile?.avatar_url} frame={item.item_key} size="md" />
              )}
              {cat === "sticker" && <span className="text-5xl">{item.emoji}</span>}
              {cat === "title" && (
                <div className="text-center px-2">
                  <span className="text-2xl">{item.emoji}</span>
                  <p className="text-xs font-bold mt-0.5 truncate">{item.name}</p>
                </div>
              )}
            </div>
            <p className="text-sm font-bold leading-tight truncate">{item.name}</p>
            <p className={cn("text-[10px] font-mono uppercase tracking-wider", RARITY_TEXT[item.rarity])}>{RARITY_LABEL[item.rarity]}</p>
            <Button
              size="sm"
              variant={item.equipped ? "outline" : "default"}
              disabled={busy === item.item_key}
              onClick={() => equip(item, !item.equipped)}
              className="w-full mt-2 h-8 text-xs"
            >
              {busy === item.item_key ? <Loader2 className="h-3 w-3 animate-spin" /> : item.equipped ? "Retirer" : "Équiper"}
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="px-3 pt-3 flex items-center gap-1">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link to="/app/profil"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <p className="text-xs text-muted-foreground">Cosmétiques</p>
      </div>
      <PageHeader emoji="✨" title="Mes cosmétiques" subtitle={`${items.length} items`} />

      <div className="px-5">
        {/* Live preview */}
        <div className="rounded-md border-[2.5px] border-foreground overflow-hidden mb-4 shadow-brutal-sm">
          <div className="h-24 relative" style={backgroundStyle(profile?.equipped_background)}>
            <div className="absolute -bottom-10 left-4">
              <CosmeticAvatar
                fallback={initials}
                avatarUrl={profile?.avatar_url}
                frame={profile?.equipped_frame}
                sticker={stickerEmoji}
                size="lg"
              />
            </div>
          </div>
          <div className="bg-card pt-12 pb-3 px-4">
            <p className="font-serif text-lg leading-tight">{profile?.display_name ?? "Toi"}</p>
            {titleItem && (
              <div className="mt-0.5">
                <TitleBadge
                  itemKey={titleItem.item_key}
                  name={titleItem.name}
                  emoji={titleItem.emoji}
                  rarity={titleItem.rarity}
                />
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="frame">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="frame">Cadres</TabsTrigger>
            <TabsTrigger value="background">Fonds</TabsTrigger>
            <TabsTrigger value="sticker">Stickers</TabsTrigger>
            <TabsTrigger value="title">Titres</TabsTrigger>
          </TabsList>
          <TabsContent value="frame" className="mt-4 pb-8">{renderGrid(byCat("frame"), "frame")}</TabsContent>
          <TabsContent value="background" className="mt-4 pb-8">{renderGrid(byCat("background"), "background")}</TabsContent>
          <TabsContent value="sticker" className="mt-4 pb-8">{renderGrid(byCat("sticker"), "sticker")}</TabsContent>
          <TabsContent value="title" className="mt-4 pb-8">{renderGrid(byCat("title"), "title")}</TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
