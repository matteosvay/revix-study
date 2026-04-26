import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Trash2, X, Loader2, Crown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { LootBoxReveal } from "@/components/revix/LootBoxReveal";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
  metadata: any;
};

const ICONS: Record<string, string> = {
  friend_request: "👋",
  friend_accepted: "🤝",
  duel_received: "⚔️",
  duel_completed: "🏁",
  course_share_received: "📨",
  course_share_response: "📬",
  queen_lootbox: "👑",
};

export const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);
  const [claimingQueen, setClaimingQueen] = useState<string | null>(null);
  const [queenReward, setQueenReward] = useState<any | null>(null);

  const unread = items.filter((n) => !n.read).length;

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id,type,title,message,link,read,created_at,metadata")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data ?? []) as Notification[]);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const channelName = `notif:${user.id}:${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clickItem = async (n: Notification) => {
    if (!n.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const removeItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("notifications").delete().eq("id", id);
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const respondShare = async (n: Notification, accept: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareId = n.metadata?.share_id;
    if (!shareId) return;
    setResponding(n.id);
    const { error } = await supabase.rpc("respond_course_share", {
      p_share_id: shareId,
      p_accept: accept,
    });
    setResponding(null);
    if (error) {
      toast.error(error.message.includes("share_not_found") ? "Déjà traité" : "Action impossible");
      return;
    }
    toast.success(accept ? "Fiche ajoutée à tes cours ✨" : "Fiche refusée");
    await supabase.from("notifications").update({ read: true }).eq("id", n.id);
    await load();
  };

  const claimQueenLootbox = async (n: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    setClaimingQueen(n.id);
    const { data, error } = await supabase.rpc("claim_queen_lootbox" as any);
    setClaimingQueen(null);
    if (error) {
      toast.error("Lootbox déjà ouverte ou indisponible");
      return;
    }
    const payload = (data as any)?.rewards;
    if (!payload) {
      toast.error("Récompense introuvable");
      return;
    }
    setQueenReward(payload);
    setOpen(false);
    await load();
  };

  if (!user) return null;

  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label={`Notifications${unread ? ` (${unread} non lues)` : ""}`}
          className="relative h-10 w-10 rounded-md bg-card border-[2.5px] border-foreground shadow-brutal flex items-center justify-center hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-sm transition-all"
        >
          <Bell className="h-5 w-5" strokeWidth={2.5} />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-destructive text-destructive-foreground border-2 border-foreground text-[10px] font-bold font-mono flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 rounded-md border-[2.5px] border-foreground bg-card shadow-brutal"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b-[2.5px] border-foreground">
          <p className="font-display text-sm uppercase tracking-wide">Notifications</p>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 px-2 text-[10px]">
              <Check className="h-3 w-3" /> Tout lu
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Aucune notification</p>
            </div>
          ) : (
            <ul className="divide-y-[2px] divide-foreground/15">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => clickItem(n)}
                    className={`w-full text-left px-3 py-3 flex gap-3 items-start hover:bg-secondary/50 transition-colors ${
                      !n.read ? "bg-accent/10" : ""
                    }`}
                  >
                    <span className="text-xl shrink-0 leading-none mt-0.5">{ICONS[n.type] ?? "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold leading-tight">{n.title}</p>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      {n.message && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                      <p className="text-[10px] text-muted-foreground/70 mt-1 font-mono">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                      </p>
                      {n.type === "course_share_received" && n.metadata?.share_id && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={(e) => respondShare(n, true, e)}
                            disabled={responding === n.id}
                            className="h-7 px-3 text-[11px]"
                          >
                            {responding === n.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3" /> Accepter</>}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => respondShare(n, false, e)}
                            disabled={responding === n.id}
                            className="h-7 px-3 text-[11px]"
                          >
                            <X className="h-3 w-3" /> Refuser
                          </Button>
                        </div>
                      )}
                      {n.type === "queen_lootbox" && (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            onClick={(e) => claimQueenLootbox(n, e)}
                            disabled={claimingQueen === n.id}
                            className="h-8 px-3 text-[11px] bg-gradient-to-r from-pink-400 via-rose-400 to-amber-300 hover:from-pink-500 hover:via-rose-500 hover:to-amber-400 text-white border-2 border-foreground shadow-brutal-sm"
                          >
                            {claimingQueen === n.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <><Crown className="h-3.5 w-3.5" /> Ouvrir la lootbox royale</>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => removeItem(n.id, e)}
                      className="opacity-40 hover:opacity-100 hover:text-destructive transition-opacity shrink-0 p-1"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
    {queenReward && (
      <LootBoxReveal reward={queenReward} onClose={() => setQueenReward(null)} />
    )}
    </>
  );
};