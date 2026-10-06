"use client";

import { Camera, Trash2, UserRound } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

async function recortar(src: string, area: Area): Promise<Blob> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  canvas.getContext("2d")!.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, 512, 512);
  return new Promise((ok, erro) =>
    canvas.toBlob((b) => (b ? ok(b) : erro(new Error("falha ao gerar imagem"))), "image/webp", 0.9),
  );
}

/**
 * Escolher → recortar (quadrado) → preview. Chama onChange com o Blob 512×512
 * (o servidor reprocessa com sharp e remove metadados).
 */
export function FotoPicker({
  urlAtual,
  onChange,
  onRemover,
  disabled,
}: {
  urlAtual: string | null;
  onChange: (blob: Blob) => void;
  onRemover?: () => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const onComplete = useCallback((_: Area, px: Area) => setArea(px), []);

  const escolher = (f?: File) => {
    if (!f) return;
    setSrc(URL.createObjectURL(f));
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const confirmar = async () => {
    if (!src || !area) return;
    const blob = await recortar(src, area);
    setPreview(URL.createObjectURL(blob));
    setSrc(null);
    onChange(blob);
  };

  const mostrada = preview ?? urlAtual;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex size-36 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-brand-50 text-brand-700 shadow ring-1 ring-black/5">
        {mostrada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mostrada} alt="Foto do associado" className="size-full object-cover" />
        ) : (
          <UserRound className="size-16" />
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => input.current?.click()}>
          <Camera /> {mostrada ? "Trocar foto" : "Adicionar foto"}
        </Button>
        {mostrada && onRemover && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => {
              setPreview(null);
              onRemover();
            }}
          >
            <Trash2 /> Remover
          </Button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => {
          escolher(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <Dialog open={!!src} onOpenChange={(o) => !o && setSrc(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajustar foto</DialogTitle>
          </DialogHeader>
          <div className="relative h-80 overflow-hidden rounded-lg bg-black">
            {src && (
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onComplete}
              />
            )}
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-brand-600"
            aria-label="Zoom"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSrc(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmar}>
              Usar foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
