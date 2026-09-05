import { useEffect, useMemo, useState } from 'react';
import { differenceInCalendarDays } from 'date-fns';
import { Appointment, Service } from '@/types';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ServiceAutocomplete } from './ServiceAutocomplete';

const AVULSO_KEY = '__avulso__';

interface ServiceStepPickerProps {
  services: Service[];
  appointments: Appointment[];
  selectedClientId: string | null;
  date: Date;
  serviceText: string;
  onServiceTextChange: (value: string) => void;
  onServiceSelect: (service: Service | null) => void;
}

const isTechnique = (s: Service) =>
  Boolean(s.techniqueName) && (s.tierType === 'colocacao' || s.tierType === 'manutencao');

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const faixaLabel = (s: Service) => {
  if (s.diasMin != null && s.diasMax != null) return `${s.diasMin}–${s.diasMax} dias`;
  if (s.diasMax != null) return `até ${s.diasMax} dias`;
  if (s.diasMin != null) return `a partir de ${s.diasMin} dias`;
  return s.description;
};

export function ServiceStepPicker({
  services,
  appointments,
  selectedClientId,
  date,
  serviceText,
  onServiceTextChange,
  onServiceSelect,
}: ServiceStepPickerProps) {
  const [technique, setTechnique] = useState<string>('');
  const [tier, setTier] = useState<string>('');
  const [faixaId, setFaixaId] = useState<string>('');
  const [tierSuggestion, setTierSuggestion] = useState<'primeira' | 'fora_prazo' | null>(null);

  const techniques = useMemo(() => {
    const set = new Set<string>();
    services.filter(isTechnique).forEach((s) => set.add(s.techniqueName as string));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [services]);

  const techniqueServices = useMemo(
    () => services.filter((s) => isTechnique(s) && s.techniqueName === technique),
    [services, technique]
  );

  const availableTiers = useMemo(() => {
    const set = new Set<string>();
    techniqueServices.forEach((s) => set.add(s.tierType as string));
    return ['colocacao', 'manutencao'].filter((t) => set.has(t));
  }, [techniqueServices]);

  const faixas = useMemo(
    () =>
      techniqueServices
        .filter((s) => s.tierType === 'manutencao')
        .sort((a, b) => (a.diasMin ?? 0) - (b.diasMin ?? 0)),
    [techniqueServices]
  );

  // Dias desde o último atendimento da mesma técnica para o cliente selecionado
  const diasDesdeUltimo = useMemo(() => {
    if (!selectedClientId || !technique) return null;
    const previous = appointments
      .filter((a) => a.clientId === selectedClientId)
      .filter((a) => a.confirmationStatus !== 'cancelado')
      .filter((a) => new Date(a.date) < date)
      .filter((a) => {
        const svc = a.serviceId ? services.find((s) => s.id === a.serviceId) : undefined;
        return svc?.techniqueName === technique;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    if (!previous) return null;
    return differenceInCalendarDays(date, new Date(previous.date));
  }, [appointments, selectedClientId, technique, date, services]);

  // Maior dias_max entre as faixas de manutenção da técnica
  const maxDiasManutencao = useMemo(
    () => faixas.reduce((max, f) => Math.max(max, f.diasMax ?? 0), 0),
    [faixas]
  );

  // Etapa (b): oculta quando só existe um tipo
  useEffect(() => {
    if (technique && technique !== AVULSO_KEY && availableTiers.length === 1) {
      setTier(availableTiers[0]);
    }
  }, [technique, availableTiers]);

  // Etapa (b): sugestão automática do tipo
  // - sem atendimento anterior da técnica -> Colocação
  // - último atendimento fora do prazo de qualquer manutenção -> Colocação (com aviso)
  // - dentro do prazo -> Manutenção (a faixa é pré-selecionada na etapa seguinte)
  useEffect(() => {
    if (!technique || technique === AVULSO_KEY) return;
    if (availableTiers.length <= 1) return;
    if (tier) return;
    if (!selectedClientId) return;
    if (diasDesdeUltimo == null) {
      setTier('colocacao');
      setTierSuggestion('primeira');
    } else if (maxDiasManutencao > 0 && diasDesdeUltimo > maxDiasManutencao) {
      setTier('colocacao');
      setTierSuggestion('fora_prazo');
    } else {
      setTier('manutencao');
      setTierSuggestion(null);
    }
  }, [technique, availableTiers, tier, selectedClientId, diasDesdeUltimo, maxDiasManutencao]);

  // Colocação: só existe um serviço, seleciona automaticamente
  useEffect(() => {
    if (tier !== 'colocacao') return;
    const svc = techniqueServices.find((s) => s.tierType === 'colocacao');
    if (svc) {
      onServiceTextChange(svc.description);
      onServiceSelect(svc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, techniqueServices]);


  // Etapa (c): pré-seleção da faixa com base nos dias corridos
  useEffect(() => {
    if (tier !== 'manutencao' || faixas.length === 0) return;
    if (faixaId && faixas.some((f) => f.id === faixaId)) return;
    if (diasDesdeUltimo == null) return;
    const match = faixas.find(
      (f) =>
        (f.diasMin == null || diasDesdeUltimo >= f.diasMin) &&
        (f.diasMax == null || diasDesdeUltimo <= f.diasMax)
    );
    if (match) {
      setFaixaId(match.id);
      onServiceTextChange(match.description);
      onServiceSelect(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, faixas, diasDesdeUltimo]);

  const handleTechniqueChange = (value: string) => {
    setTechnique(value);
    setTier('');
    setFaixaId('');
    onServiceTextChange('');
    onServiceSelect(null);
  };

  const handleTierChange = (value: string) => {
    setTier(value);
    setFaixaId('');
    if (value === 'colocacao') {
      const svc = techniqueServices.find((s) => s.tierType === 'colocacao');
      if (svc) {
        onServiceTextChange(svc.description);
        onServiceSelect(svc);
        return;
      }
    }
    onServiceTextChange('');
    onServiceSelect(null);
  };

  const handleFaixaChange = (value: string) => {
    setFaixaId(value);
    const svc = faixas.find((f) => f.id === value);
    if (svc) {
      onServiceTextChange(svc.description);
      onServiceSelect(svc);
    }
  };

  const showTierStep = technique && technique !== AVULSO_KEY && availableTiers.length > 1;
  const showFaixaStep = technique && technique !== AVULSO_KEY && tier === 'manutencao';
  const showAvulso = technique === AVULSO_KEY || techniques.length === 0;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Técnica</Label>
        <Select value={technique} onValueChange={handleTechniqueChange}>
          <SelectTrigger>
            <SelectValue placeholder="Escolha a técnica" />
          </SelectTrigger>
          <SelectContent>
            {techniques.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
            <SelectItem value={AVULSO_KEY}>Outro / serviço avulso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showTierStep && (
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={tier} onValueChange={handleTierChange}>
            <SelectTrigger>
              <SelectValue placeholder="Colocação ou manutenção" />
            </SelectTrigger>
            <SelectContent>
              {availableTiers.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === 'colocacao' ? 'Colocação' : 'Manutenção'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showFaixaStep && (
        <div className="space-y-2">
          <Label>Faixa de dias</Label>
          <Select value={faixaId} onValueChange={handleFaixaChange}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha a faixa" />
            </SelectTrigger>
            <SelectContent>
              {faixas.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {faixaLabel(f)} — {formatCurrency(f.amount)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {diasDesdeUltimo != null && (
            <p className="text-xs text-muted-foreground">
              Último atendimento desta técnica há {diasDesdeUltimo}{' '}
              {diasDesdeUltimo === 1 ? 'dia' : 'dias'} — faixa sugerida automaticamente. Você pode
              trocar.
            </p>
          )}
        </div>
      )}

      {showAvulso && (
        <div className="space-y-2">
          <Label>Serviço</Label>
          <ServiceAutocomplete
            value={serviceText}
            onChange={onServiceTextChange}
            onServiceSelect={onServiceSelect}
          />
        </div>
      )}
    </div>
  );
}
