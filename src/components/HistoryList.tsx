"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserHistoryAction } from '@/actions/history.action';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  History, 
  FileSearch, 
  ChevronRight, 
  Search, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { MatchResult } from '@/lib/ai';

interface HistoryRecord {
  id: string;
  userId: string;
  candidateName: string;
  jobTitle: string;
  score: number;
  aiResponse: MatchResult;
  createdAt: string;
  mission?: { description: string };
  candidate?: Record<string, unknown>;
}

interface HistoryListProps {
  onSelectAnalysis: (result: MatchResult) => void;
}

export default function HistoryList({ onSelectAnalysis }: HistoryListProps) {
  const { user, token } = useAuth();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      // DEBUG: Vérification de la dispo des données d'auth
      console.log("[HistoryList] Tentative de chargement:", { hasToken: !!token, hasUserId: !!user?.id });
      
      if (!token || !user?.id) {
        // On ne coupe pas le loading tout de suite si on attend l'auth au montage,
        // mais au bout d'un cycle on laisse tomber si vraiment rien ne vient.
        return;
      }
      
      try {
        const res = await getUserHistoryAction(user.id, token);
        if (res.success && res.records) {
          setRecords(res.records as unknown as HistoryRecord[]);
        }
      } catch (error) {
        console.error("Erreur chargement historique:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    
    // Sécurité : Si après 3 secondes on charge toujours, on libère le spinner
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, [token, user?.id]);

  const filteredRecords = records.filter(r => 
    r.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.candidateName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-muted font-bold text-sm tracking-widest uppercase">Chargement de votre historique...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex p-6 bg-slate-100 rounded-full mb-6">
          <History className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-main mb-2">Aucun historique trouvé</h3>
        <p className="text-muted text-sm max-w-sm mx-auto">
          Vous n&apos;avez pas encore effectué d&apos;analyse de matching. Commencez dès maintenant pour voir vos résultats ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-main flex items-center gap-3">
            <History className="w-6 h-6 text-primary" />
            Historique des analyses
          </h2>
          <p className="text-muted text-sm font-medium">Retrouvez et rouvrez vos matchings précédents.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input 
            type="text"
            placeholder="Rechercher une analyse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-64 transition-all"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredRecords.map((record) => (
          <div 
            key={record.id}
            onClick={() => onSelectAnalysis({
              ...record.aiResponse,
              jobDescription: record.mission?.description,
              fullCandidate: record.candidate
            })}
            className="group relative bg-white border border-slate-200 p-5 rounded-2xl cursor-pointer hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  record.score >= 70 ? 'bg-emerald-50 text-emerald-600' : 
                  record.score >= 40 ? 'bg-amber-50 text-amber-600' : 
                  'bg-red-50 text-red-600'
                }`}>
                  <FileSearch className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-main group-hover:text-primary transition-colors text-lg">
                    {record.jobTitle}
                  </h4>
                  <p className="text-sm text-muted font-medium mb-2">Candidat : {record.candidateName}</p>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(record.createdAt), 'dd MMMM yyyy (HH:mm)', { locale: fr })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6">
                <div className="text-right">
                  <div className={`text-2xl font-black ${
                    record.score >= 70 ? 'text-emerald-500' : 
                    record.score >= 40 ? 'text-amber-500' : 
                    'text-red-500'
                  }`}>
                    {Math.round(record.score)}%
                  </div>
                  <div className="text-[10px] font-bold text-muted uppercase tracking-tighter">Matching IA</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredRecords.length === 0 && (
          <div className="flex flex-col items-center py-10 text-muted opacity-60">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p className="text-sm font-medium">Aucune analyse ne correspond à votre recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
}
