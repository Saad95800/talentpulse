"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { 
  setLoading, 
  setLoadingStep, 
  setBatchProgress, 
  setError,
  setActiveBatchId, 
  setMultiResults 
} from '@/store/matchingSlice';
import { updateCredits } from '@/store/userSlice';
import { 
  FileUp, 
  FileText, 
  X, 
  CheckCircle2, 
  Type,
  AlertCircle,
  Loader2,
  Zap,
  Sparkles
} from 'lucide-react';
import { 
  startBatchMatchingAction, 
  getActiveBatchAction 
} from '@/actions/matching.action';
import { MatchResult, CandidateInfo } from '@/lib/ai';

interface MatchingDashboardProps {
  onPaywallOpen?: () => void;
}

interface DocumentInputProps {
  label: string;
  description: string;
  files: File[];
  setFiles: (files: File[]) => void;
  text: string;
  setText: (text: string) => void;
  inputType: 'file' | 'text';
  setInputType: (type: 'file' | 'text') => void;
  isMulti?: boolean;
  accept?: Record<string, string[]>;
  limit?: number;
}

function DocumentInput({ 
  label, description, files, setFiles, text, setText, inputType, setInputType, 
  isMulti = false,
  limit = 5,
  accept = { 
    'application/pdf': ['.pdf'], 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 
    'application/msword': ['.doc'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'text/plain': ['.txt'] 
  } 
}: DocumentInputProps) {
  
  const dispatch = useDispatch();
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const newFiles = [...files];
      
      for (const file of acceptedFiles) {
        if (file.size > 10 * 1024 * 1024) {
          dispatch(setError(`Le fichier "${file.name}" est trop volumineux (max 10 Mo).`));
          continue;
        }

        if (newFiles.length >= limit) {
          dispatch(setError(`Limite de ${limit} CV maximum par demande atteinte.`));
          break;
        }

        let processedFile = file;
        if (file.type.startsWith('image/')) {
          try {
            processedFile = await compressImage(file);
          } catch (e) {
            console.error("Erreur compression image:", e);
          }
        }

        if (isMulti) {
          newFiles.push(processedFile);
        } else {
          setFiles([processedFile]);
          dispatch(setError(""));
          return;
        }
      }
      
      setFiles(newFiles);
      dispatch(setError(""));
    }
  }, [files, setFiles, dispatch, isMulti]);

  const removeFile = (index: number) => {
    const next = [...files];
    next.splice(index, 1);
    setFiles(next);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: isMulti
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-2">
        <h4 className="text-main font-black text-sm uppercase tracking-wider">{label}</h4>
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button 
            onClick={() => setInputType('file')}
            className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${inputType === 'file' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Fichier
          </button>
          <button 
            onClick={() => setInputType('text')}
            className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${inputType === 'text' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Saisie Manuelle
          </button>
        </div>
      </div>

      {inputType === 'file' ? (
        <div className="space-y-3">
          {files.map((file, idx) => (
            <div key={idx} className="relative p-7 rounded-[2rem] border-2 border-emerald-500 bg-emerald-50/30 flex items-center gap-4 transition-all animate-in fade-in zoom-in duration-300">
              <div className="p-3.5 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                <FileText className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-emerald-950 truncate">{file.name}</p>
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                  {(file.size / 1024).toFixed(0)} KB • Prêt
                </p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                className="p-2.5 hover:bg-emerald-200/50 rounded-full text-emerald-600 transition-colors"
                title="Supprimer ce fichier"
              >
                <X className="w-5 h-5" />
              </button>
              <CheckCircle2 className="absolute -top-3 -right-3 w-8 h-8 text-emerald-500 fill-white" />
            </div>
          ))}

          {/* Zone de Drop (affichée si 0 fichiers ou si multi et < 5) */}
          {(!isMulti && files.length === 0) || (isMulti && files.length < 5) ? (
            <div 
              {...getRootProps()} 
              className={`
                relative p-8 rounded-[2rem] border-2 border-dashed cursor-pointer transition-all group overflow-hidden h-[200px] flex flex-col justify-center items-center
                ${isDragActive ? 'border-primary bg-primary/10 scale-[0.98]' : 'border-slate-300 bg-slate-100 hover:bg-white hover:border-primary hover:shadow-xl hover:shadow-slate-200'}
              `}
            >
              <input {...getInputProps()} />
              <div className={`p-4 rounded-xl mb-4 transition-all ${isDragActive ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-white text-primary shadow-sm group-hover:scale-110'}`}>
                <FileUp className="w-7 h-7" />
              </div>
              <p className="text-slate-500 font-medium text-xs px-4 text-center leading-relaxed">
                {description} <br/> <span className="font-bold text-slate-400 mt-2 block">(PDF, DOCX, JPG, PNG • Max 10 Mo)</span>
              </p>
              
              {isDragActive && (
                <div className="absolute inset-0 bg-primary/10 rounded-[2rem] flex items-center justify-center pointer-events-none">
                  <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
                    <p className="text-primary font-bold animate-pulse">Relâchez ici</p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="relative group h-[200px]">
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Copiez-collez le contenu ici (ex: expérience, compétences, responsabilités...)"
            className="w-full h-full p-5 rounded-[2rem] border-2 border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none outline-none transition-all text-sm text-slate-700 font-medium leading-relaxed custom-scrollbar shadow-inner"
          />
          <div className="absolute top-4 right-4 p-2 bg-slate-200 text-slate-400 rounded-lg group-focus-within:bg-primary/10 group-focus-within:text-primary transition-colors pointer-events-none">
            <Type className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Utilitaire de compression d'image client-side via Canvas
 */
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max 1600px pour un CV (suffisant pour OCR)
        const MAX_SIZE = 1600;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            reject(new Error("Canvas blob error"));
          }
        }, 'image/jpeg', 0.85); // Qualité 85% : excellent pour OCR et poids réduit
      };
    };
    reader.onerror = (e) => reject(e);
  });
}

export default function MatchingDashboard({ onPaywallOpen }: MatchingDashboardProps) {
  const dispatch = useDispatch();
  const { loading, error, loadingStep } = useSelector((state: RootState) => state.matching);
  const [isLoadingInternal, setIsLoadingInternal] = useState(false);
  const { user } = useSelector((state: RootState) => state.user);
  const credits = user?.credits ?? 0;
  const plan = user?.plan || 'FREE';
  const role = user?.role || 'USER';

  const cvLimit = plan === 'PREMIUM' ? 10 : 3;
  
  // States pour la Fiche de Poste
  const [jobInputType, setJobInputType] = useState<'file' | 'text'>('file');
  const [jobFiles, setJobFiles] = useState<File[]>([]); // Maintenant un tableau
  const [jobText, setJobText] = useState("");

  // States pour le CV
  const [cvInputType, setCvInputType] = useState<'file' | 'text'>('file');
  const [cvFiles, setCvFiles] = useState<File[]>([]); // Maintenant un tableau
  const [cvText, setCvText] = useState("");

  const userId = useSelector((state: RootState) => state.user.user?.id);
  const activeBatchId = useSelector((state: RootState) => state.matching.activeBatchId);

  // --- Hook 1 : Détection d'un batch déjà en cours au montage ---
  React.useEffect(() => {
    const checkActiveBatch = async () => {
      const activeUserId = userId || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tm_user') || '{}').id : null);
      if (!activeUserId || activeBatchId) return;

      try {
        const response = await getActiveBatchAction(activeUserId);
        if (response.success && response.data?.id) {
          console.log("[Dashboard] Batch actif détecté:", response.data.id);
          dispatch(setActiveBatchId(response.data.id));
          // On ne met PAS setLoading(true) ici car on veut que l'interface reste libre
        }
      } catch (err) {
        console.error("Erreur checkActiveBatch:", err);
      }
    };

    checkActiveBatch();
  }, [userId, activeBatchId, dispatch]);

  const handleMatch = async () => {
    console.log("%c[Dashboard] 🚀 Bouton cliqué. Démarrage du workflow.", "color: #10b981; font-weight: bold;");
    setIsLoadingInternal(true);
    dispatch(setLoading(true));
    dispatch(setError(""));
    
    // Validation
    const hasJob = (jobInputType === 'file' && jobFiles.length > 0) || (jobInputType === 'text' && jobText.trim().length > 0);
    const hasCv = (cvInputType === 'file' && cvFiles.length > 0) || (cvInputType === 'text' && cvText.trim().length > 0);
    
    if (!hasJob || !hasCv) {
       dispatch(setError("Veuillez fournir une fiche de poste et au moins un CV avant de lancer l'analyse."));
       dispatch(setLoading(false));
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

    if (role !== 'ADMIN') {
      try {
        const { deductCredit } = await import('@/actions/credits.action');
        const deductResult = await deductCredit(activeUserId);
        if (!deductResult.success) {
          if (onPaywallOpen) onPaywallOpen();
          dispatch(setError(deductResult.error || "Impossible de déduire vos crédits."));
          setIsLoadingInternal(false);
          dispatch(setLoading(false));
          return;
        }
        dispatch(updateCredits(deductResult.creditsRemaining ?? credits - 1));
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
      
      if (result.success && result.batchJobId) {
        // 1. Peupler immédiatement des résultats "fantômes" (Ghost items) pour l'UI
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
          // Le fichier virtuel créé s'appelle "CV_Saisi.txt" dans le formData
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
        dispatch(setLoading(false));     // Libérer l'interface immédiatement
      } else {
        dispatch(setError(result.error || "Échec du lancement de l'analyse."));
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

  const isButtonDisabled = isLoaderActive || 
    (!(jobInputType === 'file' ? jobFiles.length > 0 : jobText.length > 10)) || 
    (!(cvInputType === 'file' ? cvFiles.length > 0 : cvText.length > 10));

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

      {/* PLUS DE POPINS NI DE LOADER GLOBAL ICI */}

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

