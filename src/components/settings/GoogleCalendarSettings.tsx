import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUserSettings, useUpdateUserSettings } from '@/hooks/useUserSettings';
import {
  useGoogleCalendar,
  useGetGoogleAuthUrl,
  useExchangeGoogleCode,
  useDisconnectGoogle,
} from '@/hooks/useGoogleCalendar';
import { Calendar, Check, ExternalLink, Loader2, Unlink, Save, Eye, EyeOff } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function GoogleCalendarSettings() {
  const { toast } = useToast();
  const { data: settings, isLoading: settingsLoading } = useUserSettings();
  const updateSettings = useUpdateUserSettings();
  const { isConnected, hasCredentials } = useGoogleCalendar();
  const getAuthUrl = useGetGoogleAuthUrl();
  const exchangeCode = useExchangeGoogleCode();
  const disconnect = useDisconnectGoogle();

  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  // Load saved credentials
  useEffect(() => {
    if (settings) {
      setClientId(settings.google_client_id || '');
      setClientSecret(settings.google_client_secret || '');
    }
  }, [settings]);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      
      exchangeCode.mutate(
        { code, redirectUri },
        {
          onSuccess: () => {
            toast({
              title: 'Conectado!',
              description: 'Google Calendar conectado com sucesso.',
            });
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
          },
          onError: (error) => {
            toast({
              title: 'Erro',
              description: 'Não foi possível conectar ao Google Calendar.',
              variant: 'destructive',
            });
            window.history.replaceState({}, '', window.location.pathname);
          },
        }
      );
    }
  }, []);

  const handleSaveCredentials = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o Client ID e Client Secret.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateSettings.mutateAsync({
        google_client_id: clientId.trim(),
        google_client_secret: clientSecret.trim(),
      });

      toast({
        title: 'Credenciais salvas!',
        description: 'Agora você pode conectar sua conta Google.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as credenciais.',
        variant: 'destructive',
      });
    }
  };

  const handleConnect = async () => {
    if (!clientId.trim()) {
      toast({
        title: 'Credenciais necessárias',
        description: 'Salve suas credenciais antes de conectar.',
        variant: 'destructive',
      });
      return;
    }

    const redirectUri = `${window.location.origin}${window.location.pathname}`;

    try {
      const { authUrl } = await getAuthUrl.mutateAsync({
        clientId: clientId.trim(),
        redirectUri,
      });

      window.location.href = authUrl;
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar a conexão.',
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect.mutateAsync();
      toast({
        title: 'Desconectado',
        description: 'Google Calendar foi desconectado.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível desconectar.',
        variant: 'destructive',
      });
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
        <Calendar className="h-8 w-8 text-primary" />
        <div className="flex-1">
          <p className="font-medium">Google Calendar</p>
          <p className="text-sm text-muted-foreground">
            Sincronize agendamentos automaticamente
          </p>
        </div>
        {isConnected ? (
          <div className="flex items-center gap-2 text-success">
            <Check className="h-5 w-5" />
            <span className="text-sm font-medium">Conectado</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Desconectado</span>
        )}
      </div>

      {/* Credentials Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="clientId">Client ID</Label>
          <Input
            id="clientId"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="seu-client-id.apps.googleusercontent.com"
            disabled={isConnected}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientSecret">Client Secret</Label>
          <div className="relative">
            <Input
              id="clientSecret"
              type={showSecret ? 'text' : 'password'}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="GOCSPX-..."
              disabled={isConnected}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowSecret(!showSecret)}
              disabled={isConnected}
            >
              {showSecret ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {!isConnected && (
          <Button
            onClick={handleSaveCredentials}
            disabled={updateSettings.isPending || !clientId.trim() || !clientSecret.trim()}
            className="w-full"
            variant="outline"
          >
            {updateSettings.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Credenciais
          </Button>
        )}
      </div>

      {/* Connect/Disconnect Button */}
      {isConnected ? (
        <Button
          onClick={handleDisconnect}
          disabled={disconnect.isPending}
          variant="destructive"
          className="w-full"
        >
          {disconnect.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Unlink className="h-4 w-4 mr-2" />
          )}
          Desconectar Google Calendar
        </Button>
      ) : (
        <Button
          onClick={handleConnect}
          disabled={getAuthUrl.isPending || exchangeCode.isPending || !hasCredentials}
          className="w-full"
        >
          {getAuthUrl.isPending || exchangeCode.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Calendar className="h-4 w-4 mr-2" />
          )}
          Conectar conta Google
        </Button>
      )}

      {/* Instructions */}
      <Accordion type="single" collapsible>
        <AccordionItem value="instructions" className="border-0">
          <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline py-2">
            <span className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Como obter as credenciais?
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>
                Acesse{' '}
                <a
                  href="https://console.cloud.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  console.cloud.google.com
                </a>
              </li>
              <li>Crie um projeto novo ou selecione um existente</li>
              <li>Ative a Google Calendar API em APIs e Serviços</li>
              <li>Configure a tela de consentimento OAuth</li>
              <li>Crie credenciais OAuth 2.0 (tipo: Aplicativo da Web)</li>
              <li>
                Adicione <code className="bg-muted px-1 rounded">{window.location.origin}</code> como URI de redirecionamento autorizada
              </li>
              <li>Copie o Client ID e Client Secret aqui</li>
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
