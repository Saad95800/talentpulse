"use client";

import React from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Link,
  Briefcase, 
  GraduationCap, 
  Globe2, 
  Award,
  Calendar,
  User as UserIcon,
  Edit2,
  Save,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { updateCandidateAction } from '@/actions/candidate.action';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { toast } from 'react-hot-toast';

interface Experience {
  company: string;
  position: string;
  period: string;
  description: string;
}

interface Education {
  school: string;
  degree: string;
  year: string;
}

import { Candidate } from '@/types/candidate';

interface CandidateModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updated: Candidate) => void;
}

export default function CandidateModal({ candidate: initialCandidate, isOpen, onClose, onUpdate }: CandidateModalProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<Candidate>>({});
  const userId = useSelector((state: RootState) => state.user.user?.id);

  React.useEffect(() => {
    if (initialCandidate) {
      setFormData(initialCandidate);
      setIsEditing(false);
    }
  }, [initialCandidate, isOpen]);

  if (!isOpen || !initialCandidate) return null;

  const currentCandidate = isEditing ? formData : (initialCandidate || {});
  const experiences = (currentCandidate.experiences || []) as unknown as Experience[];
  const educations = (currentCandidate.educations || []) as unknown as Education[];
  const skills = (currentCandidate.skills || []) as string[];
  const languages = (currentCandidate.languages || []) as string[];

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const result = await updateCandidateAction(initialCandidate.id, userId, formData);
      if (result.success && result.candidate) {
        toast.success("Profil mis à jour !");
        setIsEditing(false);
        if (onUpdate) onUpdate(result.candidate as Candidate);
      } else {
        toast.error(result.error || "Erreur lors de la sauvegarde.");
      }
    } catch {
      toast.error("Erreur de connexion au serveur.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-main/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-50 rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        
        {/* Header / Brand Bar */}
        <div className="bg-main p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
              <UserIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-black uppercase tracking-widest text-sm">Profil Candidat</h3>
              <p className="text-indigo-300 transform -skew-x-12 text-[10px] font-bold">TALENTMATCHER INTELLIGENCE</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-xs font-black uppercase transition-all"
              >
                <Edit2 className="w-4 h-4" />
                Modifier
              </button>
            ) : (
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 rounded-full text-white text-xs font-black uppercase transition-all shadow-lg shadow-primary/20"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Sauvegarder
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full text-white/80 transition-colors ml-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left Sidebar: ID & Contact */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <div className="text-center mb-6">
                  <div className="w-24 h-24 bg-slate-100 rounded-3xl mx-auto mb-4 flex items-center justify-center border-2 border-slate-200 shadow-inner">
                    <UserIcon className="w-12 h-12 text-slate-300" />
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input 
                        name="firstName"
                        value={formData.firstName || ''} 
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-sm focus:border-primary outline-none"
                        placeholder="Prénom"
                      />
                      <input 
                        name="lastName"
                        value={formData.lastName || ''} 
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-sm text-primary focus:border-primary outline-none"
                        placeholder="Nom"
                      />
                    </div>
                  ) : (
                    <h2 className="text-2xl font-black text-main leading-tight">
                      {currentCandidate.firstName} <br />
                      <span className="text-primary">{currentCandidate.lastName}</span>
                    </h2>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group transition-all">
                      <Mail className="w-4 h-4 text-primary" />
                      {isEditing ? (
                        <input 
                          name="email"
                          value={formData.email || ''} 
                          onChange={handleChange}
                          className="flex-1 bg-transparent text-xs font-bold text-slate-600 outline-none"
                        />
                      ) : (
                        <span className="text-xs font-bold text-slate-600 truncate">{currentCandidate.email || 'Non renseigné'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group transition-all">
                      <Phone className="w-4 h-4 text-primary" />
                      {isEditing ? (
                        <input 
                          name="phone"
                          value={formData.phone || ''} 
                          onChange={handleChange}
                          className="flex-1 bg-transparent text-xs font-bold text-slate-600 outline-none"
                        />
                      ) : (
                        <span className="text-xs font-bold text-slate-600">{currentCandidate.phone || 'Non renseigné'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {isEditing ? (
                        <input 
                          name="address"
                          value={formData.address || ''} 
                          onChange={handleChange}
                          className="flex-1 bg-transparent text-xs font-bold text-slate-600 outline-none"
                        />
                      ) : (
                        <span className="text-xs font-bold text-slate-600">{currentCandidate.address || 'Non renseigné'}</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 p-2 bg-indigo-50/50 rounded-xl border border-indigo-100">
                      <Link className="w-4 h-4 text-indigo-500 shrink-0" />
                      {isEditing ? (
                        <input 
                          name="linkedin"
                          value={formData.linkedin || ''} 
                          onChange={handleChange}
                          placeholder="URL Linkedin"
                          className="flex-1 bg-transparent text-[10px] font-bold text-slate-600 outline-none"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600 truncate">{currentCandidate.linkedin || 'Linkedin non lié'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills Badge Cloud */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <h4 className="text-xs font-black text-main uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  Expertises Clés
                </h4>
                <div className="flex flex-wrap gap-2">
                  {skills.length > 0 ? skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-primary/5 text-primary border border-primary/10 rounded-lg text-[10px] font-black uppercase">
                      {skill}
                    </span>
                  )) : <p className="text-[10px] text-muted italic">Non spécifiées</p>}
                </div>
              </div>

              {/* Languages */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <h4 className="text-xs font-black text-main uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-primary" />
                  Langues
                </h4>
                <div className="space-y-2">
                  {languages.length > 0 ? languages.map((lang, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {lang}
                    </div>
                  )) : <p className="text-[10px] text-muted italic">Non spécifiées</p>}
                </div>
              </div>
            </div>

            {/* Right Column: Career & Summary */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Summary */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-black text-main uppercase tracking-widest border-b border-slate-200 pb-2 flex-1 mr-4">
                    Résumé Professionnel
                  </h4>
                </div>
                {isEditing ? (
                  <textarea 
                    name="summary"
                    value={formData.summary || ''} 
                    onChange={handleChange}
                    rows={4}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm text-slate-600 font-medium outline-none focus:border-primary transition-all shadow-inner"
                  />
                ) : (
                  <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                    {currentCandidate.summary ? `"${currentCandidate.summary}"` : "Aucun résumé renseigné."}
                  </p>
                )}
              </section>

              {/* Experience Timeline */}
              <section>
                <h4 className="text-xs font-black text-main uppercase tracking-widest mb-6 border-b border-slate-200 pb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  Parcours Professionnel
                </h4>
                <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {experiences.length > 0 ? experiences.map((exp, i) => (
                    <div key={i} className="relative pl-8">
                      <div className="absolute left-0 top-1.5 w-6 h-6 bg-white rounded-full border-2 border-primary shadow-sm flex items-center justify-center z-10">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-primary/30 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-black text-main text-sm">{exp.position}</h5>
                            <p className="text-primary font-bold text-xs">{exp.company}</p>
                          </div>
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-tighter">
                            {exp.period}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium line-clamp-3 hover:line-clamp-none transition-all">
                          {exp.description}
                        </p>
                      </div>
                    </div>
                  )) : <p className="text-xs text-muted italic pl-8">Aucune expérience répertoriée.</p>}
                </div>
              </section>

              {/* Education */}
              <section>
                <h4 className="text-xs font-black text-main uppercase tracking-widest mb-6 border-b border-slate-200 pb-2 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  Formation & Diplômes
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  {educations.length > 0 ? educations.map((edu, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4 hover:border-indigo-200 transition-all">
                      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-black text-main text-xs">{edu.degree}</h5>
                        <p className="text-slate-500 font-bold text-[10px] mt-1">{edu.school}</p>
                        <p className="text-primary font-black text-[9px] mt-1">{edu.year}</p>
                      </div>
                    </div>
                  )) : <p className="text-xs text-muted italic">Aucun diplôme répertorié.</p>}
                </div>
              </section>

              {/* System Metadata */}
              <div className="pt-8 border-t border-slate-200 flex items-center justify-between text-[10px] text-muted font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  Importé le {format(new Date(initialCandidate.createdAt), 'dd MMMM yyyy', { locale: fr })}
                </div>
                <div>ID: {initialCandidate.id.split('-')[0]}...</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
