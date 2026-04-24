import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
export {
  ScribbleUnderline,
  ScribbleArrow,
  ScribbleCircle,
  ScribbleStar,
  ScribbleStamp,
  ScribbleCheck,
  ScribbleEmphasis,
} from "./Scribble";

/** Washi tape brutaliste — bloc plein bordé noir collé sur une carte. */
export function Tape({
  variant = "yellow",
  position = "top",
  className,
}: {
  variant?: "yellow" | "pink" | "mint" | "violet" | "orange";
  position?: "top" | "top-left" | "top-right";
  className?: string;
}) {
  const variantCls =
    variant === "pink" ? "tape-pink"
    : variant === "mint" ? "tape-mint"
    : variant === "violet" ? "tape-violet"
    : variant === "orange" ? "tape-orange"
    : "";
  const posCls = position === "top-left" ? "tape-left" : position === "top-right" ? "tape-right" : "";
  return <span className={cn("tape", variantCls, posCls, className)} aria-hidden />;
}

/** Punaise brutaliste — disque coloré bordé noir. */
export const Pin = forwardRef<HTMLSpanElement, { color?: "red" | "blue" | "purple" | "orange" | "green"; className?: string }>(
  function Pin({ color = "red", className }, ref) {
    const cls =
      color === "blue" ? "pin-blue"
      : color === "purple" ? "pin-purple"
      : color === "orange" ? "pin-orange"
      : color === "green" ? "pin-green"
      : "";
    return <span ref={ref} className={cn("pin", cls, className)} aria-hidden />;
  }
);

/** Post-it brutaliste — bord noir net, ombre dure, écriture Caveat. */
export function Postit({
  children,
  variant = "yellow",
  className,
}: {
  children: ReactNode;
  variant?: "yellow" | "pink";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "postit p-3 text-foreground rounded-sm relative",
        variant === "pink" && "postit-pink",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Stamp tag brutaliste (legacy compat — utilise plutôt ScribbleStamp). */
export function Stamp({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("stamp inline-block", className)}>{children}</span>;
}

/** Doodle flèche (legacy compat — utilise plutôt ScribbleArrow). */
export function ArrowDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 30" className={cn("scribble", className)} aria-hidden>
      <path
        d="M2 24 Q 20 4, 50 14"
        fill="none"
        stroke="hsl(var(--accent))"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M50 14 L 42 8 M50 14 L 44 22"
        fill="none"
        stroke="hsl(var(--accent))"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
