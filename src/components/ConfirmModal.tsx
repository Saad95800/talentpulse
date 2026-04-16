"use client";

import React from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  isLoading = false,
  variant = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const colors = {
    danger: {
      bg: 'bg-red-50',
      icon: 'text-red-500',
      button: 'bg-red-500 hover:bg-red-600 shadow-red-200',
      border: 'border-red-100'
    },
    warning: {
      bg: 'bg-amber-50',
      icon: 'text-amber-500',
      button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
      border: 'border-amber-100'
    },
    info: {
      bg: 'bg-blue-50',
      icon: 'text-blue-500',
      button: 'bg-blue-500 hover:bg-blue-600 shadow-blue-200',
      border: 'border-blue-100'
    }
  }[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay avec flou progressif */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={isLoading ? undefined : onClose} 
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header/Banner décorative */}
        <div className={`h-2 w-full ${colors.button}`} />
        
        <div className="p-8">
          <div className="flex items-start gap-5">
            <div className={`p-4 rounded-2xl ${colors.bg} ${colors.icon} shrink-0`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-black text-main mb-2 leading-tight">
                {title}
              </h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                {message}
              </p>
            </div>

            <button 
              onClick={onClose}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 mt-10">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-main hover:bg-slate-100 rounded-xl transition-all"
            >
              {cancelText}
            </button>
            
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`
                px-8 py-3 rounded-xl text-sm font-black text-white transition-all shadow-lg flex items-center gap-3
                ${colors.button} ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
              `}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
