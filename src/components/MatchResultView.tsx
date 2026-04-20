"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { MatchResult } from '@/lib/ai';
import { 
  CheckCircle2, 
  XCircle, 
  MessageSquareQuote,
  TrendingUp,
  Award,
  AlertTriangle,
  FileText,
  UserSearch,
  HelpCircle,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  CheckCircle
} from 'lucide-react';
import InfoModal from './InfoModal';
import CandidateModal from './CandidateModal';
import { useAuth } from '@/hooks/useAuth';
import { submitMatchFeedbackAction } from '@/actions/feedback.action';

// Import dynamique du bouton d'export PDF avec SSR désactivé
// Cela isole totalement @react-pdf/renderer et évite les erreurs de hooks/contexte
const ExportPDFButton = dynamic(
  () => import('./pdf/ExportPDFButton'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-3 bg-slate-100 text-slate-400 px-10 py-5 rounded-2xl font-black text-lg border border-slate-200 animate-pulse cursor-wait">
        {"Initialisation de l'export..."}
      </div>
    )
  }
);

interface MatchResultViewProps {
  result: MatchResult;
  candidateName: string;
  recordId?: string; // Ajout du recordId
}

export default function MatchResultView({ result, candidateName, recordId }: MatchResultViewProps) {
  const { token } = useAuth();
  const [isClient, setIsClient] = React.useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = React.useState(false);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = React.useState(false);
  
  // Feedback States
  const [feedback, setFeedback] = React.useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = React.useState("");
  const [submittingFeedback, setSubmittingFeedback] = React.useState(false);
  const [feedbackSent, setFeedbackSent] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFeedback = (val: number) => {
     setFeedback(val);
  };

  const submitFeedback = async () => {
    if (!recordId || !token) return;
    setSubmittingFeedback(true);
    const res = await submitMatchFeedbackAction(token, recordId, feedback!, feedbackComment);
    if (res.success) {
      setFeedbackSent(true);
    }
    setSubmittingFeedback(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 stroke-emerald-600';
    if (score >= 50) return 'text-amber-600 stroke-amber-600';
    return 'text-red-600 stroke-red-600';
  };

  const scoreColor = getScoreColor(result.score);
  const strokeDasharray = `${result.score}, 100`;

  // Construction du nom complet à partir des infos de l'IA
  const displayCandidateName = result.candidateInfo 
    ? `${result.candidateInfo.firstName || ''} ${result.candidateInfo.lastName || ''}`.trim() || candidateName
    : candidateName;

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Header Result */}
      <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-300 border border-slate-200 mb-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Award className="w-48 h-48 rotate-12" />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
          {/* Circular Score */}
          <div className="relative w-48 h-48 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <path
                className="stroke-slate-100"
                strokeWidth="3.5"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${scoreColor} transition-all duration-1000 ease-out`}
                strokeWidth="3"
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-main leading-none">{result.score}</span>
              <span className="text-xs font-bold text-muted uppercase tracking-tighter">% Match</span>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black mb-4 border border-slate-200 uppercase tracking-widest">
              <TrendingUp className="w-3 h-3" />
              Analyse prédictive IA
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-main mb-4 tracking-tighter leading-none">
              <span className="text-primary block mb-2 text-sm uppercase tracking-[0.3em] opacity-70">Rapport de Matching</span>
              {displayCandidateName}
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-8">
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 px-5 py-2.5 rounded-xl text-sm font-black">
                <CheckCircle2 className="w-4 h-4" />
                {result.competences_validees.length} Points forts
              </div>
              <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-100 px-5 py-2.5 rounded-xl text-sm font-black">
                <AlertTriangle className="w-4 h-4" />
                {result.competences_manquantes.length} Écarts
              </div>
            </div>
            
            {/* Nouvelles actions de consultation */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-8 pt-6 border-t border-slate-100">
                <button 
                  onClick={() => setIsJobModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all border border-slate-200 cursor-pointer group"
                >
                  <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  {"Voir l'offre"}
                </button>
               <button 
                 onClick={() => setIsCandidateModalOpen(true)}
                 className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all border border-slate-200 cursor-pointer group"
               >
                 <UserSearch className="w-4 h-4 group-hover:scale-110 transition-transform" />
                 Voir candidat
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        <section className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 border border-slate-200">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-main text-xl">Compétences Validées</h3>
          </div>
          <ul className="space-y-3">
            {result.competences_validees.map((skill, index) => (
              <li key={index} className="flex items-start gap-3 p-4 bg-emerald-50/50 rounded-xl group hover:bg-emerald-100/60 border border-emerald-100 transition-all">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-sm font-bold text-emerald-950 leading-tight">{skill}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 border border-slate-200">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <XCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-main text-xl">Points de Vigilance</h3>
          </div>
          <ul className="space-y-3">
            {result.competences_manquantes.map((skill, index) => (
              <li key={index} className="flex items-start gap-3 p-4 bg-red-50/50 rounded-xl group hover:bg-red-100/60 border border-red-100 transition-all">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span className="text-sm font-bold text-red-950 leading-tight">{skill}</span>
              </li>
            ))}
            {result.competences_manquantes.length === 0 && (
              <p className="text-slate-400 text-sm italic font-medium">Aucune lacune majeure détectée.</p>
            )}
          </ul>
        </section>
      </div>

      {/* Argumentaire Client */}
      <section className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-500 text-primary">
          <MessageSquareQuote className="w-32 h-32" />
        </div>
        
        <div className="relative z-10">
          <h3 className="text-2xl font-black mb-6 flex items-center gap-4 uppercase tracking-wider text-primary">
            Verdict du Chasseur de Têtes
          </h3>
          <div className="text-lg md:text-xl font-medium leading-relaxed text-slate-300 whitespace-pre-line">
            {result.argumentaire_client}
          </div>
        </div>
      </section>

      {/* Questions à poser au candidat */}
      {result.questions_candidat && result.questions_candidat.length > 0 && (
        <section className="mt-8 bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200 border border-slate-200">
          <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <HelpCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-main leading-tight">Questions d&apos;Entretien</h3>
              <p className="text-sm font-bold text-muted uppercase tracking-wider">Vérification des qualifications critiques</p>
            </div>
          </div>
          <div className="grid gap-4">
            {result.questions_candidat.map((question, index) => (
              <div key={index} className="flex gap-5 p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/30 transition-all">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-black shrink-0">
                  {index + 1}
                </span>
                <p className="text-lg font-bold text-main leading-snug pt-0.5">
                  {question}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="mt-12 flex flex-col items-center gap-8">
        <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2.5rem] w-full max-w-2xl text-center">
           <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Ce matching vous a-t-il été utile ?</h4>
           
           {feedbackSent ? (
              <div className="flex flex-col items-center gap-3 py-4 animate-in zoom-in duration-500">
                 <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                 </div>
                 <p className="text-emerald-800 font-bold">Merci pour votre retour !</p>
                 <p className="text-slate-500 text-xs">Vos feedbacks nous aident à améliorer l&apos;algorithme.</p>
              </div>
           ) : (
             <>
              <div className="flex justify-center gap-6 mb-6">
                  <button 
                    onClick={() => handleFeedback(1)}
                    className={`p-4 rounded-2xl transition-all flex flex-col items-center gap-2 group ${feedback === 1 ? 'bg-emerald-600 text-white shadow-xl scale-110' : 'bg-white text-slate-400 hover:text-emerald-600 border border-slate-100 shadow-sm'}`}
                  >
                    <div className={`p-2 rounded-lg ${feedback === 1 ? 'bg-emerald-500' : 'bg-emerald-50'} group-hover:bg-emerald-100 text-emerald-600`}>
                      <ThumbsUp className={`w-8 h-8 ${feedback === 1 ? 'text-white' : ''}`} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tighter">Excellent</span>
                  </button>

                  <button 
                    onClick={() => handleFeedback(-1)}
                    className={`p-4 rounded-2xl transition-all flex flex-col items-center gap-2 group ${feedback === -1 ? 'bg-red-600 text-white shadow-xl scale-110' : 'bg-white text-slate-400 hover:text-red-600 border border-slate-100 shadow-sm'}`}
                  >
                    <div className={`p-2 rounded-lg ${feedback === -1 ? 'bg-red-500' : 'bg-red-50'} group-hover:bg-red-100 text-red-600`}>
                       <ThumbsDown className={`w-8 h-8 ${feedback === -1 ? 'text-white' : ''}`} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tighter">Peu pertinent</span>
                  </button>
              </div>

              {feedback !== null && (
                <div className="animate-in slide-in-from-top-4 duration-500">
                    <textarea 
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder={feedback === 1 ? "Qu'est-ce qui vous a le plus aidé ? (Optionnel)" : "Pourriez-vous nous tell ce qui manque ou ce qui est incorrect ?"}
                      className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none mb-4"
                      rows={3}
                    />
                    <button 
                      onClick={submitFeedback}
                      disabled={submittingFeedback}
                      className="bg-slate-900 text-white px-8 py-3 rounded-full text-xs font-black hover:bg-black transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
                    >
                      {submittingFeedback ? "Envoi..." : "Envoyer mon avis"} <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
             </>
           )}
        </div>
        </div>

        {isClient && (
          <ExportPDFButton 
            result={result} 
            candidateName={displayCandidateName} 
          />
        )}

      {/* Modals de consultation détaillée */}
      <InfoModal 
        isOpen={isJobModalOpen} 
        onClose={() => setIsJobModalOpen(false)} 
        title={`Offre : ${result.jobTitle || 'Détails'}`}
        type="job"
        data={result.jobDescription || "Contenu de l&apos;offre non disponible pour cette analyse."}
      />

      <CandidateModal 
        isOpen={isCandidateModalOpen} 
        onClose={() => setIsCandidateModalOpen(false)} 
        candidate={(result.fullCandidate || result.candidateInfo || {}) as any}
      />
    </div>
  );
}
