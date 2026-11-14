import { HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function BotaoAjuda({ secao }: { secao: string }) {
  const navigate = useNavigate();
  return (
    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground" aria-label="Ajuda" title="Ajuda" onClick={() => navigate(`/ajuda#${secao}`)}>
      <HelpCircle className="w-5 h-5" />
    </Button>
  );
}
