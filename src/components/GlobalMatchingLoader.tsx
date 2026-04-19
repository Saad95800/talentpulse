"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import MatchingLoader from './MatchingLoader';

/**
 * Composant Loader Global utilisant un Portail React.
 * Injecté dans document.body via RootLayout pour garantir une 
 * visibilité absolue indépendamment des contextes CSS du dashboard.
 */
export default function GlobalMatchingLoader() {
  const { loading } = useSelector((state: RootState) => state.matching);
  const [mounted, setMounted] = useState(false);

  // Sécurité Hydratation Next.js : Le portail ne peut être rendu que côté client
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // On ne démonte pas l'état monté lors des changements de loading
    // Cela évite les recréations inutiles du composant racine du portail
  }, []);

  // Si on n'est pas côté client ou si aucune analyse n'est en cours, on ne rend rien
  if (!mounted || !loading) return null;

  // Rendu via Portail dans le body
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-xl p-4">
        <MatchingLoader />
      </div>
    </div>,
    document.body
  );
}
