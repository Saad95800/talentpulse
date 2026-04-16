"use client";

import React from 'react';
import { X, User, Briefcase, GraduationCap, Globe, Mail, Phone, Link } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'job' | 'candidate';
  data: any;
}

/**
 * Helper pour formater le texte brut en sections lisibles (listes, titres, paragraphes)
 */
function FormattedText({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (currentList.length > 0) {
      result.push(<ul key={`list-${key}`} className="space-y-2 mb-6 ml-6">{currentList}</ul>);
      currentList = [];
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList(`gap-${i}`);
      result.push(<div key={`gap-${i}`} className="h-4" />);
      return;
    }

    // Détection des listes à puces (- ou •)
    if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
      const content = trimmed.replace(/^[-•*]\s*/, '');
      currentList.push(
        <li key={`li-${i}`} className="flex gap-3 text-slate-700 text-base leading-relaxed">
          <span className="text-primary font-black mt-1.5">•</span>
          <span>{content}</span>
        </li>
      );
    } else {
      flushList(`text-${i}`);
      
      // Détection des titres (finit par : ou tout en MAJUSCULES)
      const isTitle = trimmed.endsWith(':') || (trimmed.length > 3 && trimmed === trimmed.toUpperCase() && !trimmed.includes('.'));
      
      if (isTitle) {
        result.push(
          <h4 key={`title-${i}`} className="font-black text-slate-900 mt-8 mb-4 uppercase tracking-widest text-xs border-l-4 border-primary pl-4">
            {trimmed}
          </h4>
        );
      } else {
        result.push(
          <p key={`p-${i}`} className="text-slate-700 text-base leading-relaxed font-medium mb-4">
            {trimmed}
          </p>
        );
      }
    }
  });

  flushList('final');
  return <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">{result}</div>;
}

export default function InfoModal({ isOpen, onClose, title, type, data }: InfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              {type === 'job' ? <Briefcase className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">
                Détails complets du {type === 'job' ? "poste" : "candidat"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-200 rounded-2xl text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {type === 'job' ? (
            <div className="max-w-none">
               <FormattedText text={typeof data === 'string' ? data : data.description || String(data)} />
            </div>
          ) : (
            <div className="space-y-10">
              {/* Candidate Info Header */}
              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                  <User className="w-32 h-32" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-2">Profil Complet</h3>
                    <h4 className="text-4xl font-black tracking-tight flex gap-3">
                      <span>{data.firstName || ''}</span>
                      <span className="text-primary">{data.lastName || ''}</span>
                    </h4>
                    {data.position && <p className="text-slate-400 font-bold mt-2">{data.position}</p>}
                  </div>
                  <div className="flex flex-wrap gap-3">
                     {data.email && (
                       <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 text-xs font-bold">
                         <Mail className="w-4 h-4 text-primary" /> {data.email}
                       </div>
                     )}
                     {data.phone && (
                       <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 text-xs font-bold">
                         <Phone className="w-4 h-4 text-primary" /> {data.phone}
                       </div>
                     )}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 px-2">
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Liens & Réseaux</h3>
                  <div className="space-y-4">
                    {data.linkedin && <a href={data.linkedin} target="_blank" className="flex items-center gap-3 text-primary hover:underline font-bold transition-all text-sm"><Link className="w-4 h-4" /> Profil LinkedIn</a>}
                    {data.website && <a href={data.website} target="_blank" className="flex items-center gap-3 text-primary hover:underline font-bold transition-all text-sm"><Globe className="w-4 h-4" /> Portfolio / Site</a>}
                    {data.address && <div className="text-sm text-slate-600 font-medium">📍 {data.address}</div>}
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Résumé du Profil</h3>
                  <div className="text-slate-700 italic">
                    <FormattedText text={data.summary || "Aucun résumé disponible."} />
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Compétences Clés</h3>
                <div className="flex flex-wrap gap-2">
                  {data.skills?.map((skill: string, i: number) => (
                    <span key={i} className="px-5 py-2.5 bg-white text-slate-700 rounded-xl text-xs font-black border border-slate-200 shadow-sm hover:border-primary transition-colors">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Experiences */}
              <div className="space-y-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Parcours Professionnel</h3>
                <div className="space-y-8">
                  {data.experiences?.map((exp: any, i: number) => (
                    <div key={i} className="relative pl-10 border-l-2 border-slate-100 ml-2">
                      <div className="absolute left-[-11px] top-0 w-5 h-5 rounded-full bg-white border-4 border-primary shadow-sm" />
                      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                          <h4 className="font-black text-slate-900 text-xl">{exp.position}</h4>
                          <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest w-fit">
                            {exp.period}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-primary font-bold text-sm mb-6">
                          <Briefcase className="w-4 h-4" />
                          <span>{exp.company}</span>
                        </div>
                        <div className="text-slate-600 text-sm">
                           <FormattedText text={exp.description} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Educations */}
              <div className="space-y-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Formation Académique</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  {data.educations?.map((edu: any, i: number) => (
                    <div key={i} className="flex gap-5 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] shadow-sm hover:bg-white transition-colors">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl h-fit">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-base leading-tight mb-1">{edu.degree}</h4>
                        <p className="text-xs text-slate-600 font-bold">{edu.school}</p>
                        <p className="text-[10px] text-muted font-black mt-3 uppercase tracking-widest pb-1 border-b border-slate-200 w-fit">{edu.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm hover:bg-slate-800 transition-all cursor-pointer shadow-xl shadow-slate-200 active:scale-95"
          >
            Fermer l'aperçu
          </button>
        </div>
      </div>
    </div>
  );
}
