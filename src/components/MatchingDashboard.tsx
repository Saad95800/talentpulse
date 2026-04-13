"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FileUp, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface FileDropZoneProps {
  label: string;
  file: File | null;
  onFileDrop: (file: File | null) => void;
  accept?: Record<string, string[]>;
  description: string;
}

function FileDropZone({ label, file, onFileDrop, description, accept = { 'application/pdf': ['.pdf'] } }: FileDropZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileDrop(acceptedFiles[0]);
    }
  }, [onFileDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false
  });

  if (file) {
    return (
      <div className="relative p-6 rounded-[2rem] border-2 border-emerald-500 bg-emerald-50/50 flex items-center gap-4 transition-all">
        <div className="p-3 bg-emerald-500 rounded-xl text-white">
          <FileText className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-emerald-900 truncate">{file.name}</p>
          <p className="text-xs text-emerald-600">{(file.size / 1024).toFixed(0)} KB • Prêt</p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onFileDrop(null); }}
          className="p-2 hover:bg-emerald-200/50 rounded-full text-emerald-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <CheckCircle2 className="absolute -top-3 -right-3 w-8 h-8 text-emerald-500 fill-white" />
      </div>
    );
  }

  return (
    <div 
      {...getRootProps()} 
      className={`
        relative p-8 rounded-[2rem] border-2 border-dashed cursor-pointer transition-all group
        ${isDragActive ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-primary/50'}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center text-center">
        <div className={`
          p-4 rounded-2xl mb-4 transition-all
          ${isDragActive ? 'bg-primary text-white scale-110' : 'bg-white text-primary shadow-sm group-hover:scale-110'}
        `}>
          <FileUp className="w-8 h-8" />
        </div>
        <h4 className="text-main font-bold mb-1">{label}</h4>
        <p className="text-muted text-xs px-4">{description}</p>
      </div>
      
      {isDragActive && (
        <div className="absolute inset-0 bg-primary/10 rounded-[2rem] flex items-center justify-center pointer-events-none">
          <p className="text-primary font-bold animate-pulse">Relâchez pour ajouter</p>
        </div>
      )}
    </div>
  );
}

export default function MatchingDashboard() {
  const [jobFile, setJobFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8 mb-10">
        <FileDropZone 
          label="Fiche de Poste"
          description="Glissez le PDF du descriptif de mission ici"
          file={jobFile}
          onFileDrop={setJobFile}
        />
        <FileDropZone 
          label="CV du Candidat"
          description="Glissez le CV au format PDF ici"
          file={cvFile}
          onFileDrop={setCvFile}
        />
      </div>

      {!jobFile || !cvFile ? (
        <div className="flex items-center justify-center gap-3 p-6 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">
            Veuillez ajouter les deux documents pour lancer l'analyse IA.
          </p>
        </div>
      ) : null}
    </div>
  );
}
