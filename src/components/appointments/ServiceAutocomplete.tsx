import { useState, useRef, useEffect } from 'react';
import { Service } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ServiceAutocompleteProps {
  value: string;
  onChange: (description: string) => void;
  onServiceSelect: (service: Service | null) => void;
  className?: string;
}

export function ServiceAutocomplete({ 
  value, 
  onChange, 
  onServiceSelect,
  className 
}: ServiceAutocompleteProps) {
  const { searchServices } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Service[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length >= 2) {
      const results = searchServices(value);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [value, searchServices]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (service: Service) => {
    onChange(service.description);
    onServiceSelect(service);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    onServiceSelect(null);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Input
        value={value}
        onChange={handleInputChange}
        onFocus={() => value.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
        placeholder="Digite o nome do serviço"
        required
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => handleSelect(service)}
              className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex flex-col"
            >
              <span className="font-medium text-foreground">{service.description}</span>
              <span className="text-sm text-primary font-semibold">{formatCurrency(service.amount)}</span>
              {service.notes && (
                <span className="text-xs text-muted-foreground">{service.notes}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
