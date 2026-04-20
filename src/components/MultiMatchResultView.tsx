"use client";

import React, { useState } from 'react';
import { MatchResult } from '@/lib/ai';
import { 
  Users, 
  Trophy, 
  AlertCircle,
  ArrowRight,
  TrendingUp,
  X,
  Loader2,
  Clock
} from 'lucide-react';
import MatchResultView from './MatchResultView';

interface MultiMatchResultViewProps {
  results: MatchResult[];
}

export default function MultiMatchResultView({ results }: MultiMatchResultViewProps) {
  const [selectedResult, setSelectedResult] = useState<MatchResult | null>(null);

  const getScoreColor = (score: number, status?: string) => {
    if (status === 'FAILED') return 'bg-red-50 text-red-600 border-red-200';
    if (status === 'PROCESSING') return 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse';
    if (status === 'PENDING') return 'bg-slate-50 text-slate-400 border-slate-200';
    
    if (score >= 80) return 'bg-emerald-100 text-emerald-600 border-emerald-200';
    if (score >= 50) return 'bg-amber-100 text-amber-600 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header Statistique */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-main leading-tight">Résultats Groupés</h2>
            <p className="text-sm font-bold text-muted uppercase tracking-wider">
              {results.length} Candidat{results.length > 1 ? 's' : ''} analysé{results.length > 1 ? 's' : ''} pour cette mission
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="h-10 w-px bg-slate-200 hidden md:block" />
            <div className="text-center px-4">
                <p className="text-[10px] font-black uppercase text-muted tracking-widest">Moyenne</p>
                <p className="text-2xl font-black text-main">
                    {results.filter(r => r.status === 'COMPLETED').length > 0 
                      ? Math.round(results.filter(r => r.status === 'COMPLETED').reduce((acc, r) => acc + (r.score || 0), 0) / results.filter(r => r.status === 'COMPLETED').length)
                      : 0}%
                </p>
            </div>
        </div>
      </div>

      {/* Titre dynamique "Analyse en cours" */}
      {results.some(r => r.status === 'PROCESSING' || r.status === 'PENDING') && (
        <div className="flex items-center gap-3 mb-6 px-4 animate-pulse">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          </div>
          <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em]">Analyse en cours...</h3>
          <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent ml-2"></div>
        </div>
      )}

      {/* Liste des cards */}
      <div className="grid gap-4">
        {results.map((result, index) => {
          const isCompleted = result.status === 'COMPLETED';
          const isProcessing = result.status === 'PROCESSING';
          const isPending = result.status === 'PENDING';
          const isFailed = result.status === 'FAILED';
          
          const name = result.candidateInfo 
            ? `${result.candidateInfo.firstName || ''} ${result.candidateInfo.lastName || ''}`.trim() || `Candidat ${index + 1}`
            : `Candidat ${index + 1}` || '--';

          return (
            <div 
              key={index}
              onClick={() => isCompleted && setSelectedResult(result)}
              className={`
                group relative bg-white p-6 rounded-[2rem] border-2 transition-all duration-300
                ${!isCompleted 
                  ? 'border-slate-100 bg-slate-50/30 cursor-default' 
                  : 'border-slate-100 hover:border-primary hover:shadow-xl hover:shadow-primary/5 cursor-pointer hover:-translate-y-1'}
                ${isFailed ? 'border-red-100 bg-red-50/30' : ''}
                ${isProcessing ? 'border-blue-200 bg-blue-50/20 shadow-lg shadow-blue-500/5 ring-2 ring-blue-500/20' : ''}
              `}
            >
              <div className="flex items-center gap-6">
                {/* Score / Status Icon */}
                <div className={`
                  w-16 h-16 shrink-0 rounded-2xl flex flex-col items-center justify-center border-2 font-black transition-transform group-hover:scale-110
                  ${getScoreColor(result.score, result.status)}
                `}>
                  {isFailed ? (
                    <AlertCircle className="w-7 h-7" />
                  ) : isProcessing ? (
                    <div className="relative">
                      <Loader2 className="w-7 h-7 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
                      </div>
                    </div>
                  ) : isPending ? (
                    <Clock className="w-7 h-7 opacity-50" />
                  ) : (
                    <>
                      <span className="text-xl leading-none">{result.score}</span>
                      <span className="text-[8px] uppercase tracking-tighter">%</span>
                    </>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-black text-main truncate">{name}</h3>
                    {isCompleted && result.score >= 90 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[9px] font-black rounded-md uppercase border border-yellow-200">
                        <Trophy className="w-3 h-3" /> Top
                      </span>
                    )}
                    {isProcessing && (
                      <span className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-[9px] font-black rounded-full uppercase border border-blue-400 shadow-md animate-bounce">
                        <Loader2 className="w-3 h-3 animate-spin shadow-sm" /> En cours
                      </span>
                    )}
                    {isPending && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded-md uppercase border border-slate-200">
                        En attente
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-bold uppercase tracking-widest ${isFailed ? 'text-red-500' : 'text-slate-400'}`}>
                    {isFailed ? "Échec de l'analyse IA" : 
                     isProcessing ? "L'IA parcourt le document activement..." :
                     isPending ? "Dans la file d'attente d'analyse..." :
                     (result.argumentaire_client?.slice(0, 80) + "...")}
                  </p>
                </div>

                {isCompleted && (
                  <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
                
                {isProcessing && (
                  <div className="flex flex-col items-end gap-1 shrink-0 animate-pulse">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Analyse IA</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Barre de progression subtile au hover */}
              {isCompleted && (
                <div className="absolute bottom-0 left-8 right-8 h-1 overflow-hidden rounded-full">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 origin-left scale-x-0 group-hover:scale-x-100 shadow-[0_0_8px_rgba(37,99,235,0.5)]" 
                    style={{ width: `${result.score}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de détail */}
      {selectedResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            onClick={() => setSelectedResult(null)}
          />
          
          <div className="relative w-full max-w-6xl max-h-[90vh] bg-slate-50 rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col animate-in zoom-in-95 duration-300">
            {/* Header Modal */}
            <div className="px-10 py-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-main">
                          Candidat {selectedResult.candidateInfo ? `${selectedResult.candidateInfo.firstName} ${selectedResult.candidateInfo.lastName}` : (results.indexOf(selectedResult) + 1)}
                        </h3>
                        <p className="text-xs font-bold text-muted uppercase tracking-widest italic">Analyse IA Temps Réel</p>
                    </div>
                </div>
                <button 
                  onClick={() => setSelectedResult(null)}
                  className="p-3 hover:bg-slate-100 rounded-full text-slate-400 hover:text-main transition-colors"
                >
                  <X className="w-7 h-7" />
                </button>
            </div>

            {/* Content Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              <MatchResultView 
                result={selectedResult} 
                candidateName={selectedResult.candidateInfo ? `${selectedResult.candidateInfo.firstName} ${selectedResult.candidateInfo.lastName}` : "Candidat"} 
              />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
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
