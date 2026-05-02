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
        <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
          <h2 className="text-2xl font-bold">Oops, ocorreu um erro!</h2>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md transition-opacity hover:opacity-90"
            onClick={() => window.location.reload()}
          >
            Recarregar página
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
