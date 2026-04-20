"use client";

import { useState, useEffect } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell,
  Legend
} from "recharts";
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  Zap, 
  TrendingUp, 
  ArrowUpRight, 
  Filter,
  RefreshCw,
  Loader2,
  Trophy,
  Activity
} from "lucide-react";
import { getGrowthStatsAction } from "@/actions/growth.admin.action";

export default function GrowthDashboard({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<"daily" | "monthly">("daily");

  const fetchData = async () => {
    setLoading(true);
    const res = await getGrowthStatsAction(token);
    if (res.success) {
      setData(res);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Compilation des données de croissance...</p>
      </div>
    );
  }

  if (!data) return null;

  const { growth, funnel, stats } = data;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-sm font-black text-white">
            {payload[0].value} Inscriptions
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-indigo-600" />
              Indicateurs de Croissance
           </h3>
           <p className="text-sm text-slate-500 font-medium mt-1">Suivez l&apos;évolution de votre base utilisateur et l&apos;efficacité du tunnel.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-slate-100 p-1 rounded-xl flex">
              <button 
                onClick={() => setViewType("daily")}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewType === 'daily' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                30 Jours
              </button>
              <button 
                onClick={() => setViewType("monthly")}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewType === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                12 Mois
              </button>
           </div>
           <button 
              onClick={fetchData}
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
           >
              <RefreshCw className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <StatsCard 
            title="Total Utilisateurs" 
            value={stats.totalUsers} 
            icon={<Users className="w-5 h-5" />} 
            color="bg-blue-50 text-blue-600"
         />
         <StatsCard 
            title="Taux Vérification" 
            value={`${stats.verificationRate.toFixed(1)}%`} 
            icon={<UserCheck className="w-5 h-5" />} 
            color="bg-indigo-50 text-indigo-600"
         />
         <StatsCard 
            title="Taux Activité" 
            value={`${stats.activityRate.toFixed(1)}%`} 
            icon={<Activity className="w-5 h-5" />} 
            color="bg-amber-50 text-amber-600"
         />
         <StatsCard 
            title="Conversion Premium" 
            value={`${stats.paidConversionRate.toFixed(1)}%`} 
            icon={<Trophy className="w-5 h-5" />} 
            color="bg-emerald-50 text-emerald-600"
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Enrollment Chart */}
         <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
               <UserPlus className="w-4 h-4 text-blue-500" />
               Courbe d&apos;Acquisition
            </h4>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={viewType === 'daily' ? growth.daily : growth.monthly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey={viewType === 'daily' ? "date" : "month"} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="inscriptions" 
                      stroke="#4f46e5" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, stroke: '#4f46e5', strokeWidth: 2, fill: '#fff' }}
                    />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Funnel Chart */}
         <div className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 shadow-2xl text-white">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
               <Filter className="w-4 h-4" />
               Tunnel de Conversion
            </h4>
            <div className="space-y-6">
               {funnel.map((item: any, index: number) => (
                  <div key={item.name} className="relative">
                     <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.name}</span>
                        <span className="text-sm font-black">{item.count}</span>
                     </div>
                     <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${index === 0 ? 100 : (item.count / funnel[0].count) * 100}%`,
                            backgroundColor: item.color
                          }}
                        />
                     </div>
                     {index > 0 && (
                        <div className="absolute -top-3 right-0 text-[10px] font-bold text-slate-500">
                           {((item.count / funnel[index-1].count) * 100).toFixed(0)}% du palier précédent
                        </div>
                     )}
                  </div>
               ))}
            </div>
            
            <div className="mt-12 p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Indice de Conversion Final</p>
               <div className="flex items-center gap-3">
                  <div className="text-3xl font-black text-emerald-400">
                     {stats.paidConversionRate.toFixed(1)}%
                  </div>
                  <div className="flex-1 text-slate-400 text-[10px] font-medium leading-tight">
                     Des inscrits deviennent des clients Premium à 49.99€/mois.
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
       <div className={`p-3 rounded-xl ${color}`}>
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{title}</p>
          <p className="text-xl font-black text-slate-900 leading-none">{value}</p>
       </div>
    </div>
  );
}
