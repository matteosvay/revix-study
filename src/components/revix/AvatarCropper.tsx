import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";

type Props = {
  file: File | null;
  open: boolean;
  onClose: () => void;
  onCropped: (blob: Blob) => Promise<void> | void;
};

const BOX = 280; // taille de la zone d'édition (px)
const OUT = 512; // taille de l'image de sortie (px)

export function AvatarCropper({ file, open, onClose, onCropped }: Props) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const pinchRef = useRef<{ d: number; s: number } | null>(null);

  useEffect(() => {
    if (!file) { setImgUrl(null); setImg(null); return; }
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    const i = new Image();
    i.onload = () => {
      const m = Math.max(BOX / i.width, BOX / i.height);
      setMinScale(m);
      setScale(m);
      setPos({ x: 0, y: 0 });
      setImg(i);
    };
    i.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const clamp = (x: number, y: number, s: number) => {
    if (!img) return { x, y };
    const w = img.width * s;
    const h = img.height * s;
    const maxX = (w - BOX) / 2;
    const maxY = (h - BOX) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setPos(clamp(dragRef.current.px + dx, dragRef.current.py + dy, scale));
  };
  const onPointerUp = () => { dragRef.current = null; };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    const next = Math.max(minScale, Math.min(minScale * 4, scale + delta));
    setScale(next);
    setPos(clamp(pos.x, pos.y, next));
  };

  const onScale = (v: number[]) => {
    const next = v[0];
    setScale(next);
    setPos(clamp(pos.x, pos.y, next));
  };

  const handleSave = async () => {
    if (!img) return;
    setSaving(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUT;
      canvas.height = OUT;
      const ctx = canvas.getContext("2d")!;
      // cercle de masque
      ctx.save();
      ctx.beginPath();
      ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      // mappage : la zone visible BOX correspond à OUT
      const ratio = OUT / BOX;
      const drawW = img.width * scale * ratio;
      const drawH = img.height * scale * ratio;
      const dx = OUT / 2 - drawW / 2 + pos.x * ratio;
      const dy = OUT / 2 - drawH / 2 + pos.y * ratio;
      ctx.drawImage(img, dx, dy, drawW, drawH);
      ctx.restore();
      const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.92)!);
      await onCropped(blob);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const w = img ? img.width * scale : 0;
  const h = img ? img.height * scale : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Recadrer la photo</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div
            className="relative overflow-hidden rounded-md bg-muted touch-none select-none"
            style={{ width: BOX, height: BOX }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
          >
            {imgUrl && img && (
              <img
                src={imgUrl}
                alt="à recadrer"
                draggable={false}
                style={{
                  position: "absolute",
                  width: w,
                  height: h,
                  left: (BOX - w) / 2 + pos.x,
                  top: (BOX - h) / 2 + pos.y,
                  maxWidth: "none",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            )}
            {/* overlay cercle */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                boxShadow: `0 0 0 9999px hsl(var(--background) / 0.75)`,
                borderRadius: "9999px",
              }}
            />
            <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-primary" />
          </div>

          <div className="w-full space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              Glisse pour positionner • molette ou curseur pour zoomer
            </p>
            <Slider
              min={minScale}
              max={minScale * 4}
              step={0.01}
              value={[scale]}
              onValueChange={onScale}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving || !img} className="gradient-primary border-0">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enregistrement...</> : "Valider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}