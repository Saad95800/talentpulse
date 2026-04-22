"use client";

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { useRouter } from 'next/navigation';
import MatchingDashboard from '@/components/MatchingDashboard';
import MatchResultView from '@/components/MatchResultView';
import PaywallModal from '@/components/PaywallModal';
import { resetResult } from '@/store/matchingSlice';
import VivierManager from '@/components/VivierManager';
import HistoryList from '@/components/HistoryList';
import SubscriptionManager from '@/components/SubscriptionManager';
import { MatchResult } from '@/lib/ai';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/store/userSlice';
import { LogOut, LayoutDashboard, RefreshCcw, History, Zap, CreditCard, X, TrendingUp } from 'lucide-react';
import MultiMatchResultView from '@/components/MultiMatchResultView';
import { getBatchStatusAction, getActiveBatchAction, cancelActiveBatchAction } from '@/actions/matching.action';
import { setActiveBatchId, setBatchProgress, setMultiResults } from '@/store/matchingSlice';
import { CandidateInfo } from '@/lib/ai';
import { useRef } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isLoggedIn } = useSelector((state: RootState) => state.user);
  const credits = user?.credits ?? 0;
  const { currentResult, results, activeBatchId } = useSelector((state: RootState) => state.matching);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'analyse' | 'vivier' | 'historique' | 'abonnement'>('analyse');
  const [selectedHistoryResult, setSelectedHistoryResult] = useState<MatchResult | null>(null);

  // Gestion de la session via le hook useAuth
  useAuth();

  // Polling du batch (centralisé ici pour persister au changement de vue)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (activeBatchId) {
      interval = setInterval(async () => {
        try {
          const response = await getBatchStatusAction(activeBatchId);
          if (response.success && 'data' in response && response.data) {
            const batch = response.data;
            
            dispatch(setBatchProgress({ 
              current: batch.processedItems, 
              total: batch.totalItems 
            }));
            
            const transformedResults = batch.items.map((item: any) => {
              if (item.status === 'COMPLETED' && item.matchRecord) {
                const aiData = (item.matchRecord.aiResponse as Record<string, unknown>) || {};
                return {
                  recordId: item.matchRecord.id,
                  score: (aiData.score as number) || (item.matchRecord.score as number) || 0,
                  competences_validees: (aiData.competences_validees as any) || [],
                  competences_manquantes: (aiData.competences_manquantes as string[]) || [],
                  argumentaire_client: (aiData.argumentaire_client as string) || "Analyse terminée.",
                  argumentaire_scientifique: (aiData.argumentaire_scientifique as string) || "",
                  analyse_processus: (aiData.analyse_processus as any) || { 
                    rigueur: "Analyse standard", 
                    facteurs_determinants: [], 
                    biais_neutralises: [] 
                  },
                  questions_candidat: (aiData.questions_candidat as string[]) || [],
                  candidateInfo: (aiData.candidateInfo as CandidateInfo) || { firstName: item.candidateName || 'Candidat', lastName: '' },
                  jobDescription: item.matchRecord.mission?.description || "",
                  fullCandidate: item.matchRecord.candidate || null,
                  jobTitle: item.matchRecord.jobTitle || (aiData as any).jobTitle || "",
                  status: item.status
                };
              }
              return { 
                status: item.status,
                score: 0,
                competences_validees: [],
                competences_manquantes: [],
                argumentaire_client: item.error || (item.status === 'PROCESSING' ? "L'IA analyse le profil..." : "En attente..."),
                argumentaire_scientifique: "",
                analyse_processus: { rigueur: "", facteurs_determinants: [], biais_neutralises: [] },
                questions_candidat: [],
                candidateInfo: { firstName: item.candidateName || 'Candidat', lastName: '' }
              };
            });

            dispatch(setMultiResults(transformedResults as MatchResult[]));

            if (batch.status === 'COMPLETED' || batch.status === 'FAILED') {
              dispatch(setActiveBatchId(null));
              clearInterval(interval);
            }
          } else {
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Erreur polling DashboardPage:", err);
          clearInterval(interval);
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeBatchId, dispatch]);

  const initialCheckDone = useRef(false);

  // --- Hook 1 : Détection d'un batch déjà en cours au montage ---
  useEffect(() => {
    const checkActiveBatch = async () => {
      // Éviter de vérifier si on l'a déjà fait ou si un batch est déjà actif dans le store
      if (initialCheckDone.current || activeBatchId) return;
      
      const activeUserId = user?.id || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tm_user') || '{}').id : null);
      if (!activeUserId) return;

      try {
        initialCheckDone.current = true;
        const response = await getActiveBatchAction(activeUserId);
        if (response.success && 'data' in response && response.data?.id) {
          const jobId = response.data.id;
          console.log("[DashboardPage] Reconnexion au batch actif au montage:", jobId);
          dispatch(setActiveBatchId(jobId));
          
          const statusRes = await getBatchStatusAction(jobId);
          if (statusRes.success && 'data' in statusRes && statusRes.data) {
            const batch = statusRes.data;
            const transformedResults = batch.items.map((item: any) => {
              if (item.status === 'COMPLETED' && item.matchRecord) {
                const aiData = (item.matchRecord.aiResponse as Record<string, unknown>) || {};
                return {
                  recordId: item.matchRecord.id,
                  score: (aiData.score as number) || (item.matchRecord.score as number) || 0,
                  competences_validees: (aiData.competences_validees as any) || [],
                  competences_manquantes: (aiData.competences_manquantes as string[]) || [],
                  argumentaire_client: (aiData.argumentaire_client as string) || "Analyse terminée.",
                  argumentaire_scientifique: (aiData.argumentaire_scientifique as string) || "",
                  analyse_processus: (aiData.analyse_processus as any) || { 
                    rigueur: "Analyse standard", 
                    facteurs_determinants: [], 
                    biais_neutralises: [] 
                  },
                  questions_candidat: (aiData.questions_candidat as string[]) || [],
                  candidateInfo: (aiData.candidateInfo as CandidateInfo) || { firstName: item.candidateName || 'Candidat', lastName: '' },
                  jobDescription: item.matchRecord.mission?.description || "",
                  fullCandidate: item.matchRecord.candidate || null,
                  jobTitle: item.matchRecord.jobTitle || (aiData as any).jobTitle || "",
                  status: item.status
                };
              }
              return { 
                status: item.status,
                score: 0,
                competences_validees: [],
                competences_manquantes: [],
                argumentaire_client: item.error || (item.status === 'PROCESSING' ? "L'IA analyse le profil..." : "En attente..."),
                argumentaire_scientifique: "",
                analyse_processus: { rigueur: "", facteurs_determinants: [], biais_neutralises: [] },
                questions_candidat: [],
                candidateInfo: { firstName: item.candidateName || 'Candidat', lastName: '' }
              };
            });
            dispatch(setMultiResults(transformedResults as MatchResult[]));
          }
        }
      } catch (err) {
        console.error("Erreur checkActiveBatch:", err);
      }
    };

    checkActiveBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, dispatch]);

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

  const handleNewAnalysis = async () => {
    // Si un batch est actif, on l'annule côté serveur pour ne plus être "poursuivi"
    if (activeBatchId) {
      console.log("[DashboardPage] Demande d'arrêt forcé du batch:", activeBatchId);
      try {
        await cancelActiveBatchAction(activeBatchId);
      } catch (err) {
        console.error("Échec de l'annulation serveur:", err);
      }
    }
    
    dispatch(resetResult());
    setActiveTab('analyse');
  };

  return (
    <div className="relative min-h-screen">
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
            <TabButton 
              active={activeTab === 'abonnement'} 
              onClick={() => setActiveTab('abonnement')}
              icon={<CreditCard className="w-4 h-4" />}
              label="Abonnement"
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
      <div className="md:hidden sticky top-[73px] z-20 bg-white border-b border-slate-300 p-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button 
            onClick={() => setActiveTab('analyse')}
            className={`px-6 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'analyse' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 border border-slate-200 text-muted'}`}
          >
            Analyse
          </button>
          <button 
            onClick={() => setActiveTab('vivier')}
            className={`px-6 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'vivier' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 border border-slate-200 text-muted'}`}
          >
            Vivier
          </button>
          <button 
            onClick={() => setActiveTab('historique')}
            className={`px-6 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'historique' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 border border-slate-200 text-muted'}`}
          >
            Historique
          </button>
          <button 
            onClick={() => setActiveTab('abonnement')}
            className={`px-6 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'abonnement' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 border border-slate-200 text-muted'}`}
          >
            Abonnement
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
                {results.length > 0 ? (
                   <MultiMatchResultView results={results} onCancelAll={handleNewAnalysis} />
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
        ) : activeTab === 'historique' ? (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-300 border border-slate-200 overflow-hidden min-h-[500px]">
            <HistoryList onSelectAnalysis={(res: MatchResult) => {
              setSelectedHistoryResult(res);
            }} />
          </div>
        ) : (
          <SubscriptionManager 
            userId={user.id}
            userPlan={user.plan || 'FREE'}
            subStatus={user.subscriptionStatus || 'INACTIVE'}
            nextBillingDate={user.nextBillingDate}
            credits={credits}
          />
        )}

        {/* Modal de détail Historique (Popin) */}
        {selectedHistoryResult && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
            <div 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
              onClick={() => setSelectedHistoryResult(null)}
            />
            
            <div className="relative w-full max-w-6xl max-h-[90vh] bg-slate-50 rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col animate-in zoom-in-95 duration-300">
              {/* Header Modal */}
              <div className="px-10 py-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-xl text-primary">
                          <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                          <h3 className="text-xl font-black text-main leading-tight">
                            {selectedHistoryResult.candidateInfo 
                              ? `${selectedHistoryResult.candidateInfo.firstName} ${selectedHistoryResult.candidateInfo.lastName}` 
                              : "Détail du Matching"}
                          </h3>
                          <p className="text-xs font-bold text-muted uppercase tracking-widest italic">Analyse Historique Consultée</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => setSelectedHistoryResult(null)}
                    className="p-3 hover:bg-slate-100 rounded-full text-slate-400 hover:text-main transition-colors"
                  >
                    <X className="w-7 h-7" />
                  </button>
              </div>

              {/* Content Scrollable */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                <MatchResultView 
                  result={selectedHistoryResult} 
                  candidateName={selectedHistoryResult.candidateInfo 
                    ? `${selectedHistoryResult.candidateInfo.firstName} ${selectedHistoryResult.candidateInfo.lastName}` 
                    : "Candidat"} 
                  recordId={selectedHistoryResult.recordId}
                />
              </div>
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


