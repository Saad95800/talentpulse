"use client";

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { useRouter } from 'next/navigation';
import MatchingDashboard from '@/components/MatchingDashboard';
import MatchingLoader from '@/components/MatchingLoader';
import MatchResultView from '@/components/MatchResultView';
import PaywallModal from '@/components/PaywallModal';
import { resetResult } from '@/store/matchingSlice';
import { RefreshCcw, LayoutDashboard, History } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isLoggedIn, name, credits } = useSelector((state: RootState) => state.user);
  const { loading, currentResult } = useSelector((state: RootState) => state.matching);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  // Protection de la route : rediriger vers la home si non inscrit
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  const handleNewAnalysis = () => {
    dispatch(resetResult());
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header du Dashboard */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-xl">
              <LayoutDashboard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-main">Dashboard Recruteur</h1>
              <p className="text-muted text-xs font-medium">👋 Bienvenue, <span className="text-primary">{name || 'Recruteur'}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Tes Crédits :</span>
              <span className={`text-lg font-black ${credits > 0 ? 'text-primary' : 'text-red-500'}`}>
                {credits}
              </span>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-muted"
              title="Retour à l'accueil"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Contenu principal adaptatif */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {loading ? (
            <MatchingLoader />
          ) : currentResult ? (
            <div className="p-8">
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
                <h2 className="text-2xl font-bold text-main">Résultat de l&apos;analyse</h2>
                <button
                  onClick={handleNewAnalysis}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-main font-bold rounded-xl transition-all"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Nouvelle analyse
                </button>
              </div>
              <MatchResultView />
            </div>
          ) : (
            <MatchingDashboard />
          )}
        </div>

        {/* Pied de page du Dashboard */}
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between text-muted text-sm px-4">
          <div className="flex items-center gap-6 mb-4 md:mb-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>Système IA Opérationnel</span>
            </div>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span>Historique Sauvegardé</span>
            </div>
          </div>
          <p>© 2026 Talent Matcher - Tous droits réservés</p>
        </div>
      </div>

      <PaywallModal 
        isOpen={isPaywallOpen} 
        onClose={() => setIsPaywallOpen(false)} 
      />
    </main>
  );
}
