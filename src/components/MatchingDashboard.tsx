"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { 
  setLoading, 
  setLoadingStep, 
  setError,
  setActiveBatchId, 
  setMultiResults 
} from '@/store/matchingSlice';
import { updateCredits } from '@/store/userSlice';
import { 
  Zap,
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { 
  startBatchMatchingAction, 
  getActiveBatchAction 
} from '@/actions/matching.action';
import { MatchResult } from '@/lib/ai';
import { DocumentInput } from './matching/DocumentInput';

interface MatchingDashboardProps {
  onPaywallOpen?: () => void;
}

export default function MatchingDashboard({ onPaywallOpen }: MatchingDashboardProps) {
  const dispatch = useDispatch();
  const { loading, error, loadingStep } = useSelector((state: RootState) => state.matching);
  const [isLoadingInternal, setIsLoadingInternal] = useState(false);
  const { user } = useSelector((state: RootState) => state.user);
  
  const credits = user?.credits ?? 0;
  const plan = user?.plan || 'FREE';
  const role = user?.role || 'USER';
  const userId = user?.id;

  const cvLimit = useMemo(() => (plan === 'PREMIUM' ? 10 : 3), [plan]);
  
  // States pour la Fiche de Poste
  const [jobInputType, setJobInputType] = useState<'file' | 'text'>('file');
  const [jobFiles, setJobFiles] = useState<File[]>([]);
  const [jobText, setJobText] = useState("");

  // States pour le CV
  const [cvInputType, setCvInputType] = useState<'file' | 'text'>('file');
  const [cvFiles, setCvFiles] = useState<File[]>([]);
  const [cvText, setCvText] = useState("");

  const activeBatchId = useSelector((state: RootState) => state.matching.activeBatchId);

  // --- Hook 1 : Détection d'un batch déjà en cours au montage ---
  useEffect(() => {
    const checkActiveBatch = async () => {
      const activeUserId = userId || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tm_user') || '{}').id : null);
      if (!activeUserId || activeBatchId) return;

      try {
        const response = await getActiveBatchAction(activeUserId);
        if (response.success && 'data' in response && response.data?.id) {
          dispatch(setActiveBatchId(response.data.id));
        }
      } catch (err) {
        console.error("Erreur checkActiveBatch:", err);
      }
    };

    checkActiveBatch();
  }, [userId, activeBatchId, dispatch]);

  const handleMatch = async () => {
    setIsLoadingInternal(true);
    dispatch(setLoading(true));
    dispatch(setError(""));
    
    // Validation
    const hasJob = (jobInputType === 'file' && jobFiles.length > 0) || (jobInputType === 'text' && jobText.trim().length > 0);
    const hasCv = (cvInputType === 'file' && cvFiles.length > 0) || (cvInputType === 'text' && cvText.trim().length > 0);
    
    if (!hasJob || !hasCv) {
       dispatch(setError("Veuillez fournir une fiche de poste et au moins un CV avant de lancer l'analyse."));
       dispatch(setLoading(false));
       setIsLoadingInternal(false);
       return;
    }

    const activeUserId = userId || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tm_user') || '{}').id : null);
    if (!activeUserId) {
      dispatch(setError("Session expirée."));
      setIsLoadingInternal(false);
      dispatch(setLoading(false));
      return;
    }

    // Crédits
    if (role !== 'ADMIN' && credits <= 0) {
      if (onPaywallOpen) onPaywallOpen();
      dispatch(setError("Vous n'avez plus de crédits. Veuillez souscrire à l'offre illimitée."));
      setIsLoadingInternal(false);
      dispatch(setLoading(false));
      return;
    }

    const jobFile = jobFiles[0] || null;

    // Déduction préventive si non admin
    if (role !== 'ADMIN') {
      try {
        const { deductCredit } = await import('@/actions/credits.action');
        const deductResult = await deductCredit(activeUserId);
        if (!deductResult.success) {
          if (onPaywallOpen) onPaywallOpen();
          dispatch(setError((deductResult as any).error || "Impossible de déduire vos crédits."));
          setIsLoadingInternal(false);
          dispatch(setLoading(false));
          return;
        }
        dispatch(updateCredits((deductResult as any).creditsRemaining ?? credits - 1));
      } catch (err) {
        console.error("Erreur déduction crédit:", err);
      }
    }
    
    const formData = new FormData();
    formData.append('userId', activeUserId);
    if (jobFile) formData.append('jobFile', jobFile);
    if (jobText) formData.append('jobTextRaw', jobText);
    cvFiles.forEach(file => formData.append('cvFiles', file));
    
    if (cvInputType === 'text') {
      const blob = new Blob([cvText], { type: 'text/plain' });
      const virtualFile = new File([blob], "CV_Saisi.txt", { type: 'text/plain' });
      formData.append('cvFiles', virtualFile);
    }

    try {
      dispatch(setLoadingStep("Lancement du traitement groupé..."));
      const result = await startBatchMatchingAction(formData);
      
      if (result.success && 'batchJobId' in result) {
        // ... (previous fix was already partially correct but let's be sure about the else branch)
        const ghostResults: MatchResult[] = cvFiles.map((file) => ({
          score: 0,
          competences_validees: [],
          competences_manquantes: [],
          argumentaire_client: "Analyse en attente...",
          questions_candidat: [],
          candidateInfo: { firstName: file.name, lastName: '' },
          status: 'PENDING'
        }));
        
        if (cvInputType === 'text') {
          ghostResults.push({
            score: 0,
            competences_validees: [],
            competences_manquantes: [],
            argumentaire_client: "Analyse en attente...",
            questions_candidat: [],
            candidateInfo: { firstName: "CV_Saisi.txt", lastName: '' },
            status: 'PENDING'
          });
        }

        dispatch(setMultiResults(ghostResults));
        dispatch(setActiveBatchId(result.batchJobId));
        dispatch(setLoading(false));
      } else {
        dispatch(setError((result as any).error || "Échec du lancement de l'analyse."));
        dispatch(setLoading(false));
      }
    } catch (err) {
      console.error("Erreur startBatch:", err);
      dispatch(setError("Erreur lors de la communication avec le serveur."));
      dispatch(setLoading(false));
    } finally {
      setIsLoadingInternal(false);
    }
  };

  const isLoaderActive = loading || isLoadingInternal;

  const isButtonDisabled = useMemo(() => {
    return isLoaderActive || 
      (!(jobInputType === 'file' ? jobFiles.length > 0 : jobText.length > 10)) || 
      (!(cvInputType === 'file' ? cvFiles.length > 0 : cvText.length > 10));
  }, [isLoaderActive, jobInputType, jobFiles, jobText, cvInputType, cvFiles, cvText]);

  return (
    <div className="w-full max-w-5xl mx-auto py-10 px-4">
      <div className="grid md:grid-cols-2 gap-10 mb-12">
        <DocumentInput 
          label="Profil du Candidat"
          description={`Analysez jusqu'à ${cvLimit} CV simultanément (${plan})`}
          files={cvFiles} setFiles={setCvFiles}
          text={cvText} setText={setCvText}
          inputType={cvInputType} setInputType={setCvInputType}
          isMulti={true}
          limit={cvLimit}
        />
        <DocumentInput 
          label="Fiche de Poste"
          description="Glissez le descriptif de mission"
          files={jobFiles} setFiles={setJobFiles}
          text={jobText} setText={setJobText}
          inputType={jobInputType} setInputType={setJobInputType}
          isMulti={false}
        />
      </div>

      <div className="flex flex-col items-center">
        {error && (
          <div className="w-full max-w-md mb-8 p-5 rounded-3xl bg-red-50 border border-red-200 flex items-start gap-4 animate-in slide-in-from-top-4 duration-500 shadow-sm">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <p className="text-sm font-black text-red-950 mb-1">Analyse interrompue</p>
              <p className="text-sm text-red-700 font-bold">{error}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleMatch}
          disabled={isButtonDisabled}
          className={`
            relative group overflow-hidden px-12 py-6 rounded-[2rem] font-black text-xl flex items-center gap-4 transition-all duration-500 shadow-2xl
            ${isButtonDisabled 
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-inner opacity-60' 
              : 'bg-main text-white hover:bg-primary hover:-translate-y-1 hover:shadow-primary/40 active:scale-95'}
          `}
        >
          {isLoadingInternal && !activeBatchId ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-white" />
              <div className="flex flex-col items-start leading-tight">
                <span className="animate-pulse">Envoi en cours...</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 italic">{loadingStep}</span>
              </div>
            </>
          ) : (
            <>
              <Zap className={`w-6 h-6 transition-transform group-hover:rotate-12 ${!isButtonDisabled && 'text-yellow-400 fill-yellow-400'}`} />
              {cvFiles.length > 1 ? `Matcher les ${cvFiles.length} profils` : 'Générer le Matching'}
              <Sparkles className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </>
          )}

          {!isButtonDisabled && !isLoaderActive && (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
          )}
        </button>

        {!isButtonDisabled && !loading && (
          <p className="mt-5 text-sm text-muted animate-pulse">
             Consomme <span className="font-bold text-main">1 crédit</span> (Pack de {cvInputType === 'file' ? cvFiles.length : 1} CV)
          </p>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}
