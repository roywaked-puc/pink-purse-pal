import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClientList } from '@/components/settings/ClientList';
import { ServiceList } from '@/components/settings/ServiceList';
import { CategoryList } from '@/components/settings/CategoryList';
import { AccountList } from '@/components/settings/AccountList';
import { ExportData } from '@/components/settings/ExportData';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { LogOut, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Configuracoes = () => {
  const { user, signOut } = useAuth();
  const { loading } = useApp();
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

      <div className="space-y-6">
        {/* User Info */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Conectado como</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
        
        <Separator />
        
        <ClientList />
        
        <Separator />
        
        <ServiceList />
        
        <Separator />
        
        <CategoryList />
        
        <Separator />
        
        <AccountList />
        
        <Separator />
        
        <ExportData />
      </div>
    </MainLayout>
  );
};

export default Configuracoes;
