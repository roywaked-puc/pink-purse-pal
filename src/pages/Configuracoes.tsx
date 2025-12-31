import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ServiceList } from '@/components/settings/ServiceList';
import { CategoryList } from '@/components/settings/CategoryList';
import { AccountList } from '@/components/settings/AccountList';
import { Separator } from '@/components/ui/separator';

const Configuracoes = () => {
  return (
    <MainLayout>
      <PageHeader
        title="Configurações"
        subtitle="Personalize seu app"
      />

      <div className="space-y-6">
        <ServiceList />
        
        <Separator />
        
        <CategoryList />
        
        <Separator />
        
        <AccountList />
      </div>
    </MainLayout>
  );
};

export default Configuracoes;
