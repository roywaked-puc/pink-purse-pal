import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClientList } from '@/components/settings/ClientList';
import { ServiceList } from '@/components/settings/ServiceList';
import { CategoryList } from '@/components/settings/CategoryList';
import { AccountList } from '@/components/settings/AccountList';
import { ExportData } from '@/components/settings/ExportData';
import { ChangePasswordDialog } from '@/components/settings/ChangePasswordDialog';
import { GoogleCalendarSettings } from '@/components/settings/GoogleCalendarSettings';
import { RetentionSettings } from '@/components/settings/RetentionSettings';
import { CrmSettings } from '@/components/settings/CrmSettings';
import { AnamneseTemplatesSettings } from '@/components/settings/AnamneseTemplatesSettings';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { LogOut, Loader2, Users, Scissors, Tags, Landmark, Download, Calendar, Repeat, Heart, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const Configuracoes = () => {
  const { user, signOut } = useAuth();
  const { loading, clients, services, categories, accounts } = useApp();
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut();
    toast({
      title: 'Até logo!',
      description: 'Você saiu da sua conta.',
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title="Configurações"
        subtitle="Personalize seu app"
      />

      <div className="space-y-4">
        {/* User Info */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Conectado como</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <ChangePasswordDialog />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        <Accordion type="single" collapsible className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <AccordionItem value="clients" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-semibold">Clientes</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    {clients.length} cadastrados
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ClientList />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="services" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <Scissors className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-semibold">Serviços</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    {services.length} cadastrados
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ServiceList />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="categories" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <Tags className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-semibold">Categorias</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    {categories.length} cadastradas
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CategoryList />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="accounts" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <Landmark className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-semibold">Contas e Bancos</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    {accounts.length} cadastradas
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <AccountList />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="google-calendar" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-semibold">Google Calendar</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    Sincronização automática
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <GoogleCalendarSettings />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="retention" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <Repeat className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-semibold">Retenção de Clientes</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    Intervalos, lembretes e cores dos retornos
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <RetentionSettings />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="crm" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-semibold">CRM</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    Inativas, confirmação e VIPs
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CrmSettings />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="export" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-semibold">Exportar Dados</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    Backup em CSV
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ExportData />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </MainLayout>
  );
};

export default Configuracoes;
