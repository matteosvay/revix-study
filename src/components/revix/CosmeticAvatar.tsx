import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { frameStyle } from "@/lib/cosmetics";
import { cn } from "@/lib/utils";
import { FrameDecor } from "@/components/revix/cosmetics/FrameDecor";
import { StickerDecor, hasCustomSticker } from "@/components/revix/cosmetics/StickerDecor";

type Size = "sm" | "md" | "lg" | "xl";
const SIZE: Record<Size, string> = {
  sm: "h-10 w-10 text-sm",
  md: "h-14 w-14 text-base",
  lg: "h-20 w-20 text-xl",
  xl: "h-28 w-28 text-2xl",
};
const STICKER_SIZE: Record<Size, string> = {
  sm: "text-base -bottom-1 -right-1",
  md: "text-xl -bottom-1 -right-1",
  lg: "text-2xl -bottom-1 -right-1",
  xl: "text-3xl bottom-0 right-0",
};

export function CosmeticAvatar({
  avatarUrl,
  fallback,
  frame,
  sticker,
  stickerKey,
  size = "md",
  className,
}: {
  avatarUrl?: string | null;
  fallback: string;
  frame?: string | null;
  sticker?: string | null;
  stickerKey?: string | null;
  size?: Size;
  className?: string;
}) {
  const f = frameStyle(frame);
  return (
    <div className={cn("relative inline-flex rounded-full", f.className, className)} style={f.style}>
      {/* Animated SVG/PNG decor BEHIND the avatar so the photo stays in front */}
      <FrameDecor itemKey={frame} size={size} />
      <Avatar className={cn(SIZE[size], "border-2 border-background relative z-10")}>
        {avatarUrl && <AvatarImage src={avatarUrl} alt={fallback} className="object-cover" />}
        <AvatarFallback className="gradient-primary text-primary-foreground font-bold">
          {fallback}
        </AvatarFallback>
      </Avatar>
      {sticker && (
        <span className={cn("absolute leading-none drop-shadow-md select-none z-20", STICKER_SIZE[size])} aria-hidden>
          {hasCustomSticker(stickerKey)
            ? <StickerDecor itemKey={stickerKey} className="block w-[1em] h-[1em]" />
            : sticker}
        </span>
      )}
    </div>
  );
}
