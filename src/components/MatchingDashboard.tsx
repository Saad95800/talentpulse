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
  Sparkles,
  Type
} from 'lucide-react';

interface DocumentInputProps {
  label: string;
  description: string;
  file: File | null;
  setFile: (file: File | null) => void;
  text: string;
  setText: (text: string) => void;
  inputType: 'file' | 'text';
  setInputType: (type: 'file' | 'text') => void;
  accept?: Record<string, string[]>;
}

function DocumentInput({ 
  label, description, file, setFile, text, setText, inputType, setInputType, 
  accept = { 
    'application/pdf': ['.pdf'], 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 
    'application/msword': ['.doc'],
    'text/plain': ['.txt'] 
  } 
}: DocumentInputProps) {
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, [setFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false
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
        file ? (
          <div className="relative p-7 rounded-[2rem] border-2 border-emerald-500 bg-emerald-50/30 flex items-center gap-4 transition-all animate-in fade-in zoom-in duration-300">
            <div className="p-3.5 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
              <FileText className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-emerald-950 truncate">{file.name}</p>
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                {(file.size / 1024).toFixed(0)} KB • Validé
              </p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="p-2.5 hover:bg-emerald-200/50 rounded-full text-emerald-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <CheckCircle2 className="absolute -top-3 -right-3 w-8 h-8 text-emerald-500 fill-white" />
          </div>
        ) : (
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
              {description} <br/> <span className="font-bold text-slate-400 mt-2 block">(PDF, DOCX, TXT)</span>
            </p>
            
            {isDragActive && (
              <div className="absolute inset-0 bg-primary/10 rounded-[2rem] flex items-center justify-center pointer-events-none">
                <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
                  <p className="text-primary font-bold animate-pulse">Relâchez ici</p>
                </div>
              </div>
            )}
          </div>
        )
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

export default function MatchingDashboard() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.matching);
  
  // States pour la Fiche de Poste
  const [jobInputType, setJobInputType] = useState<'file' | 'text'>('file');
  const [jobFile, setJobFile] = useState<File | null>(null);
  const [jobText, setJobText] = useState("");

  // States pour le CV
  const [cvInputType, setCvInputType] = useState<'file' | 'text'>('file');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState("");

  const userId = useSelector((state: RootState) => state.user.id);

  const handleMatch = async () => {
    if (!userId) return;
    
    // Validation basique avant soumission
    const hasJob = (jobInputType === 'file' && jobFile) || (jobInputType === 'text' && jobText.trim().length > 0);
    const hasCv = (cvInputType === 'file' && cvFile) || (cvInputType === 'text' && cvText.trim().length > 0);
    
    if (!hasJob || !hasCv) {
       dispatch(setError("Veuillez fournir une fiche de poste et un CV avant de lancer l'analyse."));
       return;
    }

    dispatch(setLoading(true));
    dispatch(setError(""));

    const formData = new FormData();
    formData.append('userId', userId);
    
    if (jobInputType === 'file' && jobFile) formData.append('jobFile', jobFile);
    if (jobInputType === 'text' && jobText) formData.append('jobTextRaw', jobText);

    if (cvInputType === 'file' && cvFile) formData.append('cvFile', cvFile);
    if (cvInputType === 'text' && cvText) formData.append('cvTextRaw', cvText);

    try {
      const result = await processMatchingWorkflow(formData);
      
      if (result.success && result.data) {
        if (result.creditsRemaining !== undefined) {
          dispatch(updateCredits(result.creditsRemaining));
        }
        dispatch(setResult(result.data));
      } else {
        dispatch(setError(result.error || "Une erreur est survenue lors du scan."));
      }
    } catch (e) {
      dispatch(setError("Erreur fatale lors du matching."));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const isButtonDisabled = loading || 
    (!(jobInputType === 'file' ? jobFile : jobText.length > 10)) || 
    (!(cvInputType === 'file' ? cvFile : cvText.length > 10));

  return (
    <div className="w-full max-w-5xl mx-auto py-10 px-4">
      <div className="grid md:grid-cols-2 gap-10 mb-12">
        <DocumentInput 
          label="Fiche de Poste"
          description="Glissez votre descriptif pour définir la mission"
          file={jobFile} setFile={setJobFile}
          text={jobText} setText={setJobText}
          inputType={jobInputType} setInputType={setJobInputType}
        />
        <DocumentInput 
          label="Profil du Candidat"
          description="Glissez le profil à évaluer par rapport à la mission"
          file={cvFile} setFile={setCvFile}
          text={cvText} setText={setCvText}
          inputType={cvInputType} setInputType={setCvInputType}
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

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
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
