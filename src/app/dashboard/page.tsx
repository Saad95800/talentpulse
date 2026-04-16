"use client";

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { useRouter } from 'next/navigation';
import MatchingDashboard from '@/components/MatchingDashboard';
import MatchResultView from '@/components/MatchResultView';
import MatchingLoader from '@/components/MatchingLoader';
import PaywallModal from '@/components/PaywallModal';
import { resetResult, setResult } from '@/store/matchingSlice';
import VivierManager from '@/components/VivierManager';
import HistoryList from '@/components/HistoryList';
import { MatchResult } from '@/lib/ai';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/store/userSlice';
import { LogOut, LayoutDashboard, RefreshCcw, History, Zap } from 'lucide-react';
import MultiMatchResultView from '@/components/MultiMatchResultView';

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isLoggedIn } = useSelector((state: RootState) => state.user);
  const credits = user?.credits ?? 0;
  const { currentResult, results, loading } = useSelector((state: RootState) => state.matching);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'analyse' | 'vivier' | 'historique'>('analyse');

  // Gestion de la session via le hook useAuth
  useAuth();

  const handleLogout = () => {
    localStorage.removeItem('tm_token');
    dispatch(logout());
    router.push('/');
  };

  // Protection de la route : rediriger vers la home si non inscrit ou en cours de chargement
  useEffect(() => {
    if (!isLoggedIn && !localStorage.getItem('tm_token')) {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold text-sm tracking-widest uppercase animate-pulse">Initialisation du Dashboard...</p>
        </div>
      </div>
    );
  }

  const handleNewAnalysis = () => {
    dispatch(resetResult());
    setActiveTab('analyse');
  };

  return (
    <div className="relative min-h-screen">
      {/* Global Matching Loader Overlay - PRIORITY OVERLAY */}
      {loading && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-md" 
          style={{ zIndex: 999999, display: 'flex', opacity: 1, visibility: 'visible' }}
        >
           <div className="w-full max-w-lg p-10 bg-white rounded-[3rem] shadow-[0_0_100px_rgba(37,99,235,0.5)] border border-white/20 relative">
              <MatchingLoader />
           </div>
        </div>
      )}

      <main className="min-h-screen bg-background pb-20">

      {/* Header du Dashboard */}
      <header className="bg-white border-b border-slate-300 py-4 px-6 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-xl">
              <LayoutDashboard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-main">Dashboard Recruteur</h1>
              <p className="text-muted text-xs font-medium">👋 Bienvenue, <span className="text-primary">{user?.name || 'Recruteur'}</span></p>
            </div>
          </div>

          {/* Navigation par onglets Desktop */}
          <nav className="hidden md:flex items-center bg-slate-200 p-1.5 rounded-xl border border-slate-300">
            <TabButton 
              active={activeTab === 'analyse'} 
              onClick={() => setActiveTab('analyse')}
              icon={<RefreshCcw className="w-4 h-4" />}
              label="Analyse & Matching"
            />
            <TabButton 
              active={activeTab === 'vivier'} 
              onClick={() => setActiveTab('vivier')}
              icon={<Zap className="w-4 h-4" />}
              label="Mon Vivier IA"
            />
            <TabButton 
              active={activeTab === 'historique'} 
              onClick={() => setActiveTab('historique')}
              icon={<History className="w-4 h-4" />}
              label="Historique"
            />
          </nav>

            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-white border border-slate-300 rounded-xl flex items-center gap-3 shadow-inner">
                <span className="text-xs font-bold text-muted uppercase tracking-wider">Tes Crédits :</span>
                <span className={`text-lg font-black ${credits > 0 ? 'text-primary' : 'text-red-500'}`}>
                  {credits > 900000 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-500">
                      <Zap className="w-4 h-4 fill-emerald-500" /> Illimités
                    </span>
                  ) : (
                    credits
                  )}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all group"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
      </header>

      {/* Navigation Mobile */}
      <div className="md:hidden sticky top-[73px] z-20 bg-white border-b border-slate-300 p-2">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('analyse')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'analyse' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 border border-slate-200 text-muted'}`}
          >
            Analyse
          </button>
          <button 
            onClick={() => setActiveTab('vivier')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'vivier' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 border border-slate-200 text-muted'}`}
          >
            Vivier
          </button>
          <button 
            onClick={() => setActiveTab('historique')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'historique' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 border border-slate-200 text-muted'}`}
          >
            Historique
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {activeTab === 'analyse' ? (
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-300 border border-slate-200 overflow-hidden">
            {results.length > 0 ? (
              <div className="p-8">
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-200">
                  <h2 className="text-2xl font-bold text-main">Résultat de l&apos;analyse</h2>
                  <button
                    onClick={handleNewAnalysis}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-main font-bold rounded-xl transition-all border border-slate-300"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Nouvelle analyse
                  </button>
                </div>
                {results.length > 1 ? (
                   <MultiMatchResultView results={results} />
                ) : currentResult ? (
                   <MatchResultView result={currentResult} candidateName="Candidat" />
                ) : (
                   <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest">Initialisation...</div>
                )}
              </div>
            ) : (
              <MatchingDashboard onPaywallOpen={() => setIsPaywallOpen(true)} />
            )}
          </div>
        ) : activeTab === 'vivier' ? (
          <div className="space-y-8">
            <VivierManager />
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-300 border border-slate-200 overflow-hidden min-h-[500px]">
            <HistoryList onSelectAnalysis={(res: MatchResult) => {
              dispatch(setResult(res));
              setActiveTab('analyse');
            }} />
          </div>
        )}

        {/* Pied de page du Dashboard */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between text-muted text-[10px] font-bold uppercase tracking-widest px-4">
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
          <p>© 2026 TalentPulse - Advanced AI Suite</p>
        </div>
      </div>

      <PaywallModal 
        isOpen={isPaywallOpen} 
        onClose={() => setIsPaywallOpen(false)} 
      />
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all border
        ${active ? 'bg-white text-primary shadow-md border-slate-300' : 'text-slate-600 hover:text-main border-transparent'}
      `}
    >
      {icon}
      {label}
    </button>
  );
}

function Tip({ title, desc }: { title: string, desc: string }) {
  return (
    <li className="flex gap-4 group">
      <div className="w-1.5 h-auto bg-slate-200 rounded-full group-hover:bg-primary transition-colors" />
      <div>
        <h5 className="text-sm font-bold text-main mb-1">{title}</h5>
        <p className="text-xs text-muted leading-relaxed font-medium">{desc}</p>
      </div>
    </li>
  );
}

