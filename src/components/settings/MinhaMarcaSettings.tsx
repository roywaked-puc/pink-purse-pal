import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormSheet } from '@/components/ds/FormSheet';
import { MarcaForm } from '@/components/settings/MarcaForm';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useLogoUrl } from '@/hooks/useMarca';
import { MARCA_COR_PADRAO } from '@/lib/marca';
import { Pencil } from 'lucide-react';

/** Conteúdo do item "Minha Marca" nas Configurações: prévia + edição em sheet. */
export function MinhaMarcaSettings() {
  const { data: settings } = useUserSettings();
  const logoUrl = useLogoUrl();
  const [aberto, setAberto] = useState(false);

  const cor = settings?.cor_primaria ?? MARCA_COR_PADRAO;

  return (
    <div className="space-y-3 pb-2">
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo do negócio"
            className="h-10 w-10 rounded-full object-cover border border-border"
          />
        ) : (
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center font-semibold text-white"
            style={{ backgroundColor: cor }}
          >
            {(settings?.nome_negocio?.trim() || 'S')[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{settings?.nome_negocio || 'Sem nome definido'}</p>
          <p className="text-xs text-muted-foreground">Nome, logo e cor do seu negócio</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAberto(true)}>
          <Pencil className="h-4 w-4 mr-1" />
          Editar
        </Button>
      </div>

      <FormSheet
        open={aberto}
        onOpenChange={setAberto}
        title="Minha Marca"
        description="Como seu negócio aparece no app, nas fichas e nos PDFs"
        hideFooter
      >
        <MarcaForm onSaved={() => setAberto(false)} />
      </FormSheet>
    </div>
  );
}
