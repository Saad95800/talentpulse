"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import { setUser } from '@/store/userSlice';
import { registerLead } from '@/actions/lead.action';
import { Mail, Phone, Loader2, ArrowRight, User } from 'lucide-react';

const leadSchema = z.object({
  name: z.string().min(2, { message: "Nom trop court" }),
  email: z.string().email({ message: "Email invalide" }),
  phone: z.string().min(10, { message: "Numéro de téléphone invalide (10 chiffres min)" }),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadCaptureFormProps {
  onSuccess?: () => void;
}

export default function LeadCaptureForm({ onSuccess }: LeadCaptureFormProps) {
  const dispatch = useDispatch();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
  });

  const onSubmit = async (data: LeadFormData) => {
    setIsLoading(true);
    setServerError(null);
    
    try {
      const result = await registerLead(data.name, data.email, data.phone);
      
      if (result.success && result.user) {
        dispatch(setUser({
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          credits: result.user.credits
        }));
        if (onSuccess) onSuccess();
      } else {
        setServerError(result.error || "Une erreur est survenue.");
      }
    } catch (error) {
      setServerError("Erreur de connexion au serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-300 border border-slate-200">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-main mb-2">Prêt à matcher ?</h3>
        <p className="text-muted text-sm">Entrez vos coordonnées pour obtenir vos 3 crédits gratuits.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-main mb-2 ml-1">Nom complet</label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-primary transition-colors" />
            <input
              {...register('name')}
              type="text"
              placeholder="ex: Jean Dupont"
              className={`w-full pl-12 pr-4 py-4 rounded-2xl border ${errors.name ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-slate-100/50'} focus:border-primary focus:bg-white outline-none transition-all font-medium text-main placeholder:text-slate-400`}
            />
          </div>
          {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-main mb-2 ml-1">Email Professionnel</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-primary transition-colors" />
            <input
              {...register('email')}
              type="email"
              placeholder="ex: jean.dupont@rh.com"
              className={`w-full pl-12 pr-4 py-4 rounded-2xl border ${errors.email ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-slate-100/50'} focus:border-primary focus:bg-white outline-none transition-all font-medium text-main placeholder:text-slate-400`}
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-main mb-2 ml-1">Téléphone</label>
          <div className="relative group">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-primary transition-colors" />
            <input
              {...register('phone')}
              type="tel"
              placeholder="06 12 34 56 78"
              className={`w-full pl-12 pr-4 py-4 rounded-2xl border ${errors.phone ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-slate-100/50'} focus:border-primary focus:bg-white outline-none transition-all font-medium text-main placeholder:text-slate-400`}
            />
          </div>
          {errors.phone && <p className="text-red-500 text-xs mt-1 ml-1">{errors.phone.message}</p>}
        </div>

        {serverError && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary-hover active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:pointer-events-none mt-4"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Commencer maintenant
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-[10px] text-muted text-center leading-relaxed">
        En continuant, vous acceptez nos CGU et notre politique de confidentialité. 
        Vos données sont utilisées strictement pour le fonctionnement du service.
      </p>
    </div>
  );
}
