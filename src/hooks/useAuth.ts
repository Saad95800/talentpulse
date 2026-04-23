"use client";

import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { logout as logoutAction, setToken, setUser, User } from '@/store/userSlice';
import { validateTokenAction } from '@/actions/auth.action';
import { usePathname, useRouter } from 'next/navigation';

export function useAuth() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, token, user } = useSelector((state: RootState) => state.user);

  // Fonction de déconnexion complète
  const logout = useCallback(() => {
    localStorage.removeItem('tm_token');
    localStorage.removeItem('tm_user');
    dispatch(logoutAction());
  }, [dispatch]);

  // Fonction de connexion (utilisée par les formulaires)
  const login = useCallback((token: string, userData: User) => {
    localStorage.setItem('tm_token', token);
    localStorage.setItem('tm_user', JSON.stringify(userData));
    dispatch(setUser({ ...userData, token }));
  }, [dispatch]);

  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('tm_token');
    const storedUser = localStorage.getItem('tm_user');
    let currentUserId: string | undefined = user?.id;

    // Resturation de session au chargement
    if (storedToken && !token) {
      try {
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          currentUserId = userData.id;
          dispatch(setUser({ ...userData, token: storedToken }));
        } else {
          dispatch(setToken(storedToken));
        }
      } catch (e) {
        console.error("[Auth] Erreur lors de la récupération de la session locale:", e);
        localStorage.removeItem('tm_user');
      }
    }

    // Protection des routes privées
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin-talent-scraper/dashboard')) {
      if (!storedToken) {
        logout();
        router.push('/');
        return { valid: false };
      }

      // OPTIMISATION: Si on a déjà ces infos en Redux, on considère la session valide pour accélérer la redirection
      if (storedToken && user && user.id) {
        return { valid: true, userId: user.id };
      }

      const result = await validateTokenAction(storedToken);
      
      if (!result.valid) {
        console.warn("[Auth] Session invalide. Redirection.");
        logout();
        router.push('/');
        return { valid: false };
      }

      // Synchronisation de l'état Redux si nécessaire (cas après refresh ou vidage cache)
      if (result.user && (!user || user.id !== result.user.id)) {
        dispatch(setUser({ ...result.user, token: storedToken }));
      }

      return { valid: true, userId: result.userId || currentUserId };
    }
    return { valid: true, userId: currentUserId };
  }, [dispatch, pathname, router, token, logout, user]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth, pathname]);

  return { isLoggedIn, token, user, checkAuth, login, logout };
}
