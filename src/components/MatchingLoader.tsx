"use client";

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const steps = [
  "Analyse de la Fiche de Poste...",
  "Extraction des compétences clés...",
  "Lecture du CV et du profil...",
  "Calcul du taux de matching...",
  "Rédaction de l'argumentaire client...",
  "Finalisation du rapport..."
];

export default function MatchingLoader() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[400px] animate-in fade-in zoom-in duration-500">
      <div className="relative mb-10">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="relative bg-white p-8 rounded-full shadow-2xl shadow-primary/10 border border-primary/10">
          <Loader2 className="w-16 h-16 text-primary animate-spin" strokeWidth={1.5} />
        </div>
      </div>

      <div className="text-center space-y-4 max-w-sm">
        <h3 className="text-2xl font-bold text-main tracking-tight">Analyse en cours...</h3>
        <p className="text-primary font-semibold text-lg animate-pulse min-h-[1.75rem]">
          {steps[currentStep]}
        </p>
        <p className="text-muted text-sm px-4">
          Nos algorithmes d&apos;IA identifient les points de convergence entre le CV et le poste.
        </p>
      </div>

      <div className="mt-12 flex gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === currentStep ? 'w-8 bg-primary' : 'w-2 bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
