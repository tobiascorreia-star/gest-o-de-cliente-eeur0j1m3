import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full items-center justify-center flex-col gap-4 bg-background">
          <h2 className="text-2xl font-bold text-foreground">Oops, ocorreu um erro!</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Não foi possível carregar esta seção. Pode ser uma falha temporária de conexão ou um
            erro no sistema.
          </p>
          <button
            className="px-4 py-2 mt-2 bg-primary text-primary-foreground rounded-md transition-opacity hover:opacity-90 font-medium"
            onClick={() => window.location.reload()}
          >
            Tentar Novamente
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
