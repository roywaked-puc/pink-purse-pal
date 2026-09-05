import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useUserSettings, useUpdateUserSettings } from '@/hooks/useUserSettings';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export function CaixaSettings() {
  const { data: settings, isLoading } = useUserSettings();
  const { mutateAsync, isPending } = useUpdateUserSettings();

  const [ativo, setAtivo] = useState(false);
  const [valor, setValor] = useState('0');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      setAtivo(settings.caixa_reserva_ativo);
      setValor(String(settings.caixa_reserva_valor ?? 0));
    }
  }, [settings]);

  // Primeira ativação: ainda não existe data de início gravada.
  const primeiraAtivacao = ativo && !settings?.caixa_inicio_em;

  const salvar = async () => {
    const parsed = parseFloat(valor.replace(',', '.'));
    try {
      await mutateAsync({
        caixa_reserva_ativo: ativo,
        caixa_reserva_valor: isFinite(parsed) ? parsed : 0,
        // Só grava a data de início na primeira ativação; nunca sobrescreve.
        ...(primeiraAtivacao ? { caixa_inicio_em: new Date().toISOString() } : {}),
      });
      toast.success('Separação de caixa salva');
    } catch (e: any) {
      toast.error('Erro ao salvar', { description: e?.message });
    }
  };

  const handleSave = async () => {
    const parsed = parseFloat(valor.replace(',', '.'));
    if (ativo && (!isFinite(parsed) || parsed <= 0)) {
      toast.error('Informe um valor de reserva maior que zero');
      return;
    }
    if (primeiraAtivacao) {
      setConfirmOpen(true);
      return;
    }
    await salvar();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 py-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="caixa-ativo">Separar caixa automaticamente</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Ao receber de um atendimento, uma parte fixa fica no caixa da empresa e o restante vai para o seu caixa pessoal.
          </p>
        </div>
        <Switch id="caixa-ativo" checked={ativo} onCheckedChange={setAtivo} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="caixa-valor">Valor reservado para a empresa por atendimento (R$)</Label>
        <Input
          id="caixa-valor"
          type="number"
          min={0}
          step="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="max-w-[160px]"
          disabled={!ativo}
        />
        <p className="text-xs text-muted-foreground">
          Se o valor recebido for menor que a reserva, tudo fica no caixa da empresa até completar. Atendimentos que já
          começaram a receber mantêm o valor de reserva que estava valendo no primeiro pagamento. Permutas não entram nessa divisão.
        </p>
      </div>

      <Button onClick={handleSave} disabled={isPending}>
        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Salvar
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Começar a separar o caixa agora?</AlertDialogTitle>
            <AlertDialogDescription>
              A partir de agora, o saldo da Empresa e o Pessoal vão considerar apenas os lançamentos feitos daqui pra
              frente — o saldo acumulado até hoje não será somado a esses cards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setAtivo(false);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setConfirmOpen(false);
                await salvar();
              }}
            >
              Ativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
