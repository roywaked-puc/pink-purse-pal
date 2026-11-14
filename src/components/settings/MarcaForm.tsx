import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ImagePlus, Trash2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserSettings, useUpdateUserSettings } from '@/hooks/useUserSettings';
import { useLogoUrl, useUploadLogo, useRemoverLogo, LOGO_TIPOS_ACEITOS, LOGO_TAMANHO_MAX } from '@/hooks/useMarca';
import { CORES_PRONTAS, MARCA_COR_PADRAO, HEX_VALIDO } from '@/lib/marca';
import { cn } from '@/lib/utils';

interface MarcaFormProps {
  onSaved?: () => void;
}

/**
 * Formulário da marca (nome do negócio, logo e cor principal) com prévia ao vivo.
 * Reutilizado na tela "Minha Marca" e no primeiro passo das boas-vindas.
 */
export function MarcaForm({ onSaved }: MarcaFormProps) {
  const { data: settings } = useUserSettings();
  const updateSettings = useUpdateUserSettings();
  const uploadLogo = useUploadLogo();
  const removerLogo = useRemoverLogo();
  const logoUrl = useLogoUrl();
  const { toast } = useToast();

  const [nome, setNome] = useState('');
  const [cor, setCor] = useState<string | null>(null);
  const [corPersonalizada, setCorPersonalizada] = useState(MARCA_COR_PADRAO);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewLocal, setPreviewLocal] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setNome(settings.nome_negocio ?? '');
      setCor(settings.cor_primaria);
      if (settings.cor_primaria) setCorPersonalizada(settings.cor_primaria);
    }
  }, [settings]);

  useEffect(() => {
    if (!arquivo) {
      setPreviewLocal(null);
      return;
    }
    const url = URL.createObjectURL(arquivo);
    setPreviewLocal(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  const corEfetiva = cor ?? MARCA_COR_PADRAO;
  const logoVisivel = previewLocal ?? logoUrl;
  const salvandoAlgo = salvando || uploadLogo.isPending || removerLogo.isPending;

  const handleArquivo = (file: File | null) => {
    if (!file) return;
    if (!LOGO_TIPOS_ACEITOS.includes(file.type)) {
      toast({
        title: 'Formato não aceito',
        description: 'Use uma imagem PNG, JPG ou WebP.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > LOGO_TAMANHO_MAX) {
      toast({
        title: 'Imagem muito grande',
        description: 'A logo pode ter no máximo 2 MB.',
        variant: 'destructive',
      });
      return;
    }
    setArquivo(file);
  };

  const handleRemoverLogo = async () => {
    setArquivo(null);
    if (settings?.logo_path) {
      try {
        await removerLogo.mutateAsync();
        toast({ title: 'Logo removida' });
      } catch (e) {
        toast({ title: 'Não foi possível remover', description: e instanceof Error ? e.message : undefined, variant: 'destructive' });
      }
    }
  };

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      if (arquivo) {
        await uploadLogo.mutateAsync(arquivo);
        setArquivo(null);
      }
      await updateSettings.mutateAsync({
        nome_negocio: nome.trim() || null,
        cor_primaria: cor,
      });
      toast({ title: 'Marca salva', description: 'Sua marca foi atualizada.' });
      onSaved?.();
    } catch (e) {
      toast({ title: 'Não foi possível salvar', description: e instanceof Error ? e.message : undefined, variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const selecionarCor = (hex: string | null) => {
    setCor(hex);
    if (hex) setCorPersonalizada(hex);
  };

  return (
    <div className="space-y-5">
      {/* Prévia ao vivo */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground mb-3">Prévia</p>
        <div className="flex items-center gap-3">
          {logoVisivel ? (
            <img
              src={logoVisivel}
              alt="Logo do negócio"
              className="h-12 w-12 rounded-full object-cover border border-border"
            />
          ) : (
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-semibold"
              style={{ backgroundColor: corEfetiva, color: '#fff' }}
            >
              {(nome.trim() || 'S')[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold truncate">{nome.trim() || 'Seu negócio'}</p>
            <span
              className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: corEfetiva }}
            >
              Botão de exemplo
            </span>
          </div>
        </div>
      </div>

      {/* Nome do negócio */}
      <div className="space-y-2">
        <Label htmlFor="nome-negocio">Nome do negócio</Label>
        <Input
          id="nome-negocio"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Studio Marcinha Cílios"
          maxLength={60}
        />
      </div>

      {/* Logo */}
      <div className="space-y-2">
        <Label>Logo</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => inputRef.current?.click()}
            disabled={salvandoAlgo}
          >
            <ImagePlus className="h-4 w-4 mr-2" />
            {logoVisivel ? 'Trocar logo' : 'Enviar logo'}
          </Button>
          {logoVisivel && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRemoverLogo}
              disabled={salvandoAlgo}
              aria-label="Remover logo"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          PNG, JPG ou WebP até 2 MB. A imagem é recortada em quadrado.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => handleArquivo(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Cor principal */}
      <div className="space-y-2">
        <Label>Cor principal</Label>
        <div className="grid grid-cols-4 gap-2">
          {CORES_PRONTAS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => selecionarCor(c.hex === MARCA_COR_PADRAO ? null : c.hex)}
              className={cn(
                'h-10 rounded-lg border-2 flex items-center justify-center transition-all',
                corEfetiva.toLowerCase() === c.hex.toLowerCase()
                  ? 'border-foreground scale-105'
                  : 'border-transparent',
              )}
              style={{ backgroundColor: c.hex }}
              aria-label={c.nome}
              title={c.nome}
            >
              {corEfetiva.toLowerCase() === c.hex.toLowerCase() && (
                <Check className="h-4 w-4 text-white" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Label htmlFor="cor-personalizada" className="text-sm font-normal text-muted-foreground shrink-0">
            Personalizada:
          </Label>
          <input
            id="cor-personalizada"
            type="color"
            value={corPersonalizada}
            onChange={(e) => {
              const hex = e.target.value.toUpperCase();
              setCorPersonalizada(hex);
              if (HEX_VALIDO.test(hex)) setCor(hex === MARCA_COR_PADRAO ? null : hex);
            }}
            className="h-9 w-14 rounded border border-border cursor-pointer bg-transparent"
          />
          <span className="text-xs text-muted-foreground">{corEfetiva}</span>
        </div>
        {cor !== null && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-0"
            onClick={() => selecionarCor(null)}
          >
            Voltar ao rosa padrão
          </Button>
        )}
      </div>

      <Button className="w-full" onClick={handleSalvar} disabled={salvandoAlgo}>
        {salvandoAlgo && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Salvar marca
      </Button>
    </div>
  );
}
