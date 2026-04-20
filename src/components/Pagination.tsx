"use client";

import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  loading = false 
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const showMax = 5;

    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis-start');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (currentPage < totalPages - 2) pages.push('ellipsis-end');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <nav className="flex items-center justify-center gap-2 mt-10">
      {/* Bouton Précédent */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || loading}
        className="p-2 rounded-xl border border-slate-200 hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-current transition-all bg-white shadow-sm"
        title="Page précédente"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Pages */}
      <div className="flex items-center gap-1.5">
        {getPageNumbers().map((page, index) => {
          if (typeof page === 'string') {
            return (
              <span key={`ellipsis-${index}`} className="w-10 h-10 flex items-center justify-center text-slate-400">
                <MoreHorizontal className="w-4 h-4" />
              </span>
            );
          }

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              disabled={loading}
              className={`
                w-10 h-10 rounded-xl text-sm font-black transition-all border
                ${currentPage === page 
                  ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-110' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary shadow-sm hover:shadow-md'
                }
              `}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Bouton Suivant */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || loading}
        className="p-2 rounded-xl border border-slate-200 hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-current transition-all bg-white shadow-sm"
        title="Page suivante"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </nav>
  );
}
