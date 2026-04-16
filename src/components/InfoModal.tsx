"use client";

import React from 'react';
import { X, FileText, User, Briefcase, GraduationCap, Globe, Mail, Phone, Linkedin } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'job' | 'candidate';
  data: any;
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
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {type === 'job' ? (
            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-medium text-lg">
                {data}
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Candidate Info Header */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Informations</h3>
                  <div className="space-y-3">
                    {data.email && <div className="flex items-center gap-3 text-slate-600"><Mail className="w-4 h-4" /> <span className="font-bold">{data.email}</span></div>}
                    {data.phone && <div className="flex items-center gap-3 text-slate-600"><Phone className="w-4 h-4" /> <span className="font-bold">{data.phone}</span></div>}
                    {data.linkedin && <a href={data.linkedin} target="_blank" className="flex items-center gap-3 text-primary hover:underline font-bold transition-all"><Linkedin className="w-4 h-4" /> Profil LinkedIn</a>}
                    {data.website && <a href={data.website} target="_blank" className="flex items-center gap-3 text-primary hover:underline font-bold transition-all"><Globe className="w-4 h-4" /> Portfolio / Site</a>}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Résumé</h3>
                  <p className="text-slate-700 font-medium leading-relaxed italic">
                    {data.summary || "Aucun résumé disponible."}
                  </p>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Compétences</h3>
                <div className="flex flex-wrap gap-2">
                  {data.skills?.map((skill: string, i: number) => (
                    <span key={i} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black border border-slate-200">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Experiences */}
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Expériences Professionnelles</h3>
                <div className="space-y-6">
                  {data.experiences?.map((exp: any, i: number) => (
                    <div key={i} className="relative pl-8 border-l-2 border-slate-100 ml-2">
                      <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-primary" />
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <h4 className="font-black text-slate-900 text-lg">{exp.position}</h4>
                        <div className="flex items-center gap-3 text-primary font-bold text-sm mb-2">
                          <span>{exp.company}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 font-medium">{exp.period}</span>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Educations */}
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Formation</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {data.educations?.map((edu: any, i: number) => (
                    <div key={i} className="flex gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg h-fit">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm leading-tight mb-1">{edu.degree}</h4>
                        <p className="text-xs text-slate-600 font-bold">{edu.school}</p>
                        <p className="text-[10px] text-muted font-black mt-2 uppercase">{edu.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-black text-sm hover:bg-slate-900 transition-all cursor-pointer shadow-lg shadow-slate-200"
          >
            Fermer l'aperçu
          </button>
        </div>
      </div>
    </div>
  );
}
