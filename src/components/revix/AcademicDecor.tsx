import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A small piece of washi tape stuck on top of a card. */
export function Tape({ variant = "yellow", position = "top", className }: {
  variant?: "yellow" | "pink" | "mint";
  position?: "top" | "top-left" | "top-right";
  className?: string;
}) {
  const variantCls = variant === "pink" ? "tape-pink" : variant === "mint" ? "tape-mint" : "";
  const posCls = position === "top-left" ? "tape-left" : position === "top-right" ? "tape-right" : "";
  return <span className={cn("tape", variantCls, posCls, className)} aria-hidden />;
}

/** A pushpin (épingle). */
export const Pin = forwardRef<HTMLSpanElement, { color?: "red" | "blue" | "purple"; className?: string }>(function Pin({ color = "red", className }, ref) {
  const cls = color === "blue" ? "pin-blue" : color === "purple" ? "pin-purple" : "";
  return <span ref={ref} className={cn("pin", cls, className)} aria-hidden />;
});

/** A post-it note. */
export function Postit({ children, variant = "yellow", className }: {
  children: ReactNode;
  variant?: "yellow" | "pink";
  className?: string;
}) {
  return (
    <div className={cn("postit p-3 text-foreground/80 rounded-sm relative", variant === "pink" && "postit-pink", className)}>
      {children}
    </div>
  );
}

/** Hand-drawn underline beneath a heading. */
export const ScribbleUnderline = forwardRef<SVGSVGElement, { className?: string }>(function ScribbleUnderline({ className }, ref) {
  return (
    <svg
      ref={ref}
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      className={cn("scribble block w-full h-2 -mt-1", className)}
      aria-hidden
    >
      <path
        d="M2 7 Q 30 2, 60 6 T 120 6 T 198 5"
        fill="none"
        stroke="hsl(263 53% 51%)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
});

/** A small "stamp" rotated tag. */
export function Stamp({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("stamp inline-block", className)}>{children}</span>;
}

/** Hand-drawn arrow doodle. */
export function ArrowDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 30" className={cn("scribble", className)} aria-hidden>
      <path
        d="M2 24 Q 20 4, 50 14"
        fill="none"
        stroke="hsl(263 53% 51%)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M50 14 L 42 8 M50 14 L 44 22" fill="none" stroke="hsl(263 53% 51%)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}