import { Check } from 'lucide-react';
import { ConfirmationStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';

interface StatusPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: ConfirmationStatus;
  title: string;
  description?: string;
  onSelect: (status: ConfirmationStatus) => void;
}

const OPCOES: { value: ConfirmationStatus; label: string; dica: string; dot: string }[] = [
  { value: 'pendente', label: 'Pendente', dica: 'Ainda não confirmou presença', dot: 'bg-amber-500' },
  { value: 'confirmado', label: 'Confirmado', dica: 'Cliente confirmou presença', dot: 'bg-blue-500' },
  { value: 'atendido', label: 'Atendido', dica: 'Em seguida abre as fotos', dot: 'bg-emerald-500' },
  { value: 'retorno_previsto', label: 'Retorno previsto', dica: 'Retorno sugerido, falta confirmar', dot: 'bg-orange-500' },
  { value: 'cancelado', label: 'Cancelado', dica: 'Libera o horário · pede confirmação', dot: 'bg-muted-foreground' },
];

/** Bottom sheet para trocar a situação de um agendamento com um toque. */
export function StatusPickerSheet({ open, onOpenChange, current, title, description, onSelect }: StatusPickerSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85dvh]">
        <div className="w-full max-w-lg mx-auto overflow-y-auto pb-6">
          <DrawerHeader className="text-left">
            <DrawerTitle>Situação do atendimento</DrawerTitle>
            <DrawerDescription className="break-words">
              {title}{description ? ` · ${description}` : ''}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 flex flex-col gap-1">
            {OPCOES.map((opcao) => {
              const isAtual = opcao.value === current;
              return (
                <div key={opcao.value}>
                  {opcao.value === 'cancelado' && <div className="border-t border-border my-2" />}
                  <button
                    type="button"
                    onClick={() => onSelect(opcao.value)}
                    aria-current={isAtual ? 'true' : undefined}
                    className={cn(
                      'w-full min-h-[56px] flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted',
                      isAtual && 'bg-primary/10 hover:bg-primary/10',
                    )}
                  >
                    <span className={cn('w-3 h-3 rounded-full shrink-0', opcao.dot)} aria-hidden="true" />
                    <span className="flex-1 min-w-0 flex flex-col">
                      <span className={cn('text-[15px] font-semibold', opcao.value === 'cancelado' && 'text-destructive')}>
                        {opcao.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{opcao.dica}</span>
                    </span>
                    {isAtual && <Check className="w-5 h-5 text-primary shrink-0" aria-label="Situação atual" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
