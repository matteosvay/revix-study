import { useEffect } from "react";
import { playTick } from "@/lib/sfx";

/**
 * Joue un tic ultra-discret à chaque clic sur un élément interactif
 * (boutons, liens, onglets). Couvre toute l'app sans toucher chaque composant.
 * Un élément qui a déjà son propre son peut porter [data-nosfx] pour éviter le doublon.
 */
export function GlobalSound() {
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || typeof target.closest !== "function") return;
      const el = target.closest<HTMLElement>('button, a, [role="button"], [role="tab"], [data-sfx]');
      if (!el) return;
      if (el.closest("[data-nosfx]")) return;
      if ((el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true") return;
      playTick();
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, []);
  return null;
}
