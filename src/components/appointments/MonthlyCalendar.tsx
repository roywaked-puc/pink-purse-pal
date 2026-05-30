import { useMemo, useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addMonths, 
  subMonths, 
  isToday, 
  isSameDay,
  isSameMonth
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Check, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Appointment, ConfirmationStatus } from '@/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/contexts/AppContext';

interface MonthlyCalendarProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
}

const MAX_VISIBLE_APPOINTMENTS = 3;

const confirmationIcons = {
  pendente: Clock,
  confirmado: Check,
  atendido: CheckCheck,
  cancelado: X,
  retorno_previsto: Clock,
};

const confirmationColors: Record<ConfirmationStatus, string> = {
  pendente: 'text-muted-foreground',
  confirmado: 'text-emerald-600',
  atendido: 'text-blue-600',
  cancelado: 'text-destructive',
  retorno_previsto: 'text-orange-600',
};

const weekDayHeaders = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

export function MonthlyCalendar({ appointments, onAppointmentClick }: MonthlyCalendarProps) {
  const { getServiceById } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = useMemo(() => {
    const days = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [calendarStart, calendarEnd]);

  const monthAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= calendarStart && aptDate <= calendarEnd;
    });
  }, [appointments, calendarStart, calendarEnd]);

  const getAppointmentsForDay = (day: Date) => {
    return monthAppointments
      .filter(apt => isSameDay(new Date(apt.date), day))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-card rounded-xl border border-border shadow-soft">
      {/* Header Navigation */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDayHeaders.map((day) => (
          <div 
            key={day} 
            className="p-2 text-center border-l border-border first:border-l-0"
          >
            <p className="text-xs text-muted-foreground uppercase font-medium">
              {day}
            </p>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-7 auto-rows-fr">
          {calendarDays.map((day, index) => {
            const dayAppointments = getAppointmentsForDay(day);
            const hasMore = dayAppointments.length > MAX_VISIBLE_APPOINTMENTS;
            const visibleAppointments = dayAppointments.slice(0, MAX_VISIBLE_APPOINTMENTS);
            const remainingCount = dayAppointments.length - MAX_VISIBLE_APPOINTMENTS;
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <div 
                key={day.toISOString()} 
                className={cn(
                  "min-h-[100px] p-1 border-b border-l border-border",
                  index < 7 && "border-t-0",
                  index % 7 === 0 && "border-l-0",
                  !isCurrentMonth && "bg-muted/30",
                  isToday(day) && "bg-primary/10"
                )}
              >
                {/* Day Number */}
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 mb-1 rounded-full text-sm font-medium",
                  isToday(day) && "bg-primary text-primary-foreground",
                  !isCurrentMonth && "text-muted-foreground"
                )}>
                  {format(day, "d")}
                </div>

                {/* Appointments */}
                <div className="space-y-0.5">
                  {visibleAppointments.map((appointment) => {
                    const aptDate = new Date(appointment.date);
                    const service = appointment.serviceId ? getServiceById(appointment.serviceId) : undefined;
                    const serviceColor = service?.color;
                    const ConfirmationIcon = confirmationIcons[appointment.confirmationStatus] || Clock;
                    const confirmationColor = confirmationColors[appointment.confirmationStatus] || 'text-muted-foreground';

                    return (
                      <button
                        key={appointment.id}
                        onClick={() => onAppointmentClick(appointment)}
                        className={cn(
                          "w-full rounded px-1.5 py-0.5 text-left overflow-hidden transition-all hover:opacity-80 hover:ring-1 hover:ring-primary/50 border-l-2",
                          !serviceColor && "bg-muted/70 border-muted-foreground/30"
                        )}
                        style={serviceColor ? {
                          backgroundColor: `${serviceColor}20`,
                          borderLeftColor: serviceColor
                        } : undefined}
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          <ConfirmationIcon className={cn("w-2.5 h-2.5 flex-shrink-0", confirmationColor)} />
                          <span className="text-[11px] truncate">
                            {appointment.clientName}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {hasMore && (
                    <p className="text-[10px] text-muted-foreground pl-1">
                      +{remainingCount} mais
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}