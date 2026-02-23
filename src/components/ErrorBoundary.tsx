/**
 * ErrorBoundary Component
 * Catches React component errors and reports to Sentry
 */

import React from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error info to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            color: '#721c24',
          }}
        >
          <h2>Oops! Something went wrong.</h2>
          <p>We've been notified about this error. Please try refreshing the page.</p>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '10px', color: '#000' }}>
              <summary>Error Details (dev only)</summary>
              <pre style={{ overflow: 'auto', fontSize: '12px' }}>
                {this.state.error?.toString()}
              </pre>
            </details>
          )}
          <button onClick={this.handleReset} style={{ marginTop: '10px' }}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Export wrapped with Sentry
export default Sentry.withErrorBoundary(ErrorBoundary, {
  fallback: <h2>An error has occurred</h2>,
  showDialog: false,
});
