import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; error: Error | null };

/**
 * Global Error Boundary — catches React render errors and shows a
 * neo-brutalist error screen instead of a blank page.
 *
 * Usage: wrap <App /> or individual route segments.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console in dev — replace with Sentry/LogRocket in production
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center p-6"
          style={{ background: "hsl(var(--background))" }}>
          <div className="max-w-md w-full border-[2.5px] border-foreground bg-card p-8 rounded-md"
            style={{ boxShadow: "var(--shadow-brutal)" }}>
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="h-16 w-16 rounded-md border-[2.5px] border-foreground flex items-center justify-center"
                style={{ background: "hsl(var(--destructive))" }}>
                <AlertTriangle className="h-8 w-8 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Title */}
            <h1 className="font-serif text-2xl text-center mb-2"
              style={{ color: "hsl(var(--foreground))" }}>
              Oups, quelque chose a planté 😵
            </h1>

            {/* Message */}
            <p className="text-sm text-center mb-1"
              style={{ color: "hsl(var(--muted-foreground))" }}>
              Pas de panique — tes données sont en sécurité.
            </p>
            <p className="text-xs text-center mb-6 font-mono"
              style={{ color: "hsl(var(--muted-foreground))" }}>
              {this.state.error?.message?.slice(0, 120) ?? "Erreur inconnue"}
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md border-[2.5px] border-foreground font-medium text-sm transition-all hover:translate-x-[1px] hover:translate-y-[1px]"
                style={{
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  boxShadow: "var(--shadow-brutal-sm)",
                }}
              >
                <RefreshCw className="h-4 w-4" strokeWidth={2.5} />
                Réessayer
              </button>
              <button
                onClick={() => { window.location.href = "/app"; }}
                className="w-full px-4 py-2.5 rounded-md border-[2.5px] border-foreground font-medium text-sm transition-all hover:translate-x-[1px] hover:translate-y-[1px]"
                style={{
                  background: "hsl(var(--card))",
                  color: "hsl(var(--foreground))",
                  boxShadow: "var(--shadow-brutal-sm)",
                }}
              >
                Retour au dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
