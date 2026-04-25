import { useEffect, useState } from "react";
import { Send, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Friend = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  courseId: string;
  courseTitle: string;
};

export const SendCourseDialog = ({ open, onOpenChange, courseId, courseTitle }: Props) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    (async () => {
      const { data: ids } = await supabase.rpc("get_friend_ids", { p_user_id: user.id });
      const friendIds = (ids ?? []).map((r: any) => r.friend_id);
      if (friendIds.length === 0) { setFriends([]); setLoading(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", friendIds)
        .order("display_name");
      setFriends((data ?? []) as Friend[]);
      setLoading(false);
    })();
  }, [open, user]);

  const send = async (recipient: Friend) => {
    setSendingTo(recipient.id);
    const { data, error } = await supabase.rpc("send_course_to_friend", {
      p_course_id: courseId,
      p_recipient_id: recipient.id,
    });
    setSendingTo(null);
    if (error) {
      const msg = error.message.includes("not_friends") ? "Vous n'êtes pas amis"
        : error.message.includes("already_pending") ? "Déjà envoyé, en attente"
        : "Envoi impossible";
      toast.error(msg);
      return;
    }
    const result = data as { success: boolean; error?: string };
    if (result?.error === "already_pending") {
      toast.info("Fiche déjà envoyée à cette personne");
    } else {
      toast.success(`Fiche envoyée à ${recipient.display_name ?? recipient.username ?? "ton ami"} 📨`);
      onOpenChange(false);
    }
  };

  const filtered = friends.filter((f) => {
    const q = search.toLowerCase();
    return (f.display_name ?? "").toLowerCase().includes(q)
      || (f.username ?? "").toLowerCase().includes(q);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>📨 Envoyer à un ami</DialogTitle>
          <DialogDescription>
            Partage « {courseTitle} » avec un ami. Il pourra accepter ou refuser.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un ami..."
            className="pl-9"
          />
        </div>

        <div className="max-h-80 overflow-y-auto -mx-2 px-2">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🫥</p>
              <p className="text-sm text-muted-foreground">
                Tu n'as pas encore d'amis. Va sur le Campus pour en ajouter.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun résultat</p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((f) => {
                const name = f.display_name ?? f.username ?? "Ami";
                const initial = name.slice(0, 1).toUpperCase();
                return (
                  <li key={f.id}>
                    <button
                      onClick={() => send(f)}
                      disabled={sendingTo !== null}
                      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-secondary transition disabled:opacity-50"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={f.avatar_url ?? undefined} />
                        <AvatarFallback>{initial}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-bold truncate">{name}</p>
                        {f.username && <p className="text-[11px] text-muted-foreground truncate">@{f.username}</p>}
                      </div>
                      {sendingTo === f.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
