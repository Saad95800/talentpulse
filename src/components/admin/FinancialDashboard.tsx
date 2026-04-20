"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  TrendingUp, DollarSign, Users, Target, 
  ArrowUpRight, 
  Calendar, Download, RefreshCw, Loader2,
  CheckCircle2, CreditCard, Star
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getFinancialStatsAction } from "@/actions/finance.admin.action";

export default function FinancialDashboard({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await getFinancialStatsAction(token);
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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Analyse des revenus en cours...</p>
      </div>
    );
  }

  if (!data) return <div className="p-10 text-center text-red-500">Erreur de chargement des données financières.</div>;

  const { stats, history, recentTransactions } = data;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Main Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-emerald-500" />
            Croissance & Finances
          </h2>
          <p className="text-slate-500 font-medium">Suivez la performance économique de TalentPulse.</p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
        >
          <RefreshCw className="w-4 h-4" /> Actualiser les données
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="w-20 h-20 text-emerald-600" />
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Chiffre d&apos;Affaire Total</p>
          <p className="text-3xl font-black text-slate-900">{stats.totalRevenue.toLocaleString('fr-FR')} €</p>
          <div className="mt-4 flex items-center gap-1 text-emerald-600 font-bold text-xs">
            <ArrowUpRight className="w-4 h-4" /> Lifetime
          </div>
        </div>

        {/* MRR */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden group text-white">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <RefreshCw className="w-20 h-20 text-blue-400" />
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-2">MRR (Récurrent Mensuel)</p>
          <p className="text-3xl font-black">{stats.mrr.toLocaleString('fr-FR')} €</p>
          <div className="mt-4 flex items-center gap-1 text-blue-400 font-bold text-xs uppercase tracking-tighter">
            PROJECTION BASÉE SUR {stats.activeSubscribersCount} SUBS
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target className="w-20 h-20 text-purple-600" />
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Taux de Conversion</p>
          <p className="text-3xl font-black text-slate-900">{stats.conversionRate.toFixed(1)}%</p>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-purple-500 rounded-full" style={{ width: `${stats.conversionRate}%` }}></div>
            </div>
          </div>
        </div>

        {/* ARPU */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-20 h-20 text-blue-600" />
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-2">ARPU (Revenu / Client)</p>
          <p className="text-3xl font-black text-slate-900">{stats.arpu.toFixed(2)} €</p>
          <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase">Moyenne par utilisateur payant</p>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl">
           <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900">Évolution de la Croissance</h3>
                <p className="text-sm text-slate-500">Chiffre d&apos;affaires mensuel sur les 12 derniers mois.</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 uppercase tracking-wider border border-slate-100">
                <Calendar className="w-4 h-4" /> 12 Mois
              </div>
           </div>
           
           <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}}
                    tickFormatter={(value) => `${value}€`}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                    itemStyle={{fontWeight: 900, color: '#0f172a'}}
                    cursor={{stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Small Breakdown Table / Stats */}
        <div className="lg:col-span-4 bg-slate-50 p-8 rounded-[40px] border border-slate-100 flex flex-col gap-6">
           <h3 className="text-xl font-black text-slate-900">Résumé Expansion</h3>
           <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Utilisateurs</span>
                </div>
                <p className="text-2xl font-black text-slate-900">{stats.totalUsers}</p>
                <p className="text-xs text-slate-500 mt-1">Nombre total de comptes créés</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg"><Star className="w-5 h-5 text-amber-600" /></div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Premium</span>
                </div>
                <p className="text-2xl font-black text-slate-900">{stats.activeSubscribersCount}</p>
                <p className="text-xs text-slate-500 mt-1">Abonnements actifs ce mois-ci</p>
              </div>

              <div className="bg-blue-600 p-6 rounded-2xl text-white mt-auto overflow-hidden relative">
                 <div className="absolute -bottom-4 -right-4 opacity-20">
                    <TrendingUp className="w-32 h-32" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Croissance projetée</p>
                 <p className="text-lg font-bold italic line-clamp-3">L&apos;objectif de 100 abonnés Premium générera ~5,000€ MRR.</p>
              </div>
           </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
         <div className="px-8 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div>
              <h3 className="text-xl font-black text-slate-900">Derniers Flux de Trésorerie</h3>
              <p className="text-sm text-slate-500">Journal des 10 derniers paiements validés via Mollie.</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-xs font-black text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all">
               <Download className="w-4 h-4" /> Exporter (.CSV)
            </button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5">Utilisateur</th>
                    <th className="px-8 py-5">Mode</th>
                    <th className="px-8 py-5">Référence Recu</th>
                    <th className="px-8 py-5 text-right">Montant</th>
                    <th className="px-8 py-5 text-center">Statut</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {recentTransactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-blue-50/20 transition-colors group">
                       <td className="px-8 py-4 text-xs font-bold text-slate-500">
                         {format(new Date(tx.createdAt), "dd MMM yyyy", { locale: fr })}
                       </td>
                       <td className="px-8 py-4">
                         <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900">{tx.user.firstName} {tx.user.lastName}</span>
                            <span className="text-xs text-slate-400">{tx.user.email}</span>
                         </div>
                       </td>
                       <td className="px-8 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            <CreditCard className="w-3 h-3" /> {tx.method || "CARTE"}
                          </span>
                       </td>
                       <td className="px-8 py-4 text-xs font-mono text-slate-400">
                          {tx.receiptNumber}
                       </td>
                       <td className="px-8 py-4 text-right">
                          <span className="text-sm font-black text-slate-900">+{tx.amount} €</span>
                       </td>
                       <td className="px-8 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase border border-emerald-100">
                             <CheckCircle2 className="w-3 h-3" /> Payé
                          </span>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
