"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getAdminHistoryAction } from "@/actions/history.action";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  FileText, 
  Search, 
  LogOut, 
  BarChart3, 
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  MessageSquare,
  Target,
  Users,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import UserActivityExplorer from "@/components/admin/UserActivityExplorer";
import AdminChatExplorer from "@/components/admin/AdminChatExplorer";
import FeedbackExplorer from "@/components/admin/FeedbackExplorer";
import FinancialDashboard from "@/components/admin/FinancialDashboard";
import AIQualityDashboard from "@/components/admin/AIQualityDashboard";
import GrowthDashboard from "@/components/admin/GrowthDashboard";
import CouponManager from "@/components/admin/CouponManager";
import { Ticket } from "lucide-react";

interface AdminHistoryRecord {
  id: string;
  userId: string;
  candidateName: string;
  jobTitle: string;
  score: number;
  createdAt: Date;
  user: {
    email: string;
    name: string | null;
  };
}

function DashboardContent() {
  const { user, token, logout, checkAuth } = useAuth();
  const searchParams = useSearchParams();
  const [history, setHistory] = useState<AdminHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const initialChatUserId = searchParams.get("userId") || undefined;
  const [activeTab, setActiveTab] = useState<"history" | "users" | "chat" | "finances" | "quality" | "growth" | "coupons" | "feedbacks">(
    initialChatUserId ? "chat" : "history"
  );
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const isValid = await checkAuth();
      if (!isValid || user?.role !== 'ADMIN') {
        router.push("/admin-talent-scraper");
        return;
      }

      if (token) {
        const res = await getAdminHistoryAction(token);
        if (res.success && res.records) {
          setHistory(res.records);
        }
      }
      setLoading(false);
    };
    init();
  }, [token, checkAuth, router, user?.role]);

  const filteredHistory = history.filter(h => 
    h.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: history.length,
    today: history.filter(h => new Date(h.createdAt).toDateString() === new Date().toDateString()).length,
    avgScore: history.length > 0 ? (history.reduce((acc, h) => acc + h.score, 0) / history.length).toFixed(1) : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* ... (rest of the component content) ... */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/20">
                T
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                TalentPulse Admin
              </h1>
            </div>

            <div className="hidden md:flex items-center gap-1">
               <Link 
                href="/admin-talent-scraper/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 shadow-lg shadow-blue-600/20 transition-all"
               >
                 <TrendingUp className="w-4 h-4" /> Dashboard
               </Link>
               <Link 
                href="/admin-talent-scraper/users"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
               >
                 <Users className="w-4 h-4" /> Utilisateurs
               </Link>
            </div>
          </div>
          <button 
            onClick={() => { logout(); router.push("/admin-talent-scraper"); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Analyses Totales</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <Clock className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Analyses Aujourd&apos;hui</p>
                <p className="text-2xl font-bold text-white">{stats.today}</p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <BarChart3 className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Score Moyen</p>
                <p className="text-2xl font-bold text-white">{stats.avgScore}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab("history")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <Clock className="w-4 h-4" /> Matchings
          </button>
          <button 
            onClick={() => setActiveTab("users")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <Activity className="w-4 h-4" /> Utilisateurs & Activité
          </button>
          <button 
            onClick={() => setActiveTab("feedbacks")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'feedbacks' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <MessageSquare className="w-4 h-4" /> Avis Utilisateurs
          </button>
          <button 
            onClick={() => setActiveTab("chat")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <MessageSquare className="w-4 h-4" /> Messages
          </button>
          <button 
            onClick={() => setActiveTab("finances")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'finances' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <DollarSign className="w-4 h-4" /> Finances
          </button>
          <button 
            onClick={() => setActiveTab("quality")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'quality' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <Target className="w-4 h-4" /> Qualité IA
          </button>
          <button 
            onClick={() => setActiveTab("growth")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'growth' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <TrendingUp className="w-4 h-4" /> Croissance
          </button>
          <button 
            onClick={() => setActiveTab("coupons")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'coupons' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <Ticket className="w-4 h-4" /> Coupons
          </button>
        </div>

        {activeTab === "finances" && token && <FinancialDashboard token={token} />}
        {activeTab === "feedbacks" && token && <FeedbackExplorer token={token} />}
        {activeTab === "quality" && token && <AIQualityDashboard token={token} />}
        {activeTab === "growth" && token && <GrowthDashboard token={token} />}
        {activeTab === "coupons" && <CouponManager />}

        {activeTab === "history" ? (
          /* Search and Table */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Journal des Matchings
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Rechercher (email, candidat, offre)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                />
              </div>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/30 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Utilisateur</th>
                  <th className="px-6 py-4">Type Offre / Client</th>
                  <th className="px-6 py-4 text-center">Score</th>
                  <th className="px-6 py-4">Fichiers</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredHistory.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{row.user.name || 'N/A'}</span>
                        <span className="text-xs text-slate-500">{row.user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-blue-400 font-medium">{row.jobTitle}</span>
                        <span className="text-xs text-slate-500">vs {row.candidateName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        row.score >= 70 ? 'bg-emerald-500/10 text-emerald-400' : 
                        row.score >= 40 ? 'bg-amber-500/10 text-amber-400' : 
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {row.score}%
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Analyse IA complète
                       </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {format(new Date(row.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-white">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredHistory.length === 0 && (
            <div className="p-12 text-center text-slate-500 italic">
              Aucune donnée correspondant à votre recherche.
            </div>
          )}
        </div>
        ) : activeTab === "users" ? (
           <UserActivityExplorer token={token || ""} />
        ) : (
           <AdminChatExplorer token={token || ""} initialUserId={initialChatUserId} />
        )}
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
