import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

const ICONS: Record<string, string> = {
  friend_request: "👋",
  friend_accepted: "🤝",
  duel_received: "⚔️",
  duel_completed: "🏁",
};

export const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unread = items.filter((n) => !n.read).length;

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id,type,title,message,link,read,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data ?? []) as Notification[]);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const channel = supabase
      .channel(`notif:${user.id}`)
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

  if (!user) return null;

  return (
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
  );
};