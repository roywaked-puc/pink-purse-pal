import type { Service } from '@/types';

export const COR_SERVICO_UVA = '#8E24AA';

export function getCorServico(
  servico?: Pick<Service, 'tierType' | 'color'> | null,
): string | undefined {
  return servico?.tierType === 'manutencao' ? COR_SERVICO_UVA : servico?.color;
}