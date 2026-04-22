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

import Pagination from './Pagination';
import CandidateModal from './CandidateModal';
import InfoModal from './InfoModal';
import ConfirmModal from './ConfirmModal';

import { Candidate, Mission } from '@/types/candidate';

export default function VivierManager() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'candidates' | 'missions'>('candidates');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Pagination State - Candidates
  const [candPage, setCandPage] = useState(1);
  const [candTotalPages, setCandTotalPages] = useState(1);
  const [candCount, setCandCount] = useState(0);

  // Pagination State - Missions
  const [missPage, setMissPage] = useState(1);
  const [missTotalPages, setMissTotalPages] = useState(1);
  const [missCount, setMissCount] = useState(0);

  const [isChangingPage, setIsChangingPage] = useState(false);

  // Chargement des Candidats
  const loadCandidates = React.useCallback(async (page: number) => {
    if (!user?.id) return;
    setIsChangingPage(true);
    try {
      const res = await getCandidatesAction(user.id, page, 20);
      if (res.success && res.candidates) {
        setCandidates(res.candidates as Candidate[]);
        setCandTotalPages(res.totalPages || 1);
        setCandCount(res.totalCount || 0);
        setCandPage(page);
      }
    } catch (err) {
      console.error("Erreur chargement candidats:", err);
    } finally {
      setIsChangingPage(false);
      setLoading(false);
    }
  }, [user?.id]);

  // Chargement des Missions
  const loadMissions = React.useCallback(async (page: number) => {
    if (!user?.id) return;
    setIsChangingPage(true);
    try {
      const res = await getMissionsAction(user.id, page, 20);
      if (res.success && res.missions) {
        setMissions(res.missions as unknown as Mission[]);
        setMissTotalPages(res.totalPages || 1);
        setMissCount(res.totalCount || 0);
        setMissPage(page);
      }
    } catch (err) {
      console.error("Erreur chargement missions:", err);
    } finally {
      setIsChangingPage(false);
      setLoading(false);
    }
  }, [user?.id]);

  // Initialisation : Charger les deux premières pages
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        loadCandidates(1),
        loadMissions(1)
      ]);
      setLoading(false);
    };
    init();
  }, [loadCandidates, loadMissions]);

  // États pour les Modals
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);

  // État pour la confirmation de suppression
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    id: string;
    type: 'candidate' | 'mission';
    title: string;
  }>({
    isOpen: false,
    id: '',
    type: 'candidate',
    title: ''
  });

  const handleCandidateClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsCandidateModalOpen(true);
  };

  const handleMissionClick = (mission: Mission) => {
    setSelectedMission(mission);
    setIsMissionModalOpen(true);
  };

  /**
   * Initialise la procédure de suppression avec modal de confirmation
   */
  const requestDelete = (id: string, type: 'candidate' | 'mission', title: string) => {
    setConfirmDelete({
      isOpen: true,
      id,
      type,
      title
    });
  };

  /**
   * Exécute la suppression après confirmation
   */
  const executeDelete = async () => {
    if (!user?.id || !confirmDelete.id) return;
    
    const { id, type } = confirmDelete;
    setActionLoading(id);
    setConfirmDelete(prev => ({ ...prev, isOpen: false }));
    
    try {
      if (type === 'candidate') {
        const res = await deleteCandidateAction(id, user.id);
        if (res.success) {
          await loadCandidates(candPage);
        }
      } else {
        const res = await deleteMissionAction(id, user.id);
        if (res.success) {
          await loadMissions(missPage);
        }
      }
    } catch (err) {
      console.error("Erreur suppression:", err);
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Action de suppression directe (alternative sans ConfirmModal quand déjà confirmé par confirm())
   */
  const executeDirectDelete = async (id: string, type: 'candidate' | 'mission') => {
    if (!user?.id) return;
    setActionLoading(id);
    try {
      if (type === 'candidate') {
        const res = await deleteCandidateAction(id, user.id);
        if (res.success) {
          await loadCandidates(candPage);
        }
      } else {
        const res = await deleteMissionAction(id, user.id);
        if (res.success) {
          await loadMissions(missPage);
        }
      }
    } catch (err) {
      console.error("Erreur suppression directe:", err);
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
            Candidats ({candCount})
          </button>
          <button 
            onClick={() => setActiveSubTab('missions')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-black transition-all ${activeSubTab === 'missions' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-main'}`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Missions ({missCount})
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className={`flex-1 overflow-y-auto p-8 custom-scrollbar transition-opacity duration-300 ${isChangingPage ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-xs font-black text-muted uppercase tracking-widest">Synchronisation de vos données...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeSubTab === 'candidates' ? (
              <>
                {candidates.length > 0 ? (
                  candidates.map(candidate => (
                    <div key={candidate.id} onClick={() => handleCandidateClick(candidate)} className="cursor-pointer">
                      <VivierItem 
                        title={candidate.name}
                        date={candidate.createdAt}
                        onDelete={() => requestDelete(candidate.id, 'candidate', candidate.name)}
                        isLoading={actionLoading === candidate.id}
                        icon={<UserIcon className="w-5 h-5" />}
                      />
                    </div>
                  ))
                ) : (
                  <EmptyState icon={<Users />} text="Aucun candidat dans votre vivier." />
                )}
                <Pagination 
                  currentPage={candPage}
                  totalPages={candTotalPages}
                  onPageChange={loadCandidates}
                  loading={isChangingPage}
                />
              </>
            ) : (
              <>
                {missions.length > 0 ? (
                  missions.map(mission => (
                    <div key={mission.id} onClick={() => handleMissionClick(mission)} className="cursor-pointer">
                      <VivierItem 
                        title={mission.title}
                        date={mission.createdAt}
                        onDelete={() => requestDelete(mission.id, 'mission', mission.title)}
                        isLoading={actionLoading === mission.id}
                        icon={<Briefcase className="w-5 h-5" />}
                      />
                    </div>
                  ))
                ) : (
                  <EmptyState icon={<Briefcase />} text="Aucune mission enregistrée." />
                )}
                <Pagination 
                  currentPage={missPage}
                  totalPages={missTotalPages}
                  onPageChange={loadMissions}
                  loading={isChangingPage}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal Candidat */}
      <CandidateModal 
        isOpen={isCandidateModalOpen} 
        onClose={() => setIsCandidateModalOpen(false)} 
        candidate={selectedCandidate} 
        onUpdate={(updated) => {
          setCandidates(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated, name: `${updated.firstName || ''} ${updated.lastName || ''}`.trim() || c.name } : c));
          setSelectedCandidate(updated as Candidate);
        }}
        onDelete={(id) => executeDirectDelete(id, 'candidate')}
      />

      {/* Modal Mission (Utilisation de InfoModal pour le formattage riche) */}
      <InfoModal 
        isOpen={isMissionModalOpen}
        onClose={() => setIsMissionModalOpen(false)}
        title={selectedMission?.title || "Détails de l'offre"}
        type="job"
        data={selectedMission?.description || ""}
        onDelete={(id) => executeDirectDelete(id, 'mission')}
        id={selectedMission?.id}
      />

      {/* Modal de Confirmation Premium */}
      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeDelete}
        title={`Supprimer ${confirmDelete.type === 'candidate' ? 'le candidat' : 'la mission'}`}
        message={`Êtes-vous sûr de vouloir supprimer "${confirmDelete.title}" ? Cette action supprimera également toutes les analyses associées et est irréversible.`}
        confirmText="Supprimer définitivement"
        variant="danger"
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
  date: Date | string, 
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
          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
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
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-10 h-10' })}
      </div>
      <p className="text-sm font-bold text-main mb-1">{text}</p>
      <p className="text-[10px] text-muted uppercase font-black tracking-widest">Lancez une analyse pour commencer</p>
    </div>
  );
}

