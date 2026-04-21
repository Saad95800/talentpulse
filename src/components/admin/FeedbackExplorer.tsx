"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare,
  User,
  Briefcase,
  Calendar,
  Search,
  ChevronRight,
  Loader2
} from "lucide-react";
import { getAllFeedbacksAction } from "@/actions/feedback.action";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function FeedbackExplorer({ token }: { token: string }) {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    const res = await getAllFeedbacksAction(token);
    if (res.success && res.data) {
      setFeedbacks(res.data);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    const init = async () => {
      await fetchFeedbacks();
    };
    init();
  }, [fetchFeedbacks]);

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesSearch = 
      (f.feedbackComment?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      f.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.mission.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = filterRating === 'all' || f.feedbackRating === filterRating;
    
    return matchesSearch && matchesRating;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Chargement des avis utilisateurs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-500" />
            Explorateur d'Avis Premium
          </h3>
          <p className="text-sm text-slate-400 mt-1">Consultez les retours d'expérience pour affiner l'algorithme.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
            />
          </div>

          <select 
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Tous les avis</option>
            <option value="1">👍 Positifs</option>
            <option value="-1">👎 Négatifs</option>
          </select>
        </div>
      </div>

      {/* Statistics Mini-Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</p>
          <p className="text-xl font-bold text-white">{feedbacks.length}</p>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Positifs</p>
          <p className="text-xl font-bold text-emerald-400">{feedbacks.filter(f => f.feedbackRating === 1).length}</p>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Négatifs</p>
          <p className="text-xl font-bold text-red-400">{feedbacks.filter(f => f.feedbackRating === -1).length}</p>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Taux Sat.</p>
          <p className="text-xl font-bold text-blue-400">
            {feedbacks.length > 0 ? Math.round((feedbacks.filter(f => f.feedbackRating === 1).length / feedbacks.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">Avis</th>
                <th className="px-6 py-4">Utilisateur</th>
                <th className="px-6 py-4">Context Matching</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredFeedbacks.map((f) => (
                <tr key={f.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-2">
                      <div className={`flex items-center gap-2 w-fit px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        f.feedbackRating === 1 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {f.feedbackRating === 1 ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                        {f.feedbackRating === 1 ? 'Satisfait' : 'Déçu'}
                      </div>
                      <p className="text-sm text-slate-200 italic font-medium max-w-md">
                        "{f.feedbackComment || "Pas de commentaire laissé."}"
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{f.user.firstName} {f.user.lastName}</span>
                        <span className="text-xs text-slate-500">{f.user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs text-blue-400 font-bold">
                        <Briefcase className="w-3 h-3" />
                        {f.mission.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <User className="w-3 h-3" />
                        {f.candidate.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(f.createdAt), "dd MMM yyyy", { locale: fr })}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFeedbacks.length === 0 && (
          <div className="p-20 text-center text-slate-500 bg-slate-900/50">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="font-bold">Aucun avis ne correspond à votre recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
}
