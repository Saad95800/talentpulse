"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  ThumbsUp, 
  ThumbsDown, 
  AlertCircle, 
  MessageSquare,
  ChevronRight,
  TrendingDown,
  Loader2,
  RefreshCw,
  Target
} from "lucide-react";
import { getAIQualityStatsAction } from "@/actions/feedback.action";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AIQualityDashboard({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await getAIQualityStatsAction(token);
    if (res.success) {
      setData(res);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchData();
    });
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Analyse de la précision IA...</p>
      </div>
    );
  }

  if (!data) return null;

  const { stats, reports } = data;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Target className="w-7 h-7 text-blue-600" />
              Observatoire Qualité IA
           </h3>
           <p className="text-sm text-slate-500 font-medium mt-1">Surveillez et améliorez la pertinence de l&apos;algorithme de matching.</p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCw className="w-3 h-3" /> Actualiser
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Precision Rate */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
           <div className={`absolute inset-x-0 bottom-0 h-1 ${stats.satisfactionRate > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Taux de Précision IA</p>
           <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-slate-900">{stats.satisfactionRate.toFixed(1)}%</span>
              <span className="text-xs font-bold text-slate-400 mb-1">Satisfait</span>
           </div>
           <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">Basé sur {stats.totalFeedbacks} retours réels</p>
        </div>

        {/* Average Match Score */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-sm relative overflow-hidden group text-white">
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Score de Matching Moyen</p>
           <div className="flex items-end gap-2">
              <span className="text-4xl font-black">{stats.averageAIScore.toFixed(1)}%</span>
              <span className="text-xs font-bold text-slate-400 mb-1">Confiance IA</span>
           </div>
           <div className="mt-4 flex gap-1">
              {[1,2,3,4,5].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i <= (stats.averageAIScore/20) ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
              ))}
           </div>
        </div>

        {/* Global Volume */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Volume de Feedback</p>
           <div className="flex items-end gap-2 text-slate-900">
              <span className="text-4xl font-black">{stats.totalFeedbacks}</span>
              <span className="text-xs font-bold text-slate-400 mb-1">Avis reçus</span>
           </div>
           <div className="mt-4 flex items-center gap-4 text-[10px] font-black uppercase">
              <div className="flex items-center gap-1 text-emerald-600"><ThumbsUp className="w-3 h-3" /> {Math.round(stats.totalFeedbacks * (stats.satisfactionRate/100))}</div>
              <div className="flex items-center gap-1 text-red-500"><ThumbsDown className="w-3 h-3" /> {Math.round(stats.totalFeedbacks * (1 - stats.satisfactionRate/100))}</div>
           </div>
        </div>
      </div>

      {/* Negative Feedback Reports */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden">
         <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
               <AlertCircle className="w-5 h-5 text-red-500" />
               Signalements à Analyser
            </h4>
            <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase tracking-wider">Priorité Diagnostic</span>
         </div>
         
         <div className="divide-y divide-slate-50">
            {reports.length === 0 ? (
               <div className="p-12 text-center text-slate-400">
                  <ThumbsUp className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  <p className="font-medium italic">Aucun feedback négatif récent. L&apos;IA performe bien !</p>
               </div>
            ) : (
              reports.map((report: any) => (
                <div key={report.id} className="p-6 hover:bg-slate-50 transition-colors group">
                   <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                         <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-tighter">
                               {format(new Date(report.createdAt), "dd MMM HH:mm", { locale: fr })}
                            </span>
                            <span className="text-sm font-black text-slate-900">{report.candidateName}</span>
                            <span className="text-xs text-slate-400">vs</span>
                            <span className="text-sm font-bold text-slate-700">{report.jobTitle}</span>
                         </div>
                         <p className="text-sm text-red-600 font-bold bg-red-50/50 p-3 rounded-xl border-l-4 border-red-500 mb-2">
                           &quot;{report.feedbackComment || "L&apos;utilisateur n&apos;a pas laissé de commentaire précisant le problème."}&quot;
                         </p>
                         <div className="flex items-center gap-4">
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                               <RefreshCw className="w-3 h-3" /> Score IA : {report.score}%
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                               <MessageSquare className="w-3 h-3" /> Par {report.user.firstName} ({report.user.email})
                            </div>
                         </div>
                      </div>
                      <button className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                         <ChevronRight className="w-5 h-5" />
                      </button>
                   </div>
                </div>
              ))
            )}
         </div>
      </div>
      
      {/* Optimization Tip */}
      <div className="bg-blue-600 rounded-[32px] p-8 text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <TrendingDown className="w-48 h-48 rotate-12" />
        </div>
         <h4 className="text-xl font-black mb-2">Conseil d&apos;Optimisation</h4>
         <p className="text-blue-100 text-sm font-medium leading-relaxed max-w-2xl">
            Si vous observez plusieurs signalements sur un même type de profil, vous pouvez ajuster les &quot;Instructions Système&quot; de l&apos;IA dans le module matching pour renforcer la détection de compétences spécifiques.
         </p>
      </div>
    </div>
  );
}
