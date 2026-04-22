"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Cpu, Activity, CheckCircle, XCircle, 
  RefreshCw, AlertTriangle, Terminal,
  Maximize2, Zap
} from "lucide-react";
import { 
  getWorkerDashboardStats, 
  getBatchJobsList, 
  getBatchJobDetails, 
  getSystemLogs,
  resetStuckJobsAction
} from "@/actions/worker.admin.action";
import { format } from "date-fns";
import toast from "react-hot-toast";
import ConfirmationModal from '../common/ConfirmationModal';

export default function WorkerMonitor() {
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isInitial: boolean = false) => {
    if (!isInitial) setRefreshing(true);
    const [statsRes, jobsRes, logsRes] = await Promise.all([
      getWorkerDashboardStats(),
      getBatchJobsList(1, 20),
      getSystemLogs(30)
    ]);

    if (statsRes.success) setStats(statsRes.stats);
    if (jobsRes.success) setJobs(jobsRes.jobs || []);
    if (logsRes.success) setLogs(logsRes.logs || []);
    
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    // Utilisation de queueMicrotask pour éviter le warning de setState synchrone dans l'effet
    queueMicrotask(() => {
      fetchData(true);
    });
    // Auto-refresh toutes les 30 secondes pour le monitoring
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleResetJobs = async () => {
    setShowResetConfirm(false);
    const res = await resetStuckJobsAction();
    if (res.success) {
      toast.success(`${res.count} jobs réinitialisés.`);
    } else {
      toast.error("Erreur lors de la réinitialisation.");
    }
    fetchData();
  };

  const showJobDetails = async (jobId: string) => {
    const res = await getBatchJobDetails(jobId);
    if (res.success) {
      setSelectedJob(res.job);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Cpu className="w-12 h-12 text-blue-500 animate-pulse" />
        <p className="text-slate-400 font-mono text-sm uppercase tracking-widest">Initialisation Terminal Worker...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header & Main Control */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Cpu className="w-8 h-8 text-blue-500" />
            Console Pipeline IA
          </h2>
          <p className="text-slate-500 font-medium font-mono text-xs uppercase tracking-tighter mt-1">
            Status: <span className="text-emerald-500">Operational</span> {"//"} node_v22.20 {"//"} bullmq_engine
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-200"
          >
            <AlertCircle className="w-4 h-4" />
            Réinitialiser les jobs bloqués
          </button>
          <button 
            onClick={() => fetchData()}
            disabled={refreshing}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> 
            {refreshing ? 'Sync...' : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* Grille des statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap className="w-24 h-24 text-blue-500" />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Matchings</p>
          <p className="text-3xl font-black text-white">{stats?.totalJobs || 0}</p>
          <div className="mt-4 flex items-center gap-2 text-blue-400 font-bold text-xs">
             Cluster d&apos;analyse actif
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <CheckCircle className="w-24 h-24 text-emerald-500" />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Taux de Succès</p>
          <p className="text-3xl font-black text-emerald-500">{stats?.successRate.toFixed(1)}%</p>
          <div className="mt-4 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500" style={{ width: `${stats?.successRate}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden group">
           <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity className="w-24 h-24 text-amber-500" />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">En cours (Live)</p>
          <p className="text-3xl font-black text-amber-500">{stats?.processingNow || 0}</p>
          <p className="text-xs text-slate-500 mt-4 italic font-medium">Jobs BullMQ actifs</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden group">
           <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <XCircle className="w-24 h-24 text-red-500" />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Échecs Aujourd&apos;hui</p>
          <p className="text-3xl font-black text-red-500">{stats?.failedToday || 0}</p>
          <p className="text-xs text-slate-500 mt-4 italic font-medium">Auto-report Sentry actif</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Jobs Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
             <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                   <Terminal className="w-4 h-4 text-blue-500" /> Historique des Traitements
                </h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-800/30 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-800">
                        <th className="px-6 py-4">Job ID</th>
                        <th className="px-6 py-4">Utilisateur</th>
                        <th className="px-6 py-4">Statut</th>
                        <th className="px-6 py-4">Items</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4 text-right">Détails</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800">
                      {jobs.map((job) => (
                        <tr key={job.id} className="hover:bg-blue-600/5 transition-colors group">
                           <td className="px-6 py-4">
                              <span className="text-xs font-mono text-slate-500 truncate w-24 block">#{job.id.substring(0, 8)}</span>
                           </td>
                           <td className="px-6 py-4">
                             <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">{job.user.email}</span>
                             </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                                job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                job.status === 'FAILED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
                              }`}>
                                {job.status}
                              </span>
                           </td>
                           <td className="px-6 py-4">
                              <span className="text-xs font-bold text-slate-400">
                                {job.processedItems} / {job.totalItems}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-[10px] text-slate-500 font-medium">
                              {format(new Date(job.createdAt), "dd/MM HH:mm")}
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => showJobDetails(job.id)}
                                className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all active:scale-90"
                              >
                                <Maximize2 className="w-4 h-4" />
                              </button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>

        {/* Real-time System Logs */}
        <div className="lg:col-span-4 space-y-4">
           <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl h-full flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                 <Terminal className="w-5 h-5 text-blue-500" />
                 <h3 className="text-sm font-black text-white uppercase tracking-widest">System Logs</h3>
                 <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                 {logs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl group hover:border-slate-700 transition-all cursor-default">
                       <div className="flex items-center gap-2 mb-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                             log.level === 'ERROR' ? 'bg-red-500' : 
                             log.level === 'WARN' ? 'bg-amber-500' : 'bg-blue-500'
                          }`}></span>
                          <span className="text-[9px] font-black text-slate-500">{format(new Date(log.createdAt), "HH:mm:ss")}</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${
                             log.level === 'ERROR' ? 'text-red-500' : 
                             log.level === 'WARN' ? 'text-amber-500' : 'text-blue-500'
                          }`}>{log.level}</span>
                       </div>
                       <p className="text-[11px] text-slate-300 leading-relaxed font-mono break-words">{log.message}</p>
                       {log.context && (
                          <div className="mt-2 text-[9px] text-slate-500 bg-black/30 p-2 rounded-lg truncate hidden group-hover:block">
                             {log.context}
                          </div>
                       )}
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Item Details Overlay (Modal) */}
      {selectedJob && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedJob(null)}></div>
           <div className="relative bg-slate-900 w-full max-w-4xl border border-slate-800 rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                 <div>
                    <h4 className="text-xl font-black text-white">Inspections du Job</h4>
                    <p className="text-sm text-slate-500 font-mono">#{selectedJob.id}</p>
                 </div>
                 <button onClick={() => setSelectedJob(null)} className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
                    <XCircle className="w-6 h-6 text-white" />
                 </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedJob.items.map((item: any) => (
                       <div key={item.id} className={`p-4 rounded-2xl border ${
                          item.status === 'COMPLETED' ? 'bg-emerald-500/5 border-emerald-500/10' :
                          item.status === 'FAILED' ? 'bg-red-500/5 border-red-500/10' : 'bg-slate-800/50 border-slate-700'
                       }`}>
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-xs font-black text-white">{item.candidateName || 'Candidat Scan'}</span>
                             <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                item.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                item.status === 'FAILED' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-slate-800 text-slate-500'
                             }`}>
                                {item.status}
                             </span>
                          </div>
                          {item.error && (
                             <p className="text-xs text-red-400 font-mono mt-2 p-2 bg-red-500/5 rounded-lg border border-red-500/10 break-words">
                                {item.error}
                             </p>
                          )}
                          {item.matchRecord && (
                             <div className="mt-3 flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 italic">Score: {item.matchRecord.score}%</span>
                                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                   <div className="h-full bg-blue-500" style={{ width: `${item.matchRecord.score}%` }}></div>
                                </div>
                             </div>
                          )}
                       </div>
                    ))}
                 </div>
              </div>
              
              <div className="p-8 bg-slate-950/50 border-t border-slate-800 flex justify-end">
                 <button 
                  onClick={() => setSelectedJob(null)}
                  className="px-8 py-3 bg-white text-slate-950 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                 >
                   Fermer la console
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
