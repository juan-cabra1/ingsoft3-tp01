import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        // Report to Sentry
        import('@sentry/react').then(Sentry => {
            Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
        }).catch(() => {});
        // Report to backend (appears in Railway logs)
        import('../services/api').then(({ api }) => {
            api.reportError({
                message: error.message,
                stack: error.stack || '',
                source: 'ErrorBoundary',
            });
        }).catch(() => {});
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">¡Ups! Algo salió mal</h1>
                    <p className="text-[#a0a0a0] max-w-md mb-8">
                        Ha ocurrido un error inesperado en la aplicación. No te preocupes, ya estamos trabajando para solucionarlo.
                    </p>
                    <button
                        onClick={this.handleReload}
                        className="btn-primary"
                    >
                        Recargar página
                    </button>
                    <p className="mt-8 text-xs text-[#404040] font-mono">
                        {this.state.error && this.state.error.toString()}
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
