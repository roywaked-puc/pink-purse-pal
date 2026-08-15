import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { whatsappLink } from '@/lib/whatsapp';

interface Props {
  phone: string | undefined;
  message: string;
  size?: 'sm' | 'icon';
  label?: string;
}

export function WhatsAppButton({ phone, message, size = 'sm', label = 'WhatsApp' }: Props) {
  const link = whatsappLink(phone, message);
  if (!link) {
    return (
      <Button size={size} variant="outline" disabled title="Sem telefone cadastrado">
        <MessageCircle className="w-4 h-4" />
        {size !== 'icon' && <span className="ml-1">Sem telefone</span>}
      </Button>
    );
  }
  return (
    <Button
      asChild
      size={size}
      variant="outline"
      className="text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900"
    >
      <a href={link} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="w-4 h-4" />
        {size !== 'icon' && <span className="ml-1">{label}</span>}
      </a>
    </Button>
  );
}
