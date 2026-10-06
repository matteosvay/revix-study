// Liste des élèves que l'utilisateur a bloqués, avec bloquer / débloquer.
// Les messages des personnes bloquées sont masqués, et la base refuse leurs
// demandes d'ami (règle « no friend request when blocked »).
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useBlocks() {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("user_blocks" as never).select("blocked_id");
    setBlocked(new Set(((data ?? []) as { blocked_id: string }[]).map((r) => r.blocked_id)));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const block = useCallback(async (id: string) => {
    const { error } = await supabase.from("user_blocks" as never).insert({ blocked_id: id } as never);
    if (!error) setBlocked((s) => new Set(s).add(id));
    return !error;
  }, []);

  const unblock = useCallback(async (id: string) => {
    const { error } = await supabase.from("user_blocks" as never).delete().eq("blocked_id", id);
    if (!error) setBlocked((s) => { const n = new Set(s); n.delete(id); return n; });
    return !error;
  }, []);

  return { blocked, isBlocked: (id: string) => blocked.has(id), block, unblock, reload: load };
}
