import { FRAME_SRC, frameGlow, LEGENDARY_FRAMES } from "@/lib/cosmetics-assets";
import origineRing from "@/assets/cosmetics/frame_origine_ring.png";
import reineRing from "@/assets/cosmetics/frame_reine_ring.png";

type Size = "sm" | "md" | "lg" | "xl";

/** Outer wrapper sizes for the BELOW layer (ring img around the avatar). */
const RING_INSET: Record<Size, string> = {
  sm: "-inset-2",
  md: "-inset-3",
  lg: "-inset-4",
  xl: "-inset-5",
};

/** Outer wrapper sizes for the ABOVE layer (creator/queen overlays). */
const ABOVE_WRAP: Record<Size, string> = {
  sm: "-top-5 -left-3 -right-3 -bottom-3",
  md: "-top-8 -left-4 -right-4 -bottom-4",
  lg: "-top-12 -left-6 -right-6 -bottom-6",
  xl: "-top-16 -left-8 -right-8 -bottom-8",
};

/**
 * Renders the equipped frame overlay around the avatar.
 * - layer="below": the ring image (all generated frames render here).
 * - layer="above": creator/queen exclusives (frame_origine, frame_reine) only.
 */
export function FrameDecor({
  itemKey,
  size = "md",
  layer = "below",
}: {
  itemKey?: string | null;
  size?: Size;
  layer?: "below" | "above";
}) {
  if (!itemKey) return null;

  // ====== ABOVE LAYER ====== (creator + queen overlays)
  if (layer === "above") {
    if (itemKey === "frame_origine") {
      return (
        <div className={`absolute ${ABOVE_WRAP[size]} pointer-events-none z-0`}>
          <img
            src={origineRing}
            alt=""
            loading="lazy"
            width={1024}
            height={1024}
            draggable={false}
            className="block w-full h-full object-contain animate-cosmetic-breathe"
            style={{
              filter:
                "drop-shadow(0 0 6px hsl(45 100% 65% / 0.85)) " +
                "drop-shadow(0 0 18px hsl(38 100% 55% / 0.55)) " +
                "drop-shadow(0 4px 10px hsl(30 80% 25% / 0.45))",
            }}
          />
        </div>
      );
    }
    if (itemKey === "frame_reine") {
      return (
        <div className={`absolute ${ABOVE_WRAP[size]} pointer-events-none z-0`}>
          <img
            src={reineRing}
            alt=""
            loading="lazy"
            width={1024}
            height={1024}
            draggable={false}
            className="block w-full h-full object-contain animate-cosmetic-breathe"
            style={{
              filter:
                "drop-shadow(0 0 6px hsl(330 100% 80% / 0.85)) " +
                "drop-shadow(0 0 18px hsl(345 90% 65% / 0.5)) " +
                "drop-shadow(0 4px 10px hsl(340 60% 30% / 0.4))",
            }}
          />
        </div>
      );
    }
    return null;
  }

  // ====== BELOW LAYER ====== (generated ring image)
  // Skip if a creator/queen frame — those use the ABOVE layer.
  if (itemKey === "frame_origine" || itemKey === "frame_reine") return null;

  const src = FRAME_SRC[itemKey];
  if (!src) return null;

  const isLegendary = LEGENDARY_FRAMES.has(itemKey);

  return (
    <div className={`absolute ${RING_INSET[size]} pointer-events-none`}>
      <img
        src={src}
        alt=""
        loading="lazy"
        width={512}
        height={512}
        draggable={false}
        className={`block w-full h-full object-contain ${isLegendary ? "animate-cosmetic-breathe" : ""}`}
        style={{ filter: frameGlow(itemKey) }}
      />
    </div>
  );
}