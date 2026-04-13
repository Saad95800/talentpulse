"use client";

import React from 'react';
import { MatchResult } from '@/lib/ai';
import { 
  CheckCircle2, 
  XCircle, 
  MessageSquareQuote,
  TrendingUp,
  Award,
  AlertTriangle
} from 'lucide-react';

interface MatchResultViewProps {
  result: MatchResult;
  candidateName: string;
}

export default function MatchResultView({ result, candidateName }: MatchResultViewProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 stroke-emerald-500';
    if (score >= 50) return 'text-amber-500 stroke-amber-500';
    return 'text-red-500 stroke-red-500';
  };

  const scoreColor = getScoreColor(result.score);
  const strokeDasharray = `${result.score}, 100`;

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header Result */}
      <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200 border border-slate-100 mb-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Award className="w-48 h-48 rotate-12" />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
          {/* Circular Score */}
          <div className="relative w-48 h-48 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <path
                className="stroke-slate-100"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${scoreColor} transition-all duration-1000 ease-out`}
                strokeWidth="3"
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-main leading-none">{result.score}</span>
              <span className="text-xs font-bold text-muted uppercase tracking-tighter">% Match</span>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold mb-4">
              <TrendingUp className="w-3 h-3" />
              Analyse prédictive IA
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-main mb-3 tracking-tight">
              Analyse pour <span className="text-primary">{candidateName}</span>
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold">
                <CheckCircle2 className="w-4 h-4" />
                {result.competences_validees.length} Points forts
              </div>
              <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-xl text-sm font-bold">
                <AlertTriangle className="w-4 h-4" />
                {result.competences_manquantes.length} Écarts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        {/* Validated Skills */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-100 border border-slate-50">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-main text-xl">Compétences Validées</h3>
          </div>
          <ul className="space-y-3">
            {result.competences_validees.map((skill, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-emerald-50/30 rounded-xl group hover:bg-emerald-50 transition-colors">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-sm font-medium text-emerald-900 leading-tight">{skill}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Missing Skills */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-100 border border-slate-50">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
              <XCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-main text-xl">Points de Vigilance</h3>
          </div>
          <ul className="space-y-3">
            {result.competences_manquantes.map((skill, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-red-50/30 rounded-xl group hover:bg-red-50 transition-colors">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span className="text-sm font-medium text-red-900 leading-tight">{skill}</span>
              </li>
            ))}
            {result.competences_manquantes.length === 0 && (
              <p className="text-muted text-sm italic">Aucune lacune majeure détectée.</p>
            )}
          </ul>
        </section>
      </div>

      {/* Argumentaire Client */}
      <section className="bg-main text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <MessageSquareQuote className="w-32 h-32" />
        </div>
        
        <div className="relative z-10">
          <h3 className="text-2xl font-black mb-6 flex items-center gap-3 uppercase tracking-wider text-primary">
            Verdict du Chasseur de Têtes
          </h3>
          <p className="text-lg md:text-xl font-medium leading-relaxed text-indigo-100 italic">
            "{result.argumentaire_client}"
          </p>
        </div>
      </section>

      {/* Actions */}
      <div className="mt-12 flex justify-center">
        <button 
          onClick={() => window.print()}
          className="bg-white text-main border border-slate-200 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm"
        >
          Exporter l'analyse (PDF)
        </button>
      </div>
    </div>
  );
}
