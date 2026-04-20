"use client";

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isLoading = false,
  type = 'danger'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const colorStyles = {
    danger: {
      bg: 'bg-red-500',
      text: 'text-red-500',
      border: 'border-red-200',
      hover: 'hover:bg-red-600',
      light: 'bg-red-50',
      icon: <AlertTriangle className="w-6 h-6 text-red-500" />
    },
    warning: {
      bg: 'bg-amber-500',
      text: 'text-amber-500',
      border: 'border-amber-200',
      hover: 'hover:bg-amber-600',
      light: 'bg-amber-50',
      icon: <AlertTriangle className="w-6 h-6 text-amber-500" />
    },
    info: {
      bg: 'bg-primary',
      text: 'text-primary',
      border: 'border-primary/20',
      hover: 'hover:bg-primary-hover',
      light: 'bg-primary/5',
      icon: <AlertTriangle className="w-6 h-6 text-primary" />
    }
  }[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onCancel}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-900/20 overflow-hidden animate-in zoom-in-95 duration-300">
        <button 
          onClick={onCancel}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-10">
          <div className={`w-14 h-14 ${colorStyles.light} rounded-2xl flex items-center justify-center mb-6`}>
            {colorStyles.icon}
          </div>
          
          <h3 className="text-2xl font-black text-main mb-3">{title}</h3>
          <p className="text-slate-500 font-medium leading-relaxed mb-10">
            {message}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`w-full py-4 ${colorStyles.bg} text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${colorStyles.hover} shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? 'Traitement...' : confirmLabel}
            </button>
            <button
              onClick={onCancel}
              className="w-full py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:bg-slate-50"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
