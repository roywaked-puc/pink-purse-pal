import { Bug, Copy, Lightbulb, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { EMAIL_SUPORTE } from '@/lib/constantes';

function mailto(assunto: string, corpo: string) {
  return `mailto:${EMAIL_SUPORTE}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}

export function CardFaleConosco() {
  const { user } = useAuth();
  const emailUsuaria = user?.email ?? '(não informado)';

  const relatar = () => {
    const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const corpo = `O que aconteceu:\n\n\nEm qual tela:\n\n\nO que eu esperava que acontecesse:\n\n\n---\nE-mail da conta: ${emailUsuaria}\nData e hora: ${agora}`;
    window.location.href = mailto('[Belafy] Problema no app', corpo);
  };

  const sugerir = () => {
    const corpo = `Minha sugestão:\n\n\nPor que isso me ajudaria:\n\n\n---\nE-mail da conta: ${emailUsuaria}`;
    window.location.href = mailto('[Belafy] Sugestão', corpo);
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL_SUPORTE);
      toast.success('E-mail copiado!');
    } catch {
      toast.error('Não foi possível copiar o e-mail.');
    }
  };

  return (
    <section className="mt-6 mb-24 md:mb-6 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold">Fale com a gente</p>
          <p className="text-sm text-muted-foreground">
            Encontrou um problema ou tem uma ideia para melhorar o app? Mande um e-mail.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        <Button variant="outline" onClick={relatar} className="min-h-11 w-full border-primary text-primary hover:bg-primary/10 hover:text-primary">
          <Bug className="h-4 w-4" /> Relatar um problema
        </Button>
        <Button variant="outline" onClick={sugerir} className="min-h-11 w-full border-primary text-primary hover:bg-primary/10 hover:text-primary">
          <Lightbulb className="h-4 w-4" /> Enviar sugestão
        </Button>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1">
        <span className="text-xs text-muted-foreground">{EMAIL_SUPORTE}</span>
        <Button variant="ghost" size="icon" onClick={copiar} aria-label="Copiar e-mail" className="h-11 w-11 text-muted-foreground">
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
