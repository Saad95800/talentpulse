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
import { RefreshCcw, LayoutDashboard, History, Zap } from 'lucide-react';
import VivierChat from '@/components/VivierChat';
import { MatchResult } from '@/lib/ai';


export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isLoggedIn, name, credits } = useSelector((state: RootState) => state.user);
  const { loading, currentResult } = useSelector((state: RootState) => state.matching);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'analyse' | 'vivier'>('analyse');

  // Protection de la route : rediriger vers la home si non inscrit
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  const handleNewAnalysis = () => {
    dispatch(resetResult());
    setActiveTab('analyse');
  };

  return (
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
              <p className="text-muted text-xs font-medium">👋 Bienvenue, <span className="text-primary">{name || 'Recruteur'}</span></p>
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
              icon={<History className="w-4 h-4" />}
              label="Mon Vivier IA"
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
            Vivier IA
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {activeTab === 'analyse' ? (
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-300 border border-slate-200 overflow-hidden">
            {loading ? (
              <MatchingLoader />
            ) : currentResult ? (
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
                <MatchResultView result={currentResult} candidateName="Candidat" />
              </div>
            ) : (
              <MatchingDashboard />
            )}
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <VivierChat />
            </div>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-300 border border-slate-200 h-fit sticky top-28">
              <h4 className="font-black text-main uppercase tracking-widest text-xs mb-6 px-1">Conseils d'utilisation</h4>
              <ul className="space-y-4">
                <Tip 
                  title="Recherche par score" 
                  desc="Demandez l'IA de classer vos candidats par pertinence technique." 
                />
                <Tip 
                  title="Synthèse globale" 
                  desc="Obtenez un résumé des points forts et faibles de votre vivier actuel." 
                />
                <Tip 
                  title="Aide à la décision" 
                  desc="Interrogez l'assistant pour savoir qui présenter en priorité à votre client." 
                />
              </ul>
            </div>
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
          <p>© 2026 Talent Matcher - Advanced AI Suite</p>
        </div>
      </div>

      <PaywallModal 
        isOpen={isPaywallOpen} 
        onClose={() => setIsPaywallOpen(false)} 
      />
    </main>
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

