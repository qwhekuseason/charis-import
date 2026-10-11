import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '16px',
            background: 'var(--bg-base, #0f172a)',
            color: 'var(--text-primary, #f1f5f9)',
            padding: '32px',
            textAlign: 'center',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'rgba(37, 99, 235,0.15)',
              border: '1.5px solid rgba(37, 99, 235,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              marginBottom: '8px',
            }}
          >
            ⚠
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#94a3b8', maxWidth: '420px', lineHeight: 1.6, margin: 0 }}>
            An unexpected error occurred. Please refresh the page — your cart and session are safely stored.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '8px',
              padding: '12px 28px',
              background: '#2563eb',
              color: '#060d1a',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
