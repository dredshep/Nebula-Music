import React, { ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Use React.Component explicitly to resolve inheritance issues where state and props are not recognized
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Fix: Explicitly declare state and props properties to satisfy TypeScript compiler when inheritance members are not recognized
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Initializing state in constructor; TypeScript recognizes this.state via React.Component generics
    this.state = {
      hasError: false,
      error: null
    };
    // Ensure props are correctly assigned for the local property declaration
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    // Accessing state property inherited from React.Component
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-8 text-center">
          <div className="max-w-md">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h1>
            <p className="text-neutral-400 mb-6">The application encountered an error and could not load.</p>
            <pre className="bg-black/50 p-4 rounded-lg text-left text-xs font-mono overflow-auto mb-6 border border-white/10">
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    // Accessing props property inherited from React.Component
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);