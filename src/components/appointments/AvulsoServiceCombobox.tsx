import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Service } from '@/types';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Props {
  services: Service[];
  value: string;
  selectedId: string | null;
  onSelect: (service: Service) => void;
  onFreeText: (text: string) => void;
}

/** Combobox pesquisável de serviços avulsos (Drawer no celular). */
export function AvulsoServiceCombobox({ services, value, selectedId, onSelect, onFreeText }: Props) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const avulsos = useMemo(
    () => services.filter(s => !s.possuiManutencao && !s.servicoPaiId).sort((a, b) => a.description.localeCompare(b.description, 'pt-BR')),
    [services],
  );
  const term = search.trim();
  const exists = avulsos.some(s => s.description.toLowerCase() === term.toLowerCase());

  const list = (
    <Command>
      <CommandInput placeholder="Buscar serviço..." value={search} onValueChange={setSearch} className="h-11" />
      <CommandList className="max-h-[50vh]">
        <CommandEmpty>Nenhum serviço encontrado</CommandEmpty>
        {term && !exists && (
          <CommandGroup>
            <CommandItem value={`__livre__${term}`} className="min-h-11" onSelect={() => { onFreeText(term); setOpen(false); setSearch(''); }}>
              <Plus className="h-4 w-4 mr-2" />Usar "{term}" como serviço avulso
            </CommandItem>
          </CommandGroup>
        )}
        <CommandGroup>
          {avulsos.map(s => (
            <CommandItem key={s.id} value={s.description} className="min-h-11 justify-between" onSelect={() => { onSelect(s); setOpen(false); setSearch(''); }}>
              <span className="flex items-center gap-2 min-w-0">
                <Check className={cn('h-4 w-4 shrink-0', selectedId === s.id ? 'opacity-100' : 'opacity-0')} />
                <span className="truncate">{s.description}</span>
              </span>
              <span className="text-sm font-semibold text-primary shrink-0">{formatBRL(s.amount)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  const trigger = (
    <Button type="button" variant="outline" role="combobox" className="w-full h-11 justify-between font-normal" onClick={() => setOpen(true)}>
      <span className={cn('truncate', !value && 'text-muted-foreground')}>{value || 'Escolha ou digite o serviço'}</span>
      <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
    </Button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader><DrawerTitle>Serviço avulso</DrawerTitle></DrawerHeader>
            <div className="px-2 pb-4">{list}</div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">{list}</PopoverContent>
    </Popover>
  );
}
