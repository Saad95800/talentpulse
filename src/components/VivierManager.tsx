"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  getCandidatesAction, 
  getMissionsAction, 
  deleteCandidateAction, 
  deleteMissionAction 
} from '@/actions/vivier.action';
import { 
  Users, 
  Briefcase, 
  Trash2, 
  User as UserIcon, 
  Calendar,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import CandidateModal from './CandidateModal';

// Types locaux pour le vivier
interface Candidate {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  linkedin?: string | null;
  website?: string | null;
  summary?: string | null;
  languages?: any;
  skills?: any;
  experiences?: any;
  educations?: any;
  createdAt: string;
}

interface Mission {
  id: string;
  title: string;
  createdAt: string;
}

export default function VivierManager() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'candidates' | 'missions'>('candidates');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Chargement des données au montage ou changement d'onglet
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        if (activeSubTab === 'candidates') {
          const res = await getCandidatesAction(user.id);
          if (res.success && res.candidates) {
            setCandidates(res.candidates as any);
          }
        } else {
          const res = await getMissionsAction(user.id);
          if (res.success && res.missions) {
            setMissions(res.missions as unknown as Mission[]);
          }
        }
      } catch (err) {
        console.error("Erreur chargement vivier:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeSubTab, user?.id]);

  const handleCandidateClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsModalOpen(true);
  };

  // Actions de suppression
  const handleDeleteCandidate = async (id: string) => {
    if (!user?.id || !confirm("Supprimer ce candidat et ses analyses associées ?")) return;
    setActionLoading(id);
    try {
      const res = await deleteCandidateAction(id, user.id);
      if (res.success) {
        setCandidates(prev => prev.filter(c => c.id !== id));
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMission = async (id: string) => {
    if (!user?.id || !confirm("Supprimer cette mission et ses analyses associées ?")) return;
    setActionLoading(id);
    try {
      const res = await deleteMissionAction(id, user.id);
      if (res.success) {
        setMissions(prev => prev.filter(m => m.id !== id));
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-300 border border-slate-200 overflow-hidden flex flex-col h-full min-h-[600px]">
      {/* Header */}
      <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-main flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            Mon Vivier de Talents IA
          </h2>
          <p className="text-muted text-xs font-bold uppercase tracking-widest mt-1">Gérez vos candidats et vos offres capturées</p>
        </div>

        {/* Sub-tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-center">
          <button 
            onClick={() => setActiveSubTab('candidates')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-black transition-all ${activeSubTab === 'candidates' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-main'}`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            Candidats ({candidates.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('missions')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-black transition-all ${activeSubTab === 'missions' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-main'}`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Missions ({missions.length})
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-xs font-black text-muted uppercase tracking-widest">Synchronisation de vos données...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeSubTab === 'candidates' ? (
              candidates.length > 0 ? (
                candidates.map(candidate => (
                  <div key={candidate.id} onClick={() => handleCandidateClick(candidate)} className="cursor-pointer">
                    <VivierItem 
                      title={candidate.name}
                      date={candidate.createdAt}
                      onDelete={() => handleDeleteCandidate(candidate.id)}
                      isLoading={actionLoading === candidate.id}
                      icon={<UserIcon className="w-5 h-5" />}
                    />
                  </div>
                ))
              ) : (
                <EmptyState icon={<Users />} text="Aucun candidat dans votre vivier." />
              )
            ) : (
              missions.length > 0 ? (
                missions.map(mission => (
                  <VivierItem 
                    key={mission.id}
                    title={mission.title}
                    date={mission.createdAt}
                    onDelete={() => handleDeleteMission(mission.id)}
                    isLoading={actionLoading === mission.id}
                    icon={<Briefcase className="w-5 h-5" />}
                  />
                ))
              ) : (
                <EmptyState icon={<Briefcase />} text="Aucune mission enregistrée." />
              )
            )}
          </div>
        )}
      </div>

      {/* Popin de détails */}
      <CandidateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        candidate={selectedCandidate} 
        onUpdate={(updated) => {
          setCandidates(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated, name: `${updated.firstName || ''} ${updated.lastName || ''}`.trim() || c.name } : c));
          setSelectedCandidate(updated as any);
        }}
      />
    </div>
  );
}

function VivierItem({ 
  title, 
  date, 
  onDelete, 
  isLoading, 
  icon 
}: { 
  title: string, 
  date: string, 
  onDelete: () => void, 
  isLoading: boolean,
  icon: React.ReactNode 
}) {
  return (
    <div className="group bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between hover:border-primary hover:bg-white transition-all shadow-sm hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white rounded-xl text-primary border border-slate-200 shadow-sm group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-main group-hover:text-primary transition-colors">{title}</h4>
          <div className="flex items-center gap-2 text-[10px] text-muted font-bold uppercase tracking-wider mt-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(date), 'dd MMMM yyyy (HH:mm)', { locale: fr })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={isLoading}
          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
          title="Supprimer du vivier"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="p-6 bg-slate-100 rounded-full mb-4 text-slate-400">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-10 h-10' })}
      </div>
      <p className="text-sm font-bold text-main mb-1">{text}</p>
      <p className="text-[10px] text-muted uppercase font-black tracking-widest">Lancez une analyse pour commencer</p>
    </div>
  );
}
