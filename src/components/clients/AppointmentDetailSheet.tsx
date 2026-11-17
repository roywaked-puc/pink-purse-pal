import { ReactNode, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, FileText, Wallet, Camera } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AppointmentChips } from '@/components/ds/AppointmentChips';
import { StatusBadge } from '@/components/ds/StatusBadge';
import { PhotoLightbox } from './PhotoLightbox';
import { useClientPhotos, type ClientPhotoWithUrls } from '@/hooks/useClientPhotos';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import type { Appointment, Transaction } from '@/types';
const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const paymentStatusLabels: Record<string, string> = { pago: 'Pago', nao_pago: 'Não pago', sinal: 'Sinal' };
export function AppointmentDetailSheet({
  appointment,
  onOpenChange,
  transactions,
  clientId,
}: {
  appointment: Appointment | null;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  clientId: string;
}) {
  const { data: userSettings } = useUserSettings();
  const { data: photos } = useClientPhotos(clientId);
  const { accounts, getServiceById } = useApp();
  const accountName = (t: Transaction) =>
    accounts.find((a) => a.id === (t.accountId ?? t.account))?.name;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const appointmentPhotos = useMemo(
    () => (photos ?? []).filter((p) => p.appointmentId === appointment?.id),
    [photos, appointment?.id],
  );

  if (!appointment) return null;

  const paymentStatus =
    appointment.paidAmount >= appointment.amount
      ? 'pago'
      : appointment.paidAmount > 0
        ? 'sinal'
        : 'nao_pago';
  const remaining = Math.max(appointment.amount - appointment.paidAmount, 0);

  const caixaAtivo = !!userSettings?.caixa_reserva_ativo;
  const reserva = appointment.caixaReservaValorAplicado ?? userSettings?.caixa_reserva_valor ?? 0;
  const showCaixaSplit =
    caixaAtivo && !appointment.isPermuta && appointment.paidAmount > 0 && reserva > 0;
  const caixaEmpresa = Math.min(appointment.paidAmount, reserva);
  const caixaPessoal = appointment.paidAmount - caixaEmpresa;

  const entradas = transactions
    .filter((t) => t.type === 'entrada')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Sheet open={!!appointment} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <AppointmentDetailContent
          appointment={appointment}
          paymentStatus={paymentStatus}
          remaining={remaining}
          showCaixaSplit={showCaixaSplit}
          caixaEmpresa={caixaEmpresa}
          caixaPessoal={caixaPessoal}
          entradas={entradas}
          photos={appointmentPhotos}
          serviceDescription={
            <AppointmentChips
              appointment={appointment}
              service={appointment.serviceId ? getServiceById(appointment.serviceId) : undefined}
            />
          }
          accountName={accountName}
          onOpenPhoto={(i) => {
            setLightboxIndex(i);
            setLightboxOpen(true);
          }}
        />
      </SheetContent>

      <PhotoLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        photos={appointmentPhotos}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
      />
    </Sheet>
  );
}

function AppointmentDetailContent({
  appointment,
  paymentStatus,
  remaining,
  showCaixaSplit,
  caixaEmpresa,
  caixaPessoal,
  entradas,
  photos,
  serviceDescription,
  accountName,
  onOpenPhoto,
}: {
  appointment: Appointment;
  paymentStatus: string;
  remaining: number;
  showCaixaSplit: boolean;
  caixaEmpresa: number;
  caixaPessoal: number;
  entradas: Transaction[];
  photos: ClientPhotoWithUrls[];
  serviceDescription: ReactNode;
  accountName: (t: Transaction) => string | undefined;
  onOpenPhoto: (index: number) => void;
}) {
  return (
    <>
      <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
        <SheetTitle className="text-lg">
          {format(new Date(appointment.date), "dd 'de' MMMM yyyy 'às' HH:mm", { locale: ptBR })}
        </SheetTitle>
        <SheetDescription>Detalhes do atendimento</SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Serviço */}
        <section className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Serviço
          </p>
           <div className="font-medium">{serviceDescription}</div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {appointment.duration} min
            </span>
            {appointment.parentAppointmentId && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                🔄 Retorno
              </span>
            )}
            {appointment.isPermuta && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                Permuta
              </span>
            )}
          </div>
        </section>

        {/* Status */}
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Situação
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={appointment.confirmationStatus} />
            <span
              className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-full',
                paymentStatus === 'pago' && 'status-paid',
                paymentStatus === 'nao_pago' && 'status-pending',
                paymentStatus === 'sinal' && 'status-today',
              )}
            >
              {paymentStatusLabels[paymentStatus]}
            </span>
          </div>
          <div className="text-sm space-y-0.5">
            <p>
              Valor: <span className="font-semibold">{formatCurrency(appointment.amount)}</span>
            </p>
            {appointment.paidAmount > 0 && (
              <p className="text-muted-foreground">
                Recebido: {formatCurrency(appointment.paidAmount)}
                {remaining > 0 && ` · falta ${formatCurrency(remaining)}`}
              </p>
            )}
          </div>
          {showCaixaSplit && (
            <p className="text-xs text-muted-foreground">
              Caixa empresa {formatCurrency(caixaEmpresa)} · Caixa pessoal{' '}
              {formatCurrency(caixaPessoal)}
            </p>
          )}
        </section>

        {/* Observações */}
        {appointment.notes && (
          <section className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Observações
            </p>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm italic text-muted-foreground whitespace-pre-line">
                {appointment.notes}
              </p>
            </div>
          </section>
        )}

        {/* Pagamentos */}
        {entradas.length > 0 && (
          <section className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" />
              Pagamentos recebidos
            </p>
            <div className="space-y-1.5">
              {entradas.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-card border border-border"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(t.date), 'dd/MM/yyyy', { locale: ptBR })}
                      {accountName(t) ? ` · ${accountName(t)}` : ''}
                    </p>
                    {t.description && (
                      <p className="text-sm truncate">{t.description}</p>
                    )}
                    {t.acertoPermutaId && <p className="text-xs text-primary">Acerto de permuta</p>}
                  </div>
                  <span className="text-sm font-semibold text-green-600 flex-shrink-0">
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Fotos */}
        {photos.length > 0 && (
          <section className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" />
              Fotos deste atendimento ({photos.length})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onOpenPhoto(i)}
                  className="aspect-square rounded-lg overflow-hidden border border-border"
                >
                  <img
                    src={p.thumbUrl}
                    alt={p.observation || 'Foto do atendimento'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
