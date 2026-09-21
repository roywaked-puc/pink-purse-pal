import { Appointment, Service } from '@/types';

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const MAINTENANCE_KEYWORDS = ['manutencao', 'retorno'];

/** Returns the "base" of a service name (text before " - ", " – " or "—"). */
export function getServiceBase(name: string): string {
  return name.split(/\s[-–—]\s/)[0].trim();
}

/** Extracts the maintenance interval (in days) from the service name, if present. */
export function extractDaysFromName(name: string): number | null {
  const match = name.match(/(\d+)\s*dias?/i);
  return match ? parseInt(match[1], 10) : null;
}

export function isMaintenanceName(name: string): boolean {
  const n = normalize(name);
  return MAINTENANCE_KEYWORDS.some((k) => n.includes(k));
}

/** Monta a descrição visual do atendimento a partir do serviço estruturado atual. */
export function getAppointmentDescription(
  appointment: Pick<Appointment, 'service' | 'maintenanceNumber'>,
  service?: Service | null,
): string {
  if (!service?.techniqueName || !service.tierType || service.tierType === 'avulso') {
    return appointment.service;
  }

  const parts = [
    service.techniqueName,
    service.tierType === 'manutencao' ? 'Manutenção' : 'Colocação',
  ];

  if (service.diasMin != null && service.diasMax != null) {
    parts.push(`Faixa ${service.diasMin}–${service.diasMax} dias`);
  } else if (service.diasMax != null) {
    parts.push(`Faixa até ${service.diasMax} dias`);
  } else if (service.diasMin != null) {
    parts.push(`Faixa a partir de ${service.diasMin} dias`);
  }

  if (service.tierType === 'manutencao' && appointment.maintenanceNumber != null) {
    parts.push(`${appointment.maintenanceNumber}ª manutenção`);
  }

  return parts.join(' · ');
}

/**
 * Returns services that look like a maintenance/return for the given current service.
 * - Same "base" (text before separator)
 * - Name contains "manutenção" or "retorno"
 * - Excludes the current service itself
 */
export function findMaintenanceServices(
  currentServiceName: string,
  allServices: Service[],
): Service[] {
  const base = normalize(getServiceBase(currentServiceName));
  const currentNorm = normalize(currentServiceName);

  return allServices
    .filter((s) => {
      const desc = normalize(s.description);
      if (desc === currentNorm) return false;
      const sBase = normalize(getServiceBase(s.description));
      return sBase === base && isMaintenanceName(s.description);
    })
    .sort((a, b) => {
      const da = extractDaysFromName(a.description) ?? 9999;
      const db = extractDaysFromName(b.description) ?? 9999;
      return da - db;
    });
}
