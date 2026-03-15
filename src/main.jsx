import React from 'react';
import { createRoot } from 'react-dom/client';
import StudyTracker from './StudyTracker';

function ErrorFallback({ error, reset }) {
  return (
    <div style={{
      padding: '2rem',
      maxWidth: '400px',
      margin: '2rem auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      textAlign: 'center',
    }}>
      <h2 style={{ marginBottom: '1rem' }}>Something went wrong</h2>
      <p style={{ color: '#666', marginBottom: '1rem' }}>Try restarting the app. If it keeps happening, your data is saved in Application Support.</p>
      <button
        onClick={reset}
        style={{
          padding: '0.5rem 1rem',
          background: '#333',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(err, info) { console.error(err, info); }
  render() {
    if (this.state.error) {
      return (
        <ErrorFallback
          error={this.state.error}
          reset={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <StudyTracker />
    </ErrorBoundary>
  </React.StrictMode>
);
