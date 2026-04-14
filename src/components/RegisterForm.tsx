"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { registerAction } from '@/actions/auth.action';
import { Mail, Phone, Loader2, ArrowRight, User, Lock, CheckCircle2 } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, { message: "Nom trop court" }),
  email: z.string().email({ message: "Email invalide" }),
  phone: z.string().min(10, { message: "Numéro de téléphone invalide (10 chiffres min)" }),
  password: z.string().min(8, { message: "Le mot de passe doit faire au moins 8 caractères" }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setServerError(null);
    
    try {
      const result = await registerAction({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password
      });
      
      if (result.success) {
        setIsSuccess(true);
      } else {
        setServerError(result.error || "Une erreur est survenue.");
      }
    } catch {
      setServerError("Erreur de connexion au serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto p-10 bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="text-2xl font-bold text-main mb-4">Inscription réussie !</h3>
        <p className="text-muted mb-8 leading-relaxed">
          Un email de confirmation vous a été envoyé. 
          Merci de cliquer sur le lien interne pour activer votre compte avant de vous connecter.
        </p>
        <button
          onClick={onSwitchToLogin}
          className="w-full bg-main text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all"
        >
          Retour à la connexion
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-300 border border-slate-200">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-main mb-2">Créer un compte</h3>
        <p className="text-muted text-sm">Inscrivez-vous pour obtenir vos 3 crédits offerts.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-main mb-1.5 ml-1 uppercase tracking-wider">Nom complet</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
              <input
                {...register('name')}
                type="text"
                placeholder="Jean D."
                className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.name ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'} focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium`}
              />
            </div>
            {errors.name && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-main mb-1.5 ml-1 uppercase tracking-wider">Téléphone</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
              <input
                {...register('phone')}
                type="tel"
                placeholder="0612..."
                className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.phone ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'} focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium`}
              />
            </div>
            {errors.phone && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.phone.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-main mb-1.5 ml-1 uppercase tracking-wider">Email Professionnel</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
            <input
              {...register('email')}
              type="email"
              placeholder="jean@entreprise.com"
              className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.email ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'} focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium`}
            />
          </div>
          {errors.email && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.email.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-main mb-1.5 ml-1 uppercase tracking-wider">Mot de passe</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.password ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'} focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium`}
              />
            </div>
            {errors.password && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-main mb-1.5 ml-1 uppercase tracking-wider">Confirmation</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'} focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium`}
              />
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.confirmPassword.message}</p>}
          </div>
        </div>

        {serverError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[11px] font-bold">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-hover active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:pointer-events-none mt-4"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Créer mon compte
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-muted text-sm font-medium">
          Déjà un compte ? 
          <button 
            onClick={onSwitchToLogin}
            className="text-primary font-bold ml-1 hover:underline"
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
}
