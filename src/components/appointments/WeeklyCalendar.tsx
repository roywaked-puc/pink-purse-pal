import { useMemo, useState } from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addWeeks, 
  subWeeks, 
  isToday, 
  isSameDay,
  addMinutes 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, User, FileText, Clock, Check, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Appointment, ConfirmationStatus } from '@/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/contexts/AppContext';

interface WeeklyCalendarProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
}

const START_HOUR = 7;
const END_HOUR = 21;
const HOUR_HEIGHT = 60; // pixels per hour

const getPaymentStatus = (appointment: Appointment) => {
  if (appointment.paidAmount >= appointment.amount) return 'pago';
  if (appointment.paidAmount > 0) return 'sinal';
  return 'nao_pago';
};

const confirmationIcons = {
  pendente: Clock,
  confirmado: Check,
  atendido: CheckCheck,
  cancelado: X,
};

const confirmationColors: Record<ConfirmationStatus, string> = {
  pendente: 'text-muted-foreground',
  confirmado: 'text-emerald-600',
  atendido: 'text-blue-600',
  cancelado: 'text-destructive',
};

const shortDayNames: Record<string, string> = {
  'segunda-feira': 'seg',
  'terça-feira': 'ter',
  'quarta-feira': 'qua',
  'quinta-feira': 'qui',
  'sexta-feira': 'sex',
  'sábado': 'sáb',
  'domingo': 'dom',
};

export function WeeklyCalendar({ appointments, onAppointmentClick }: WeeklyCalendarProps) {
  const { getServiceById } = useApp();
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  }, [weekStart]);

  const hours = useMemo(() => {
    const h = [];
    for (let i = START_HOUR; i <= END_HOUR; i++) {
      h.push(i);
    }
    return h;
  }, []);

  const weekAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= weekStart && aptDate <= weekEnd;
    });
  }, [appointments, weekStart, weekEnd]);

  const getAppointmentsForDay = (day: Date) => {
    return weekAppointments.filter(apt => isSameDay(new Date(apt.date), day));
  };

  const getAppointmentStyle = (appointment: Appointment) => {
    const aptDate = new Date(appointment.date);
    const hours = aptDate.getHours();
    const minutes = aptDate.getMinutes();
    
    const topOffset = (hours - START_HOUR) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
    const height = (appointment.duration / 60) * HOUR_HEIGHT;
    
    return {
      top: `${topOffset}px`,
      height: `${Math.max(height, 24)}px`,
    };
  };

  const goToPreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const goToToday = () => setCurrentWeek(new Date());

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-card rounded-xl border border-border shadow-soft">
      {/* Header Navigation */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {format(weekStart, "dd MMM", { locale: ptBR })} - {format(weekEnd, "dd MMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={goToNextWeek}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-[40px_repeat(7,1fr)] border-b border-border">
        <div className="p-1 sm:p-2" /> {/* Time column header */}
        {weekDays.map((day) => {
          const dayName = format(day, "EEEE", { locale: ptBR }).toLowerCase();
          const shortDay = shortDayNames[dayName] || format(day, "EEE", { locale: ptBR });
          
          return (
            <div 
              key={day.toISOString()} 
              className={cn(
                "p-1 sm:p-2 text-center border-l border-border",
                isToday(day) && "bg-primary/10"
              )}
            >
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase">
                {shortDay}
              </p>
              <p className={cn(
                "text-base sm:text-lg font-semibold",
                isToday(day) && "text-primary"
              )}>
                {format(day, "dd")}
              </p>
            </div>
          );
        })}
      </div>

      {/* Time Grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-[40px_repeat(7,1fr)] relative">
          {/* Time Labels */}
          <div className="relative">
            {hours.map((hour) => (
              <div 
                key={hour} 
                className="h-[60px] text-xs text-muted-foreground text-right pr-2 pt-0"
                style={{ lineHeight: '1' }}
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDays.map((day) => {
            const dayAppointments = getAppointmentsForDay(day);
            
            return (
              <div 
                key={day.toISOString()} 
                className={cn(
                  "relative border-l border-border",
                  isToday(day) && "bg-primary/5"
                )}
              >
                {/* Hour lines */}
                {hours.map((hour) => (
                  <div 
                    key={hour} 
                    className="h-[60px] border-b border-border/50"
                  />
                ))}

                {/* Appointments */}
                {dayAppointments.map((appointment) => {
                  const status = getPaymentStatus(appointment);
                  const aptDate = new Date(appointment.date);
                  const endTime = addMinutes(aptDate, appointment.duration);
                    const service = appointment.serviceId ? getServiceById(appointment.serviceId) : undefined;
                    const serviceColor = service?.color;
                    const ConfirmationIcon = confirmationIcons[appointment.confirmationStatus] || Clock;
                    const confirmationColor = confirmationColors[appointment.confirmationStatus] || 'text-muted-foreground';
                    
                    // Use service color if available, otherwise fall back to payment status colors
                    const bgStyle = serviceColor 
                      ? { backgroundColor: `${serviceColor}20`, borderLeftColor: serviceColor }
                      : undefined;
                  
                  return (
                    <button
                      key={appointment.id}
                      onClick={() => onAppointmentClick(appointment)}
                      className={cn(
                        "absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-left overflow-hidden transition-all hover:opacity-80 hover:ring-2 hover:ring-primary/50 border-l-2",
                        !serviceColor && "bg-muted/50 border-muted-foreground/30"
                      )}
                      style={{
                        ...getAppointmentStyle(appointment),
                        ...(serviceColor ? bgStyle : {})
                      }}
                    >
                      <p className="text-xs font-medium truncate">
                        {appointment.clientName}
                      </p>
                      <div className="flex items-center gap-0.5 min-w-0">
                        <ConfirmationIcon className={cn("w-2 h-2 flex-shrink-0", confirmationColor)} />
                        <span className="text-[10px] text-muted-foreground truncate">
                          {format(aptDate, "HH:mm")} - {format(endTime, "HH:mm")}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {appointment.service}
                      </p>
                      {appointment.notes && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <FileText className="w-2.5 h-2.5 flex-shrink-0 text-muted-foreground" />
                          <p className="text-[10px] text-muted-foreground italic truncate">
                            {appointment.notes}
                          </p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
