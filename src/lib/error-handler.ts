import { captureException, captureMessage } from "./sentry-wrapper";
import prisma from "./prisma";

export type LogLevel = "INFO" | "WARN" | "ERROR";

interface ErrorContext {
  userId?: string;
  actionName?: string;
  context?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Centralized Error & Log Handler
 * Integrates Sentry (Cloud) + AppLog (Database) + Console
 */
export async function handleActionError(
  message: string,
  error?: unknown,
  metadata?: ErrorContext
) {
  const { userId, actionName, context, ...rest } = metadata || {};
  const errorMessage = error instanceof Error ? error.message : String(error);
  const fullMessage = `${actionName ? `[${actionName}] ` : ""}${message}: ${errorMessage}`;
  
  // 1. Sentry Logging (ERROR LEVEL)
  captureException(error || new Error(message), {
    level: "error",
    extra: {
      actionName,
      message,
      context,
      ...rest,
    },
    user: userId ? { id: userId } : undefined,
  });

  // 2. Database Logging (Persisted Audit)
  try {
    await prisma.appLog.create({
      data: {
        level: "ERROR",
        message: fullMessage,
        stack: error instanceof Error ? error.stack : null,
        userId: userId || null,
        context: context ? JSON.stringify({ ...context, ...rest }) : JSON.stringify(rest),
      },
    });
  } catch (dbError) {
    console.error("Critical: Failed to log error to database", dbError);
  }

  // 3. Console Logging
  console.error(`❌ ${fullMessage}`, error);

  // 4. Standardized Response for Server Actions
  const userFriendlyMessage = process.env.NODE_ENV === "development" 
    ? `[${actionName || "Server"}] ${message}: ${errorMessage}`
    : "Une erreur est survenue.";

  return {
    success: false as const,
    error: userFriendlyMessage,
    actionName
  };
}

/**
 * Capture warnings or unusual behaviors that don't throw but need attention
 */
export async function handleActionWarning(
  message: string,
  metadata?: ErrorContext
) {
  const { userId, actionName, context, ...rest } = metadata || {};
  const fullMessage = `${actionName ? `[${actionName}] ` : ""}${message}`;

  // 1. Sentry Capture (WARNING LEVEL)
  captureMessage(fullMessage, {
    level: "warning",
    extra: {
      actionName,
      context,
      ...rest,
    },
    user: userId ? { id: userId } : undefined,
  });

  // 2. Database Logging
  try {
    await prisma.appLog.create({
      data: {
        level: "WARN",
        message: fullMessage,
        userId: userId || null,
        context: context ? JSON.stringify({ ...context, ...rest }) : JSON.stringify(rest),
      },
    });
  } catch (dbError) {
    console.error("Failed to log warning to database", dbError);
  }

  // 3. Console Logging
  console.warn(`⚠️ ${fullMessage}`);
}

/**
 * Success Logger (System information)
 */
export async function handleActionSuccess(
  message: string,
  metadata?: ErrorContext
) {
  const { userId, actionName, context } = metadata || {};
  const fullMessage = `${actionName ? `[${actionName}] ` : ""}${message}`;

  try {
    await prisma.appLog.create({
      data: {
        level: "INFO",
        message: fullMessage,
        userId: userId || null,
        context: context ? JSON.stringify(context) : null,
      },
    });
  } catch (dbError) {
    console.error("Failed to log success to database", dbError);
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`✅ ${fullMessage}`);
  }
}
