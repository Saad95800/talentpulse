"use server";

import prisma from "@/lib/prisma";

export type LogLevel = "INFO" | "WARN" | "ERROR";

interface LogPayload {
  level: LogLevel;
  message: string;
  stack?: string;
  userId?: string;
  context?: Record<string, unknown> | string;
}

/**
 * Enregistre un log dans la base de données.
 * Utilisable côté client et côté serveur.
 */
export async function logToDB(payload: LogPayload) {
  try {
    const { level, message, stack, userId, context } = payload;
    
    // On convertit le contexte en string si c'est un objet
    let contextStr = "";
    if (context) {
      contextStr = typeof context === 'string' ? context : JSON.stringify(context);
    }

    await prisma.appLog.create({
      data: {
        level,
        message,
        stack: stack || null,
        userId: userId || null,
        context: contextStr || null,
      },
    });
    
    return { success: true };
  } catch (error) {
    // FAIL-SILENT
    console.error("[Logger:DatabaseFailure]", error instanceof Error ? error.message : error);
    return { success: true, error: "Database logging suppressed" };
  }
}

/**
 * Helper pour loguer une erreur rapidement
 */
export async function logError(message: string, error?: unknown, userId?: string, context?: Record<string, unknown>) {
  const stack = error instanceof Error ? error.stack : undefined;
  const errorMsg = error instanceof Error ? error.message : (typeof error === 'string' ? error : "");
  
  return logToDB({
    level: "ERROR",
    message: `${message}${errorMsg ? " : " + errorMsg : ""}`,
    stack,
    userId,
    context
  });
}

/**
 * Helper pour loguer un avertissement
 */
export async function logWarn(message: string, userId?: string, context?: Record<string, unknown>) {
  return logToDB({
    level: "WARN",
    message,
    userId,
    context
  });
}

/**
 * Helper pour loguer une info
 */
export async function logInfo(message: string, userId?: string, context?: Record<string, unknown>) {
  return logToDB({
    level: "INFO",
    message,
    userId,
    context
  });
}
