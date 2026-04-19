"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { logUserActivityAction } from "@/actions/activity.action";

/**
 * Composant de tracking global.
 * Capture les clics et les navigations de manière non-intrusive.
 */
export default function ActivityTracker() {
  const { user } = useAuth();
  const userId = user?.id;
  const pathname = usePathname();
  const lastPathname = useRef(pathname);

  // Buffer pour grouper les logs (évite de spammer le serveur)
  const logBuffer = useRef<Record<string, unknown>[]>([]);
  const flushTimeout = useRef<NodeJS.Timeout | null>(null);

  const flushLogs = useCallback(async () => {
    if (logBuffer.current.length === 0 || !userId) return;

    const logsToProcess = [...logBuffer.current];
    logBuffer.current = [];
    
    for (const log of logsToProcess) {
      logUserActivityAction({ ...log, userId });
    }
  }, [userId]);

  const queueLog = useCallback((type: string, data: Record<string, unknown>) => {
    if (!userId) return;

    logBuffer.current.push({
      type,
      path: pathname,
      ...data,
      timestamp: new Date().toISOString()
    });

    if (flushTimeout.current) clearTimeout(flushTimeout.current);
    flushTimeout.current = setTimeout(flushLogs, 2000); // Flush après 2s d'inactivité
  }, [userId, pathname, flushLogs]);

  // Tracking de Navigation
  useEffect(() => {
    if (pathname !== lastPathname.current) {
      queueLog("PAGE_VIEW", {
        description: `Navigation vers ${pathname}`,
        target: pathname
      });
      lastPathname.current = pathname;
    }
  }, [pathname, queueLog]);

  // Tracking de Clic Global
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // On cherche l'élément interactif le plus proche (bouton ou lien)
      const interactiveEl = target.closest("button, a, [role='button'], [data-track]");
      
      if (interactiveEl) {
        const text = interactiveEl.textContent?.trim().substring(0, 50) || "";
        const id = interactiveEl.id;
        const role = interactiveEl.getAttribute("role") || interactiveEl.tagName;
        
        queueLog("CLICK", {
          description: `Clic sur ${role}: "${text}"`,
          target: id || text || role,
          metadata: {
             tagName: interactiveEl.tagName,
             id: interactiveEl.id,
             classList: Array.from(interactiveEl.classList).join(' ')
          }
        });
      }
    };

    window.addEventListener("click", handleGlobalClick, { capture: true });
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [queueLog]);

  return null; // Composant invisible
}
