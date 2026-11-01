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
            background: 'var(--bg-base, #17140f)',
            color: 'var(--text-primary, #f3eee4)',
            padding: '32px',
            textAlign: 'center',
            fontFamily: 'inherit',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'rgba(138, 106, 34,0.15)',
              border: '1.5px solid rgba(138, 106, 34,0.4)',
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
          <p style={{ fontSize: '0.95rem', color: '#a39a8b', maxWidth: '420px', lineHeight: 1.6, margin: 0 }}>
            An unexpected error occurred. Please refresh the page — your cart and session are safely stored.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '8px',
              padding: '12px 28px',
              background: '#8a6a22',
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
