import { useState, useRef, useEffect } from 'react';
import { Client } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ClientAutocompleteProps {
  value: string;
  onChange: (name: string) => void;
  onClientSelect: (client: Client | null) => void;
  className?: string;
  disabled?: boolean;
}

export function ClientAutocomplete({ 
  value, 
  onChange, 
  onClientSelect,
  className,
  disabled = false
}: ClientAutocompleteProps) {
  const { searchClients } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Client[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length >= 2) {
      const results = searchClients(value);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [value, searchClients]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (client: Client) => {
    onChange(client.name);
    onClientSelect(client);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    onClientSelect(null);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Input
        value={value}
        onChange={handleInputChange}
        onFocus={() => !disabled && value.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
        placeholder="Digite o nome da cliente"
        required
        disabled={disabled}
        className={disabled ? "bg-muted" : ""}
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() => handleSelect(client)}
              className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex flex-col"
            >
              <span className="font-medium text-foreground">{client.name}</span>
              {client.phone && (
                <span className="text-sm text-muted-foreground">{client.phone}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
