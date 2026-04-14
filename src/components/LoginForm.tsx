"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import { setUser } from '@/store/userSlice';
import { loginAction } from '@/actions/auth.action';
import { Mail, Loader2, ArrowRight, Lock } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(1, { message: "Mot de passe requis" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister: () => void;
}

export default function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const dispatch = useDispatch();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError(null);
    
    try {
      const result = await loginAction(data);
      
      if (result.success) {
        const { token, user } = result as { token: string; user: { id: string; email: string; name: string | null; role: 'ADMIN' | 'USER'; credits: number; phone: string } };
        // Stockage du token
        localStorage.setItem('tm_token', token);
        
        // Mise à jour du store Redux
        dispatch(setUser({
          ...user,
          token: token
        }));
        
        if (onSuccess) onSuccess();
      } else {
        setServerError(result.error || "Identifiants invalides.");
      }
    } catch {
      setServerError("Erreur de connexion au serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-10 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-300 border border-slate-200">
      <div className="text-center mb-10">
        <h3 className="text-3xl font-bold text-main mb-3 tracking-tight">Bon retour !</h3>
        <p className="text-muted text-sm font-medium">Connectez-vous pour accéder à vos analyses.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-main mb-2 ml-1 uppercase tracking-wider">Email Professionnel</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-primary transition-colors" />
            <input
              {...register('email')}
              type="email"
              placeholder="votre@email.com"
              className={`w-full pl-12 pr-4 py-4 rounded-2xl border ${errors.email ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-slate-100/50'} focus:border-primary focus:bg-white outline-none transition-all font-semibold text-main placeholder:text-slate-400`}
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-main mb-2 ml-1 uppercase tracking-wider">Mot de passe</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-primary transition-colors" />
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className={`w-full pl-12 pr-4 py-4 rounded-2xl border ${errors.password ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-slate-100/50'} focus:border-primary focus:bg-white outline-none transition-all font-semibold text-main placeholder:text-slate-400`}
            />
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{errors.password.message}</p>}
        </div>

        {serverError && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold animate-in fade-in duration-300">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white py-4.5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-primary-hover active:scale-95 transition-all shadow-xl shadow-primary/25 disabled:opacity-70 disabled:pointer-events-none"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              Se connecter
              <ArrowRight className="w-6 h-6" />
            </>
          )}
        </button>
      </form>

      <div className="mt-10 pt-8 border-t border-slate-100 text-center">
        <p className="text-muted font-medium">
          Pas encore de compte ? 
          <button 
            onClick={onSwitchToRegister}
            className="text-primary font-bold ml-2 hover:underline tracking-tight"
          >
            Créer un compte gratuitement
          </button>
        </p>
      </div>
    </div>
  );
}
