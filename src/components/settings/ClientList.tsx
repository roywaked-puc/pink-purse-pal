import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, User, Phone, FileText, Repeat, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { useClients, useAddClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients';
import { Client } from '@/types';
import { toast } from 'sonner';

export function ClientList() {
  const { data: clients = [] } = useClients();
  const addClient = useAddClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [recurrenceDays, setRecurrenceDays] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');

  const resetForm = () => {
    setName('');
    setPhone('');
    setNotes('');
    setRecurrenceDays('');
    setBirthDate('');
    setEditingClient(null);
  };

  const handleOpenNew = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setPhone(client.phone);
    setNotes(client.notes || '');
    setRecurrenceDays(client.recurrenceDays ? String(client.recurrenceDays) : '');
    setBirthDate(client.birthDate || '');
    setFormOpen(true);
  };

  const handleDelete = (client: Client) => {
    setDeletingClient(client);
    setDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('O nome do cliente é obrigatório');
      return;
    }

    const recurrence = recurrenceDays.trim() ? parseInt(recurrenceDays, 10) : undefined;
    const payload = {
      name: name.trim(),
      phone,
      notes: notes.trim() || undefined,
      recurrenceDays: recurrence && recurrence > 0 ? recurrence : undefined,
    };

    try {
      if (editingClient) {
        await updateClient.mutateAsync({ id: editingClient.id, client: payload });
        toast.success('Cliente atualizado');
      } else {
        await addClient.mutateAsync(payload);
        toast.success('Cliente adicionado');
      }
      setFormOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Erro ao salvar cliente');
    }
  };

  const confirmDelete = async () => {
    if (!deletingClient) return;

    try {
      await deleteClient.mutateAsync(deletingClient.id);
      toast.success('Cliente excluído');
      setDeleteOpen(false);
      setDeletingClient(null);
    } catch (error) {
      toast.error('Erro ao excluir cliente. Verifique se não há agendamentos vinculados.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={handleOpenNew}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      <div className="space-y-2">
        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum cliente cadastrado
          </p>
        ) : (
          clients.map((client) => (
            <div
              key={client.id}
              className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
            >
              <Link
                to={`/cliente/${client.id}`}
                className="flex-1 min-w-0 group"
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium truncate group-hover:text-primary transition-colors">{client.name}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{client.phone}</span>
                  </div>
                )}
                {client.recurrenceDays && (
                  <div className="flex items-center gap-2 mt-1">
                    <Repeat className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      Retorno a cada {client.recurrenceDays} dias
                    </span>
                  </div>
                )}
                {client.notes && (
                  <div className="flex items-start gap-2 mt-1">
                    <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-muted-foreground italic line-clamp-2">
                      {client.notes}
                    </span>
                  </div>
                )}
              </Link>
              <div className="flex gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEdit(client)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(client)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-[95%] sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Cliente <span className="text-destructive">*</span></Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                type="tel"
              />
            </div>

            <div className="space-y-2">
              <Label>Retorno sugerido (dias)</Label>
              <Input
                value={recurrenceDays}
                onChange={(e) => setRecurrenceDays(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 21"
                type="text"
                inputMode="numeric"
              />
              <p className="text-xs text-muted-foreground">
                Usado para sugerir o próximo agendamento na ficha do cliente.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Prefere horário da manhã, alergia a esmalte..."
                rows={3}
                className="resize-none"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingClient ? 'Salvar' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir cliente?"
        description={`Tem certeza que deseja excluir "${deletingClient?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
