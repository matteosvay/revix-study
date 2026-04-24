import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Pin, Trash2 } from "lucide-react";
import { toast } from "sonner";

type SavedTip = { id: string; content: string; pinned: boolean; created_at: string };

export function SavedTipsTab() {
  const { user } = useAuth();
  const [tips, setTips] = useState<SavedTip[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("coach_saved_tips")
      .select("id, content, pinned, created_at")
      .eq("user_id", user.id)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });
    setTips((data ?? []) as SavedTip[]);
  };

  useEffect(() => { load(); }, [user]);

  const togglePin = async (t: SavedTip) => {
    await supabase.from("coach_saved_tips").update({ pinned: !t.pinned }).eq("id", t.id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("coach_saved_tips").delete().eq("id", id);
    setTips((ts) => ts.filter((t) => t.id !== id));
    toast.success("Conseil supprimé");
  };

  if (!tips.length) {
    return (
      <div className="postit p-5 rounded-md min-h-[140px] flex items-center justify-center text-center">
        <p className="font-hand text-lg text-foreground/70">
          Aucun conseil sauvegardé — pose une question au coach pour commencer 💬
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {tips.map((t, i) => (
        <div
          key={t.id}
          className={`postit ${i % 3 === 1 ? "postit-pink" : ""} p-3 rounded-md relative group`}
          style={{ transform: `rotate(${(i % 3) - 1}deg)` }}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="font-mono text-[9px] text-foreground/50">
              {new Date(t.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <button onClick={() => togglePin(t)} className="text-foreground/60 hover:text-primary">
                <Pin className={`h-3.5 w-3.5 ${t.pinned ? "fill-current text-primary" : ""}`} />
              </button>
              <button onClick={() => remove(t.id)} className="text-foreground/60 hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <p className="font-hand text-base leading-tight text-foreground">{t.content}</p>
        </div>
      ))}
    </div>
  );
}