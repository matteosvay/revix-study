import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Repeat, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function ReviewCard() {
  const { user } = useAuth();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { count: c } = await supabase
        .from("question_reviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .lte("due_at", today);
      setCount(c ?? 0);
    })();
  }, [user]);

  if (count === null || count === 0) return null;

  return (
    <Link
      to="/app/revision"
      className="block relative overflow-hidden rounded-md border-[2.5px] border-foreground bg-card p-4 mb-3 shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-sm transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-md gradient-primary border-[2.5px] border-foreground flex items-center justify-center text-primary-foreground shrink-0">
          <Repeat className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="font-serif text-lg leading-none">Révisions du jour</p>
          <p className="text-xs text-muted-foreground mt-1">
            {count} question{count > 1 ? "s" : ""} à revoir · spaced repetition
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </Link>
  );
}