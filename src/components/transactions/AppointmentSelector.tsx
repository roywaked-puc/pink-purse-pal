import { format } from 'date-fns';
import { Appointment } from '@/types';
import { cn } from '@/lib/utils';

interface AppointmentSelectorProps {
  appointments: Appointment[];
  selectedId: string | null;
  onSelect: (appointment: Appointment | null) => void;
}

export function AppointmentSelector({ 
  appointments, 
  selectedId, 
  onSelect 
}: AppointmentSelectorProps) {
  if (appointments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        Nenhum agendamento com saldo a receber para esta cliente.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {appointments.map((appointment) => {
        const balance = appointment.amount - appointment.paidAmount;
        const isSelected = selectedId === appointment.id;
        
        return (
          <button
            key={appointment.id}
            type="button"
            onClick={() => onSelect(isSelected ? null : appointment)}
            className={cn(
              "w-full p-3 rounded-lg border text-left transition-colors",
              isSelected 
                ? "border-primary bg-primary/10" 
                : "border-border hover:bg-accent"
            )}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-foreground">
                  {format(new Date(appointment.date), "dd/MM/yyyy 'às' HH:mm")}
                </p>
                <p className="text-sm text-muted-foreground">{appointment.service}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className="font-semibold text-foreground">
                  R$ {balance.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
