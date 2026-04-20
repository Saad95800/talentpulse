"use client";

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDispatch } from 'react-redux';
import { setError } from '@/store/matchingSlice';
import { 
  FileUp, 
  FileText, 
  X, 
  CheckCircle2, 
  Type 
} from 'lucide-react';
import { compressImage } from '@/lib/utils/image-utils';

interface DocumentInputProps {
  label: string;
  description: string;
  files: File[];
  setFiles: (files: File[]) => void;
  text: string;
  setText: (text: string) => void;
  inputType: 'file' | 'text';
  setInputType: (type: 'file' | 'text') => void;
  isMulti?: boolean;
  accept?: Record<string, string[]>;
  limit?: number;
}

/**
 * Standardized Input Component for Documents (CV/JD)
 * Supports Files (with Drag & Drop + Compression) or Manual Text Saisie.
 */
export const DocumentInput = React.memo(({ 
  label, description, files, setFiles, text, setText, inputType, setInputType, 
  isMulti = false,
  limit = 5,
  accept = { 
    'application/pdf': ['.pdf'], 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 
    'application/msword': ['.doc'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'text/plain': ['.txt'] 
  } 
}: DocumentInputProps) => {
  
  const dispatch = useDispatch();
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const newFiles = [...files];
      
      for (const file of acceptedFiles) {
        if (file.size > 10 * 1024 * 1024) {
          dispatch(setError(`Le fichier "${file.name}" est trop volumineux (max 10 Mo).`));
          continue;
        }

        if (newFiles.length >= limit) {
          dispatch(setError(`Limite de ${limit} CV maximum par demande atteinte.`));
          break;
        }

        let processedFile = file;
        if (file.type.startsWith('image/')) {
          try {
            processedFile = await compressImage(file);
          } catch (e) {
            console.error("Erreur compression image:", e);
          }
        }

        if (isMulti) {
          newFiles.push(processedFile);
        } else {
          setFiles([processedFile]);
          dispatch(setError(""));
          return;
        }
      }
      
      setFiles(newFiles);
      dispatch(setError(""));
    }
  }, [files, setFiles, dispatch, isMulti, limit]);

  const removeFile = (index: number) => {
    const next = [...files];
    next.splice(index, 1);
    setFiles(next);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: isMulti
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-2">
        <h4 className="text-main font-black text-sm uppercase tracking-wider">{label}</h4>
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button 
            onClick={() => setInputType('file')}
            className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${inputType === 'file' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Fichier
          </button>
          <button 
            onClick={() => setInputType('text')}
            className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${inputType === 'text' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Saisie Manuelle
          </button>
        </div>
      </div>

      {inputType === 'file' ? (
        <div className="space-y-3">
          {files.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className="relative p-7 rounded-[2rem] border-2 border-emerald-500 bg-emerald-50/30 flex items-center gap-4 transition-all animate-in fade-in zoom-in duration-300">
              <div className="p-3.5 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                <FileText className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-emerald-950 truncate">{file.name}</p>
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                  {(file.size / 1024).toFixed(0)} KB • Prêt
                </p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                className="p-2.5 hover:bg-emerald-200/50 rounded-full text-emerald-600 transition-colors"
                title="Supprimer ce fichier"
              >
                <X className="w-5 h-5" />
              </button>
              <CheckCircle2 className="absolute -top-3 -right-3 w-8 h-8 text-emerald-500 fill-white" />
            </div>
          ))}

          {(!isMulti && files.length === 0) || (isMulti && files.length < limit) ? (
            <div 
              {...getRootProps()} 
              className={`
                relative p-8 rounded-[2rem] border-2 border-dashed cursor-pointer transition-all group overflow-hidden h-[200px] flex flex-col justify-center items-center
                ${isDragActive ? 'border-primary bg-primary/10 scale-[0.98]' : 'border-slate-300 bg-slate-100 hover:bg-white hover:border-primary hover:shadow-xl hover:shadow-slate-200'}
              `}
            >
              <input {...getInputProps()} />
              <div className={`p-4 rounded-xl mb-4 transition-all ${isDragActive ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-white text-primary shadow-sm group-hover:scale-110'}`}>
                <FileUp className="w-7 h-7" />
              </div>
              <p className="text-slate-500 font-medium text-xs px-4 text-center leading-relaxed">
                {description} <br/> <span className="font-bold text-slate-400 mt-2 block">(PDF, DOCX, JPG, PNG • Max 10 Mo)</span>
              </p>
              
              {isDragActive && (
                <div className="absolute inset-0 bg-primary/10 rounded-[2rem] flex items-center justify-center pointer-events-none">
                  <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
                    <p className="text-primary font-bold animate-pulse">Relâchez ici</p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="relative group h-[200px]">
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Copiez-collez le contenu ici (ex: expérience, compétences, responsabilités...)"
            className="w-full h-full p-5 rounded-[2rem] border-2 border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none outline-none transition-all text-sm text-slate-700 font-medium leading-relaxed custom-scrollbar shadow-inner"
          />
          <div className="absolute top-4 right-4 p-2 bg-slate-200 text-slate-400 rounded-lg group-focus-within:bg-primary/10 group-focus-within:text-primary transition-colors pointer-events-none">
            <Type className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
});

DocumentInput.displayName = 'DocumentInput';
