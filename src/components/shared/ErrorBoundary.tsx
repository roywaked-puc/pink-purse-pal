import { Component, ErrorInfo, ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Evita tela em branco quando a renderização quebra (ex.: um erro transitório
 * durante atualização ao vivo do dev server). Mostra um aviso simples em
 * português com botão para recarregar a tela.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erro na tela:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
          <div className="w-full max-w-sm text-center space-y-4">
            <TriangleAlert className="h-10 w-10 mx-auto text-primary" />
            <h1 className="text-lg font-semibold text-foreground">
              Algo deu errado na tela
            </h1>
            <p className="text-sm text-muted-foreground">
              Nenhum dado seu foi perdido. Recarregue a tela para continuar de
              onde parou.
            </p>
            <Button
              className="w-full"
              onClick={() => window.location.reload()}
            >
              Recarregar a tela
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
