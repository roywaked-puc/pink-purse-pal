import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { avisoAssinatura } from '@/lib/assinatura';
import { Button } from '@/components/ui/button';
import { PaywallAssinatura } from './PaywallAssinatura';
export function AvisoAssinatura() {
  const { assinatura } = useApp();
  const [open, setOpen] = useState(false);
  const aviso = assinatura ? avisoAssinatura(assinatura) : null;
  if (!aviso) return null;
  return <><div className="mb-4 flex items-center gap-3 border border-border rounded-lg p-3 bg-muted/50"><p className="text-sm flex-1 min-w-0">{aviso}</p><Button variant="outline" className="min-h-11 shrink-0" onClick={() => setOpen(true)}>Assinar</Button></div><PaywallAssinatura open={open} onOpenChange={setOpen} /></>;
}