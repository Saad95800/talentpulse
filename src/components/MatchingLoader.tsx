"use client";

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Check } from 'lucide-react';

const steps = [
  { icon: "📄", label: "Lecture de la fiche de poste..." },
  { icon: "🧠", label: "Extraction des compétences clés..." },
  { icon: "👤", label: "Analyse approfondie du CV..." },
  { icon: "⚡", label: "Calcul du score de matching..." },
  { icon: "✍️", label: "Rédaction de l' argumentaire client..." },
  { icon: "📊", label: "Finalisation du rapport IA..." },
];

export default function MatchingLoader() {
  const { loading, loadingStep, batchCurrent, batchTotal } = useSelector((state: RootState) => state.matching);
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
  }, [loading]); // Basé sur loading pour démarrer instantanément

  const step = steps[currentStep];

  return (
    <div className="flex flex-col items-center justify-center p-10 min-h-[480px] select-none bg-white rounded-lg">
      {/* Orb animé */}
      <div className="relative mb-10">
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-40 animate-pulse"
          style={{ background: '#2563EB', backgroundColor: 'var(--color-primary, #2563EB)', transform: 'scale(1.4)' }}
        />
        <div
          className="relative w-28 h-28 rounded-full flex items-center justify-center shadow-2xl border-4"
          style={{ background: 'white', borderColor: 'var(--color-primary, #2563EB)' }}
        >
          {/* Anneau tournant */}
          <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '2s' }}>
            <circle
              cx="56" cy="56" r="48"
              fill="none"
              strokeWidth="4"
              stroke="url(#ringGrad)"
              strokeLinecap="round"
              strokeDasharray="120 200"
            />
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="1" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-3xl" role="img" aria-label="step icon">{step.icon}</span>
        </div>
      </div>

      {/* Texte central */}
      <div className="text-center space-y-3 max-w-xs">
        {batchTotal > 1 && (
          <div className="flex justify-center mb-6">
            <div className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3 shadow-xl ring-4 ring-slate-100 animate-bounce">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Analyse du CV {batchCurrent} / {batchTotal}
            </div>
          </div>
        )}

        {loadingStep && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 mb-2">
            <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-primary/20">
              {loadingStep}
            </span>
          </div>
        )}
        <h3 className="text-2xl font-black text-main tracking-tight">
          Analyse en cours…
        </h3>
        <p
          key={currentStep}
          className="font-semibold text-base min-h-[1.75rem]"
          style={{ color: 'var(--color-primary, #2563EB)' }}
        >
          {step.label}
        </p>
        <p className="text-muted text-xs leading-relaxed px-2">
          L&apos;IA analyse les convergences entre le profil et le poste pour vous fournir un rapport de précision optimale.
        </p>
      </div>

      {/* Barre de progression globale */}
      <div className="mt-10 w-full max-w-sm px-6">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-3">
          <span className="text-slate-400">Progression {batchTotal > 1 ? 'Totale' : 'Analyse'}</span>
          <span className={totalProgress > 90 ? 'text-emerald-500' : 'text-primary'}>{totalProgress}%</span>
        </div>
        
        {/* Rail de la barre */}
        <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden p-[2px] border border-slate-200/50">
          {/* Background Glow */}
          <div 
            className={`absolute inset-y-0 left-0 blur-md transition-all duration-500 ease-out ${totalProgress > 90 ? 'bg-emerald-400/30' : 'bg-primary/20'}`}
            style={{ width: `${totalProgress}%` }}
          />
          
          {/* Barre de remplissage principale */}
          <div
            className="relative h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(37,99,235,0.2)]"
            style={{
              width: `${totalProgress}%`,
              background: totalProgress > 90 
                ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' 
                : 'linear-gradient(90deg, #2563EB 0%, #6366F1 50%, #818CF8 100%)',
            }}
          >
            {/* Effet de brillance passant */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full animate-shine" />
          </div>
        </div>

        {/* Détails du batch */}
        {batchTotal > 1 && (
          <div className="mt-5 flex flex-col items-center gap-3">
             <div className="flex gap-2 items-center">
                {[...Array(batchTotal)].map((_, i) => (
                  <div 
                    key={i}
                    className={`h-2 rounded-full transition-all duration-500 flex items-center justify-center overflow-hidden ${
                      i + 1 < batchCurrent ? 'w-8 bg-emerald-500 shadow-lg shadow-emerald-500/20' : 
                      i + 1 === batchCurrent ? 'w-10 bg-primary ring-4 ring-primary/10 shadow-lg shadow-primary/20' : 
                      'w-3 bg-slate-200'
                    }`}
                  >
                    {i + 1 < batchCurrent && <Check className="w-3 h-3 text-white animate-in zoom-in duration-300" />}
                  </div>
                ))}
             </div>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
               Analyse {batchCurrent} / {batchTotal} terminée à {Math.round(currentStepProgress + (internalProgress * stepWeight / 100))}%
             </p>
          </div>
        )}
      </div>

      {/* Étapes en dots */}
      <div className="mt-8 flex items-center gap-2">
        {steps.map((s, i) => (
          <div
            key={i}
            title={s.label}
            className="rounded-full transition-all duration-500"
            style={{
              width:      i === currentStep ? '28px' : '8px',
              height:     '8px',
              background: i <= currentStep ? '#2563EB' : '#e2e8f0',
              backgroundColor: i <= currentStep ? 'var(--color-primary, #2563EB)' : '#e2e8f0',
              opacity:    i > currentStep ? 0.5 : 1,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shine {
          from { transform: translateX(-100%); }
          to   { transform: translateX(100%); }
        }
        .animate-shine {
          animation: shine 2s infinite linear;
        }
      `}</style>
    </div>
  );
}
