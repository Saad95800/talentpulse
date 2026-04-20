"use client";

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

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
  const [progress, setProgress] = useState(0);

  // Réinitialisation du simulateur à chaque changement de CV (batch)
  useEffect(() => {
    if (loadingStep) {
      queueMicrotask(() => {
        setCurrentStep(0);
        setProgress(0);
      });
    }
  }, [loadingStep]);

  useEffect(() => {
    if (!loading) {
      queueMicrotask(() => {
        setCurrentStep(0);
        setProgress(0);
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
      setProgress(prev => Math.min(prev + 1, 95));
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

      {/* Barre de progression */}
      <div className="mt-10 w-full max-w-xs">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
          <span>Progression</span>
          <span style={{ color: 'var(--color-primary, #2563EB)' }}>{progress}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(to right, #2563EB, #818cf8)',
              backgroundColor: 'var(--color-primary, #2563EB)'
            }}
          />
        </div>
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
      `}</style>
    </div>
  );
}
