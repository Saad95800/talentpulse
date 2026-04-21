'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log initial error to Sentry
    console.error('Captured by global error.tsx:', error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="bg-red-50 p-8 rounded-2xl border border-red-100 max-w-md">
        <h2 className="text-2xl font-bold text-red-700 mb-2">Oups ! Quelque chose a mal tourné</h2>
        <p className="text-red-600 mb-6">
          Une erreur inattendue est survenue dans l'interface. L'incident a été enregistré et notre équipe technique va l'analyser.
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-xl transition-colors shadow-sm"
          >
            Réessayer
          </button>
          
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            Retourner à l'accueil
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 text-left p-4 bg-white rounded border border-red-200 overflow-auto max-h-40">
            <p className="text-xs font-mono text-red-500">{error.message}</p>
            <pre className="text-[10px] text-gray-400 mt-2">{error.stack}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
