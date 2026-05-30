import { useMemo, useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, MessageCircle, Check, CalendarCog } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useUpdateConfirmationStatus } from '@/hooks/useAppointments';
import { Appointment } from '@/types';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';

export function ReturnsToConfirmCard() {
  const { appointments, getClientById } = useApp();
  const { data: settings } = useUserSettings();
  const { mutate: updateStatus } = useUpdateConfirmationStatus();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  const reminderDays = settings?.retention_reminder_days ?? 3;

  const returnsToConfirm = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((a) => {
        if (a.confirmationStatus !== 'retorno_previsto') return false;
        const d = new Date(a.date);
        if (d < now) return false;
        return differenceInDays(d, now) <= reminderDays;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments, reminderDays]);

  if (returnsToConfirm.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full p-4 rounded-xl bg-orange-50 border border-orange-200 text-left hover:bg-orange-100 transition mb-6 flex items-center gap-3"
      >
        <div className="p-2 rounded-lg bg-orange-200 text-orange-700">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-orange-900">
            🔔 {returnsToConfirm.length}{' '}
            {returnsToConfirm.length === 1 ? 'retorno aguardando' : 'retornos aguardando'}{' '}
            confirmação
          </p>
          <p className="text-xs text-orange-700">
            Toque para confirmar com as clientes pelo WhatsApp.
          </p>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95%] sm:max-w-lg rounded-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Retornos para confirmar</DialogTitle>
            <DialogDescription>
              Próximos {reminderDays} dias — clique no WhatsApp para confirmar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {returnsToConfirm.map((a) => {
              const phone = a.clientId ? getClientById(a.clientId)?.phone : undefined;
              const cleanPhone = phone?.replace(/\D/g, '') || '';
              const msg = encodeURIComponent(
                `Olá ${a.clientName}! Confirmando seu retorno em ${format(
                  new Date(a.date),
                  "dd/MM 'às' HH:mm",
                  { locale: ptBR },
                )} para ${a.service}. Posso confirmar? ✨`,
              );
              const wa = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${msg}` : null;
              return (
                <div
                  key={a.id}
                  className="p-3 rounded-lg border border-border bg-card space-y-2"
                >
                  <div>
                    <p className="font-medium text-sm">{a.clientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(a.date), "EEE, dd/MM 'às' HH:mm", { locale: ptBR })} •{' '}
                      {a.service}
                    </p>
                    {phone && (
                      <p className="text-xs text-muted-foreground">{phone}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {wa && (
                      <Button asChild variant="outline" size="sm" className="text-green-700">
                        <a href={wa} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          WhatsApp
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => updateStatus({ id: a.id, status: 'confirmado' })}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(a);
                        setOpen(false);
                      }}
                    >
                      <CalendarCog className="w-4 h-4 mr-1" />
                      Remarcar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <AppointmentForm
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        appointment={editing}
      />
    </>
  );
}
