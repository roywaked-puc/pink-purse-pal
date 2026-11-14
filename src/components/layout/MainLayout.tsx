import { ReactNode, useEffect } from 'react';
import { BottomNav } from './BottomNav';
import { BoasVindasSheet } from '@/components/onboarding/BoasVindasSheet';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useLogoUrl } from '@/hooks/useMarca';
import { aplicarTema } from '@/lib/marca';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { data: settings } = useUserSettings();
  const logoUrl = useLogoUrl();

  // Aplica o tema da marca assim que as configurações carregam.
  useEffect(() => {
    if (settings) {
      aplicarTema(settings.cor_primaria);
    }
  }, [settings?.cor_primaria, settings]);

  const temMarca = !!(settings?.nome_negocio || logoUrl);

  return (
    <div className="min-h-screen bg-background">
      {temMarca && (
        <div className="px-4 pt-4 max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Logo do negócio"
                className="h-8 w-8 rounded-full object-cover border border-border"
              />
            )}
            {settings?.nome_negocio && (
              <span className="font-semibold text-foreground truncate">{settings.nome_negocio}</span>
            )}
          </div>
        </div>
      )}
      <main className="pb-20 px-4 pt-6 max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        {children}
      </main>
      <BottomNav />
      <BoasVindasSheet />
    </div>
  );
}
