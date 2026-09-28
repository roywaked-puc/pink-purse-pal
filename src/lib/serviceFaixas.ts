import { Service } from '@/types';

export interface FaixaCalculada {
  id?: string;
  de: number;
  ate: number;
  amount: number;
  duration: number;
}

/** Ordena faixas por "até" e calcula o "de" (fim anterior + 1; a 1ª começa em 1). */
export function calcularFaixas<T extends { ate: number }>(faixas: T[]): (T & { de: number })[] {
  const sorted = [...faixas].sort((a, b) => a.ate - b.ate);
  let prev = 0;
  return sorted.map((f) => {
    const item = { ...f, de: prev + 1 };
    prev = f.ate;
    return item;
  });
}

/** Retorna as faixas de manutenção de um serviço, ordenadas e com de/até calculados. */
export function getFaixasDoServico(serviceId: string, services: Service[]): FaixaCalculada[] {
  return calcularFaixas(
    services
      .filter((s) => s.servicoPaiId === serviceId && s.manutencaoAteDias != null)
      .map((s) => ({ id: s.id, ate: s.manutencaoAteDias!, amount: s.amount, duration: s.duration })),
  );
}

export function faixaDescription(nomePai: string, ate: number) {
  return `${nomePai.trim()} - manutenção de ${ate} dias`;
}
