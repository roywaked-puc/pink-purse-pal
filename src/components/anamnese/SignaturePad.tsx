import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';

interface Props {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
}

export function SignaturePad({ value, onChange, disabled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    // Set internal resolution
    const ratio = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * ratio;
    c.height = rect.height * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111';
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = value;
      setHasInk(true);
    }
  }, []); // eslint-disable-line

  const pos = (e: PointerEvent | React.PointerEvent) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return { x: (e as any).clientX - rect.left, y: (e as any).clientY - rect.top };
  };

  const start = (e: React.PointerEvent) => {
    if (disabled) return;
    drawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasInk(true);
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const c = canvasRef.current!;
    onChange(c.toDataURL('image/png'));
  };

  const clear = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg border-2 border-dashed border-border bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: 180, touchAction: 'none' }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {hasInk ? 'Assinatura registrada' : 'Assine no campo acima'}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={disabled}>
          <Eraser className="w-4 h-4 mr-1" /> Limpar
        </Button>
      </div>
    </div>
  );
}
