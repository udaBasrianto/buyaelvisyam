import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  errorMessage: string;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    errorMessage: "",
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || "Unknown runtime error",
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App runtime error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <div className="w-full max-w-2xl rounded-3xl border border-destructive/20 bg-card p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-destructive">
              Runtime Error
            </p>
            <h1 className="mt-3 text-2xl font-black">Aplikasi gagal dirender</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              White page biasanya terjadi karena error JavaScript saat React merender komponen.
              Detail error ditampilkan di bawah agar lebih mudah ditelusuri.
            </p>
            <pre className="mt-5 overflow-x-auto rounded-2xl bg-muted p-4 text-xs leading-6 text-foreground">
              {this.state.errorMessage}
            </pre>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
