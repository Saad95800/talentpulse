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

import { PDFDownloadLink } from '@react-pdf/renderer';
import MatchReportPDF from './pdf/MatchReportPDF';
import { Download } from 'lucide-react';

export default function MatchResultView({ result, candidateName }: MatchResultViewProps) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 stroke-emerald-600';
    if (score >= 50) return 'text-amber-600 stroke-amber-600';
    return 'text-red-600 stroke-red-600';
  };

  const scoreColor = getScoreColor(result.score);
  const strokeDasharray = `${result.score}, 100`;

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* ... structure existante ... */}
      {/* Header Result */}
      <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-300 border border-slate-300 mb-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Award className="w-48 h-48 rotate-12" />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
          {/* Circular Score */}
          <div className="relative w-48 h-48 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <path
                className="stroke-slate-200"
                strokeWidth="3.5"
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-200 text-slate-700 text-xs font-black mb-4 border border-slate-300">
              <TrendingUp className="w-3 h-3" />
              Analyse prédictive IA
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-main mb-3 tracking-tight">
              Analyse pour <span className="text-primary">{candidateName}</span>
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
              <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 border border-emerald-200 px-5 py-2.5 rounded-xl text-sm font-black">
                <CheckCircle2 className="w-4 h-4" />
                {result.competences_validees.length} Points forts
              </div>
              <div className="flex items-center gap-2 bg-red-100 text-red-800 border border-red-200 px-5 py-2.5 rounded-xl text-sm font-black">
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
        <section className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 border border-slate-300">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-4">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-main text-xl">Compétences Validées</h3>
          </div>
          <ul className="space-y-3">
            {result.competences_validees.map((skill, index) => (
              <li key={index} className="flex items-start gap-3 p-4 bg-emerald-100/40 rounded-xl group hover:bg-emerald-100/60 border border-emerald-200 transition-all">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span className="text-sm font-bold text-emerald-950 leading-tight">{skill}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Missing Skills */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 border border-slate-300">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-4">
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
              <XCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-main text-xl">Points de Vigilance</h3>
          </div>
          <ul className="space-y-3">
            {result.competences_manquantes.map((skill, index) => (
              <li key={index} className="flex items-start gap-3 p-4 bg-red-100/40 rounded-xl group hover:bg-red-100/60 border border-red-200 transition-all">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-red-600 shrink-0" />
                <span className="text-sm font-bold text-red-950 leading-tight">{skill}</span>
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
            &quot;{result.argumentaire_client}&quot;
          </p>
        </div>
      </section>

      {/* Actions */}
      <div className="mt-12 flex justify-center">
        {isClient && (
          <PDFDownloadLink
            document={<MatchReportPDF result={result} candidateName={candidateName} />}
            fileName={`Analyse_TalentMatcher_${candidateName.replace(/\s+/g, '_')}.pdf`}
            className="flex items-center gap-3 bg-primary text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-primary-hover transition-all shadow-xl hover:-translate-y-1"
          >
            {({ loading }) => (
              <>
                <Download className="w-5 h-5" />
                {loading ? "Génération du PDF..." : "Exporter l'analyse (PDF)"}
              </>
            )}
          </PDFDownloadLink>
        )}
      </div>
    </div>
  );
}
