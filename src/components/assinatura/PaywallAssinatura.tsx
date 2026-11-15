import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { useAssinarPro } from '@/hooks/useAssinatura';

export function PaywallAssinatura({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [periodicidade, setPeriodicidade] = useState<'mensal' | 'anual'>('mensal');
  const assinar = useAssinarPro();
  return <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
    <DrawerContent className="max-h-[90dvh] mx-auto max-w-lg">
      <DrawerHeader><DrawerTitle>Continue com o Pro</DrawerTitle><DrawerDescription>Agendamentos ilimitados. Seus dados e os demais recursos continuam disponíveis.</DrawerDescription></DrawerHeader>
      <div className="px-4 overflow-y-auto space-y-4">
        <p className="text-sm flex gap-2 items-center"><Check className="h-4 w-4 text-primary" />Crie novos agendamentos sem interrupções</p>
        <RadioGroup value={periodicidade} onValueChange={v => setPeriodicidade(v === 'anual' ? 'anual' : 'mensal')} className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 border rounded-lg p-3 min-h-11 cursor-pointer"><RadioGroupItem value="mensal" /><span><span className="block font-semibold">Mensal</span><span className="text-sm">R$ 39,90/mês</span></span></label>
          <label className="flex items-center gap-2 border rounded-lg p-3 min-h-11 cursor-pointer"><RadioGroupItem value="anual" /><span><span className="block font-semibold">Anual</span><span className="text-sm">R$ 359,00/ano</span><span className="block text-xs text-muted-foreground">À vista</span></span></label>
        </RadioGroup>
      </div>
      <DrawerFooter>
        <Button className="min-h-11" disabled={assinar.isPending} onClick={() => assinar.mutate(periodicidade, { onError: e => toast.error(e.message) })}>{assinar.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Assinar Pro</Button>
        <Button variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>Agora não</Button>
        <div className="flex justify-center gap-4"><Button variant="link" asChild><Link to="/termos" target="_blank">Termos de Uso</Link></Button><Button variant="link" asChild><Link to="/privacidade" target="_blank">Privacidade</Link></Button></div>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>;
}