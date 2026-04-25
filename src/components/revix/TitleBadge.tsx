import { cn } from "@/lib/utils";
import { RARITY_TEXT, type Rarity } from "@/lib/cosmetics";

type Props = {
  itemKey?: string | null;
  name?: string | null;
  emoji?: string | null;
  rarity?: Rarity | null;
  className?: string;
  /** Tailwind text size classes (default text-xs) */
  size?: string;
};

/**
 * Renders a cosmetic title with a special animated style for the exclusive
 * "Owner" title (item_key === 'title_owner'). Falls back to the standard
 * rarity-coloured mono uppercase style for all other titles.
 */
export function TitleBadge({ itemKey, name, emoji, rarity, className, size = "text-xs" }: Props) {
  if (!name) return null;
  const isOwner = itemKey === "title_owner";

  if (isOwner) {
    return (
      <span className={cn("inline-flex items-center gap-1 truncate max-w-full", size, className)}>
        <span aria-hidden>👑</span>
        <span className="owner-title">{name}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "font-mono uppercase tracking-wider truncate max-w-full",
        size,
        RARITY_TEXT[(rarity ?? "common") as Rarity],
        className,
      )}
    >
      {emoji ? `${emoji} ` : ""}{name}
    </span>
  );
}