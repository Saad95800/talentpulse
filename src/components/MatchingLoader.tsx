"use client";

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const steps = [
  { icon: "📄", label: "Lecture de la fiche de poste..." },
  { icon: "🧠", label: "Extraction des compétences clés..." },
  { icon: "👤", label: "Analyse approfondie du CV..." },
  { icon: "⚡", label: "Calcul du score de matching..." },
  { icon: "✍️", label: "Rédaction de l' argumentaire client..." },
  { icon: "📊", label: "Finalisation du rapport IA..." },
];

export default function MatchingLoader() {
  const { loading, loadingStep, batchCurrent, batchTotal, batchItems } = useSelector((state: RootState) => state.matching);
  const [currentStep, setCurrentStep] = useState(0);
  const [internalProgress, setInternalProgress] = useState(0);

  // Calculer la progression globale basée sur le batch et l'étape interne
  const batchBase = batchTotal > 0 ? ((batchCurrent - 1) / batchTotal) * 100 : 0;
  const stepWeight = batchTotal > 0 ? 100 / batchTotal : 100;
  const currentStepProgress = (currentStep / steps.length) * stepWeight;
  const totalProgress = Math.min(Math.round(batchBase + currentStepProgress + (internalProgress * stepWeight / 100)), 99);

  // Réinitialisation du simulateur à chaque changement de CV (batch)
  useEffect(() => {
    if (loadingStep) {
      queueMicrotask(() => {
        setCurrentStep(0);
        setInternalProgress(0);
      });
    }
  }, [loadingStep]);

  useEffect(() => {
    if (!loading) {
      queueMicrotask(() => {
        setCurrentStep(0);
        setInternalProgress(0);
      });
      return;
    }

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        const next = prev + 1;
        if (next >= steps.length) {
          clearInterval(stepInterval);
          return prev;
        }
        return next;
      });
    }, 2800);

    const progressInterval = setInterval(() => {
      setInternalProgress(prev => Math.min(prev + 1, 95));
    }, 170);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [loading]);

  const step = steps[currentStep];

  return (
    <div className="flex flex-col items-center justify-center p-10 min-h-[600px] select-none bg-white rounded-[3rem] shadow-2xl border border-slate-100">
      {/* Header matching multiple */}
      {batchTotal > 1 && (
        <div className="mb-12 flex flex-col items-center gap-4">
          <div className="bg-slate-950 text-white px-8 py-3 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] flex items-center gap-4 shadow-2xl ring-8 ring-slate-100 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-400/20"></span>
            Matching de masse : {batchCurrent} / {batchTotal}
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest text-center max-w-xs">
            Traitement haute performance sécurisé par nos modèles IA
          </p>
        </div>
      )}

      {/* Orb animé */}
      <div className="relative mb-12">
        <div
          className="absolute inset-0 rounded-full blur-[4rem] opacity-30 animate-pulse"
          style={{ background: '#2563EB', backgroundColor: 'var(--color-primary, #2563EB)', transform: 'scale(1.8)' }}
        />
        <div
          className="relative w-32 h-32 rounded-full flex items-center justify-center shadow-2xl border-[6px]"
          style={{ background: 'white', borderColor: 'var(--color-primary, #2563EB)' }}
        >
          {/* Anneau tournant */}
          <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '3s' }}>
            <circle
              cx="64" cy="64" r="58"
              fill="none"
              strokeWidth="6"
              stroke="url(#ringGrad)"
              strokeLinecap="round"
              strokeDasharray="180 300"
            />
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="1" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.05" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-4xl" role="img" aria-label="step icon">{step.icon}</span>
        </div>
      </div>

      {/* Texte central */}
      <div className="text-center space-y-4 max-w-md w-full">
        {loadingStep && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="px-5 py-2 bg-primary/5 text-primary text-[11px] font-black uppercase tracking-[0.25em] rounded-full border border-primary/10 backdrop-blur-sm">
              {loadingStep}
            </span>
          </div>
        )}
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">
          Analyse Intelligente
        </h3>
        <p
          key={currentStep}
          className="font-bold text-lg min-h-[1.75rem] transition-all duration-500"
          style={{ color: 'var(--color-primary, #2563EB)' }}
        >
          {step.label}
        </p>
      </div>

      {/* Barre de progression globale - Version Premium */}
      <div className="mt-12 w-full max-w-sm">
        <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] mb-4 text-slate-500 px-1">
          <span>Progression globale</span>
          <span className={totalProgress > 90 ? 'text-emerald-500' : 'text-primary'}>{totalProgress}%</span>
        </div>
        
        <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden p-[3px] border border-slate-200/50 shadow-inner">
          <div
            className="relative h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_20px_rgba(37,99,235,0.3)]"
            style={{
              width: `${totalProgress}%`,
              background: totalProgress > 90 
                ? 'linear-gradient(90deg, #059669 0%, #10b981 100%)' 
                : 'linear-gradient(90deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full animate-shine" />
          </div>
        </div>

        {/* Liste des CV traités */}
        {batchTotal > 1 && batchItems.length > 0 && (
          <div className="mt-10 space-y-3 max-h-[250px] overflow-y-auto px-1 custom-scrollbar">
            {batchItems.map((item, idx) => (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 ${
                  item.status === 'COMPLETED' 
                    ? 'bg-emerald-50/50 border-emerald-100' 
                    : item.status === 'FAILED'
                    ? 'bg-rose-50/50 border-rose-100'
                    : 'bg-slate-50/50 border-slate-100'
                }`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    item.status === 'COMPLETED' 
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/10' 
                      : item.status === 'FAILED'
                      ? 'bg-rose-500 text-white'
                      : 'bg-white border border-slate-200'
                  }`}>
                    {item.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-5 h-5 animate-in zoom-in duration-300" />
                    ) : item.status === 'FAILED' ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-black ${item.status === 'COMPLETED' ? 'text-emerald-700' : 'text-slate-800'}`}>
                      {item.candidateName || `Candidat ${idx + 1}`}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {item.status === 'COMPLETED' ? 'Matching réussi' : item.status === 'FAILED' ? 'Indisponible' : 'Analyse structurelle...'}
                    </p>
                  </div>
                </div>
                {item.status === 'COMPLETED' && (
                  <div className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-tighter">
                    Vérifié par IA
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shine {
          from { transform: translateX(-200%); }
          to   { transform: translateX(200%); }
        }
        .animate-shine {
          animation: shine 3s infinite linear;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
