"use client";

import React from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Link,
  Globe, 
  Briefcase, 
  GraduationCap, 
  Globe2, 
  Award,
  Calendar,
  User as UserIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

interface Candidate {
  id: string;
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

interface CandidateModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CandidateModal({ candidate, isOpen, onClose }: CandidateModalProps) {
  if (!isOpen || !candidate) return null;

  const experiences = (candidate.experiences || []) as Experience[];
  const educations = (candidate.educations || []) as Education[];
  const skills = (candidate.skills || []) as string[];
  const languages = (candidate.languages || []) as string[];

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
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-white/80 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
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
                  <h2 className="text-2xl font-black text-main leading-tight">
                    {candidate.firstName} <br />
                    <span className="text-primary">{candidate.lastName}</span>
                  </h2>
                </div>

                <div className="space-y-3">
                  {candidate.email && (
                    <a href={`mailto:${candidate.email}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary group transition-all">
                      <Mail className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-slate-600 truncate">{candidate.email}</span>
                    </a>
                  )}
                  {candidate.phone && (
                    <a href={`tel:${candidate.phone}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary group transition-all">
                      <Phone className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-slate-600">{candidate.phone}</span>
                    </a>
                  )}
                  {candidate.address && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600">{candidate.address}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    {candidate.linkedin && (
                      <a href={candidate.linkedin} target="_blank" rel="noopener noreferrer" className="flex-1 bg-indigo-50 text-indigo-600 p-3 rounded-xl border border-indigo-100 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
                        <Link className="w-5 h-5" />
                      </a>
                    )}
                    {candidate.website && (
                      <a href={candidate.website} target="_blank" rel="noopener noreferrer" className="flex-1 bg-slate-100 text-slate-600 p-3 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-main hover:text-white transition-all">
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
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
              {candidate.summary && (
                <section>
                  <h4 className="text-xs font-black text-main uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">
                    Résumé Professionnel
                  </h4>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                    &quot;{candidate.summary}&quot;
                  </p>
                </section>
              )}

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
                  )) : <p className="text-xs text-muted italic">Aucune expérience répertoriée.</p>}
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
                  Importé le {format(new Date(candidate.createdAt), 'dd MMMM yyyy', { locale: fr })}
                </div>
                <div>ID: {candidate.id.split('-')[0]}...</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
