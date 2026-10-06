// Export des données personnelles (RGPD, article 20 : droit à la portabilité).
//
// Tout passe par le client Supabase de l'utilisateur connecté : les règles RLS
// ne laissent sortir que ses propres lignes, aucune clé serveur n'est utilisée.
// Chaque table est lue séparément ; une table illisible est notée dans le
// fichier au lieu de faire échouer tout l'export.
import { supabase } from "@/integrations/supabase/client";

/** Tables dont chaque ligne appartient à l'utilisateur via la colonne user_id. */
const USER_TABLES = [
  "courses",
  "quizzes",
  "quiz_questions",
  "quiz_attempts",
  "quiz_bank",
  "question_reviews",
  "planning_tasks",
  "coach_messages",
  "coach_saved_tips",
  "coach_conversation_state",
  "oral_sessions",
  "voice_notes",
  "notifications",
  "xp_events",
  "user_badges",
  "user_quests",
  "user_cosmetics",
  "user_inventory",
  "daily_loot_box",
  "duel_attempts",
  "room_members",
  "room_messages",
  "room_goals",
  "study_group_members",
  "subscriptions",
  "usage_counters",
] as const;

const ROW_LIMIT = 5000;

type Sb = { from: (t: string) => any };

export async function buildDataExport(userId: string) {
  const sb = supabase as unknown as Sb;
  const data: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  const read = async (key: string, query: PromiseLike<{ data: unknown; error: { message: string } | null }>) => {
    try {
      const { data: rows, error } = await query;
      if (error) errors[key] = error.message;
      else data[key] = rows;
    } catch (e) {
      errors[key] = e instanceof Error ? e.message : "lecture impossible";
    }
  };

  await read("profile", sb.from("profiles").select("*").eq("id", userId).maybeSingle());
  await Promise.all(
    USER_TABLES.map((t) => read(t, sb.from(t).select("*").eq("user_id", userId).limit(ROW_LIMIT))),
  );
  await read(
    "friendships",
    sb.from("friendships").select("*").or(`requester_id.eq.${userId},addressee_id.eq.${userId}`).limit(ROW_LIMIT),
  );
  await read("study_groups_owned", sb.from("study_groups").select("*").eq("owner_id", userId));
  await read("course_shares_sent", sb.from("course_shares").select("*").eq("sender_id", userId));
  await read("content_reports", sb.from("content_reports").select("*").eq("reporter_id", userId));
  await read("user_blocks", sb.from("user_blocks").select("blocked_id, created_at").eq("blocker_id", userId));

  return {
    format: "diplo-export-v1",
    exported_at: new Date().toISOString(),
    user_id: userId,
    note:
      "Copie de tes données enregistrées sur Diplo. Les fichiers PDF que tu as importés ne sont pas inclus : " +
      "écris-nous si tu en veux une copie. Les informations de paiement sont gérées par Stripe et n'ont jamais été stockées par Diplo.",
    data,
    errors,
  };
}

/** Construit l'export et déclenche le téléchargement d'un fichier JSON. */
export async function downloadDataExport(userId: string) {
  const payload = await buildDataExport(userId);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `diplo-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
