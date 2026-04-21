'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'sans-serif',
          textAlign: 'center',
          padding: '20px'
        }}>
          <h1 style={{ color: '#b91c1c' }}>Erreur Critique</h1>
          <p>Une erreur système majeure est survenue.</p>
          <button 
            onClick={() => reset()}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: '#b91c1c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Tenter de recharger l'application
          </button>
        </div>
      </body>
    </html>
  );
}
