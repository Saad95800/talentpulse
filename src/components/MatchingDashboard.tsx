"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setLoading, setResult, setError } from '@/store/matchingSlice';
import { updateCredits } from '@/store/userSlice';
import { processMatchingWorkflow } from '@/actions/matching.action';
import { 
  FileUp, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  Loader2,
  Sparkles
} from 'lucide-react';

interface FileDropZoneProps {
  label: string;
  file: File | null;
  onFileDrop: (file: File | null) => void;
  accept?: Record<string, string[]>;
  description: string;
}

function FileDropZone({ label, file, onFileDrop, description, accept = { 'application/pdf': ['.pdf'] } }: FileDropZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileDrop(acceptedFiles[0]);
    }
  }, [onFileDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false
  });

  if (file) {
    return (
      <div className="relative p-7 rounded-[2.5rem] border-2 border-emerald-500 bg-emerald-50/30 flex items-center gap-4 transition-all animate-in fade-in zoom-in duration-300">
        <div className="p-3.5 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
          <FileText className="w-7 h-7" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-emerald-900 truncate">{file.name}</p>
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest">
            {(file.size / 1024).toFixed(0)} KB • Validé
          </p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onFileDrop(null); }}
          className="p-2.5 hover:bg-emerald-200/50 rounded-full text-emerald-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <CheckCircle2 className="absolute -top-3 -right-3 w-8 h-8 text-emerald-500 fill-white" />
      </div>
    );
  }

  return (
    <div 
      {...getRootProps()} 
      className={`
        relative p-10 rounded-[2.5rem] border-2 border-dashed cursor-pointer transition-all group overflow-hidden
        ${isDragActive ? 'border-primary bg-primary/5 scale-[0.98]' : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-primary/50 hover:shadow-xl hover:shadow-slate-100'}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center text-center relative z-10">
        <div className={`
          p-5 rounded-2xl mb-5 transition-all
          ${isDragActive ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/25' : 'bg-white text-primary shadow-sm group-hover:scale-110 group-hover:shadow-md'}
        `}>
          <FileUp className="w-9 h-9" />
        </div>
        <h4 className="text-main text-lg font-bold mb-1.5">{label}</h4>
        <p className="text-muted text-xs px-6 leading-relaxed">{description}</p>
      </div>
      
      {isDragActive && (
        <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
            <p className="text-primary font-bold animate-pulse">Relâchez ici</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MatchingDashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.user);
  const { loading, error } = useSelector((state: RootState) => state.matching);
  
  const [jobFile, setJobFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);

  const userId = useSelector((state: RootState) => state.user.id);

  const handleMatch = async () => {
    if (!jobFile || !cvFile || !userId) return;

    dispatch(setLoading(true));
    dispatch(setError(""));

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('jobFile', jobFile);
    formData.append('cvFile', cvFile);

    try {
      const result = await processMatchingWorkflow(formData);
      
      if (result.success && result.data) {
        if (result.creditsRemaining !== undefined) {
          dispatch(updateCredits(result.creditsRemaining));
        }
        dispatch(setResult(result.data));
        // On pourrait scroller ici ou changer de vue
      } else {
        dispatch(setError(result.error || "Une erreur est survenue lors du scan."));
      }
    } catch (e) {
      dispatch(setError("Erreur fatale lors du matching."));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const isButtonDisabled = !jobFile || !cvFile || loading;

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4">
      <div className="grid md:grid-cols-2 gap-10 mb-12">
        <FileDropZone 
          label="Fiche de Poste"
          description="Importez le descriptif au format PDF pour définir les critères"
          file={jobFile}
          onFileDrop={setJobFile}
        />
        <FileDropZone 
          label="CV du Candidat"
          description="Importez le profil à évaluer par rapport à la mission"
          file={cvFile}
          onFileDrop={setCvFile}
        />
      </div>

      <div className="flex flex-col items-center">
        {error && (
          <div className="w-full max-w-md mb-8 p-5 rounded-3xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in slide-in-from-top-4 duration-500">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-900 mb-1">Analyse interrompue</p>
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleMatch}
          disabled={isButtonDisabled}
          className={`
            relative group overflow-hidden px-10 py-5 rounded-[2rem] font-black text-xl flex items-center gap-3 transition-all duration-500 shadow-2xl
            ${isButtonDisabled 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
              : 'bg-main text-white hover:bg-primary hover:-translate-y-1 hover:shadow-primary/30 active:scale-95'}
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="animate-pulse">Analyse en cours...</span>
            </>
          ) : (
            <>
              <Zap className={`w-6 h-6 transition-transform group-hover:rotate-12 ${!isButtonDisabled && 'text-yellow-400 fill-yellow-400'}`} />
              Générer le Matching
              <Sparkles className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </>
          )}

          {/* Background shine effect */}
          {!isButtonDisabled && !loading && (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
          )}
        </button>

        {!isButtonDisabled && !loading && (
          <p className="mt-5 text-sm text-muted animate-pulse">
             Utilise <span className="font-bold text-main">1 crédit</span> gratuit
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
