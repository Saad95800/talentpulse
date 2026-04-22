"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken, verifyToken } from "@/lib/auth";
import { sendVerificationEmail, syncContactToBrevo } from "@/lib/mail";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { handleActionError, handleActionSuccess, handleActionWarning } from "@/lib/error-handler";

const registerSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit faire au moins 2 caractères."),
  lastName: z.string().min(2, "Le nom doit faire au moins 2 caractères."),
  email: z.string().email("Format d'email invalide."),
  phone: z.string().min(10, "Le numéro de téléphone doit faire au moins 10 chiffres."),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères."),
});

/**
 * Inscription d'un nouvel utilisateur
 */
export async function registerAction(data: unknown) {
  try {
    const formData = Array.isArray(data) ? data[0] : data;
    const validated = registerSchema.safeParse(formData);
    
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { firstName, lastName, email, phone, password } = validated.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      return { success: false, error: "Cet email est déjà utilisé." };
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = uuidv4();

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email,
        phone,
        password: hashedPassword,
        verificationToken,
        isVerified: false,
        credits: email.toLowerCase() === 'contact@reactivedigital.fr' ? 999999 : 3,
      },
    });
    
    // Background tasks with individual error catchers
    syncContactToBrevo(email, firstName, lastName, phone).catch(e => handleActionWarning("Échec synchro Brevo (Background)", { userId: user.id, error: e }));
    sendVerificationEmail(email, verificationToken).catch(e => handleActionWarning("Échec envoi mail vérification (Background)", { userId: user.id, error: e }));

    await handleActionSuccess(`Inscription réussie: ${email}`, { userId: user.id, actionName: "registerAction" });

    return { 
      success: true, 
      message: "Inscription réussie ! Un email de confirmation vous a été envoyé pour activer votre compte." 
    };

  } catch (error) {
    return handleActionError("Échec lors de l'inscription", error, { actionName: "registerAction" });
  }
}

/**
 * Connexion de l'utilisateur
 */
export async function loginAction(formData: { email: string; password: string }) {
  try {
    const { email, password } = formData;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isVerified) {
      return { success: false, error: !user ? "Identifiants invalides." : "Votre compte n'est pas encore activé." };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { success: false, error: "Identifiants invalides." };
    }

    // Force ADMIN status for main email if not already
    if (email.toLowerCase() === 'contact@reactivedigital.fr' && user.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' }
      });
      user.role = 'ADMIN';
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    console.log(`[loginAction] Preparing success response for ${email} (Role: ${user.role})`);

    const response = {
      success: true as const,
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        phone: user.phone,
        credits: Number(user.credits),
        role: String(user.role),
        plan: String(user.plan),
        subscriptionStatus: user.subscriptionStatus ? String(user.subscriptionStatus) : null,
        nextBillingDate: user.nextBillingDate ? user.nextBillingDate.toISOString() : null,
      }
    };

    const serialized = JSON.stringify(response);
    console.log(`[loginAction] Returning serialized response for ${email}`);

    await handleActionSuccess(`Connexion réussie: ${email}`, { userId: user.id, actionName: "loginAction" });

    return { rawData: serialized };

  } catch (error) {
    return handleActionError("Erreur de connexion", error, { actionName: "loginAction" });
  }
}

/**
 * Vérification de l'email via le token
 */
export async function verifyEmailAction(token: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
      select: { id: true }
    });

    if (!user) {
      return { success: false, error: "Lien de vérification invalide ou expiré." };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null },
    });

    return { success: true, message: "Votre compte a été activé ! Vous pouvez vous connecter." };

  } catch (error) {
    return handleActionError("Erreur vérification email", error, { actionName: "verifyEmailAction" });
  }
}

/**
 * Validation asynchrone du token (AJAX)
 */
export async function validateTokenAction(token: string) {
  try {
    const decoded = verifyToken(token) as { userId: string } | null;
    if (!decoded?.userId) return { valid: false };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { 
        id: true, 
        firstName: true,
        lastName: true,
        name: true, 
        email: true, 
        phone: true, 
        credits: true, 
        role: true, 
        isVerified: true,
        plan: true,
        subscriptionStatus: true,
        nextBillingDate: true
      }
    });

    if (!user?.isVerified) return { valid: false };

    return { 
      valid: true, 
      userId: user.id,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        phone: user.phone,
        credits: user.credits,
        role: user.role,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        nextBillingDate: user.nextBillingDate,
      }
    };
  } catch (error) {
    handleActionError("Échec validation token AJAX", error, { actionName: "validateTokenAction" });
    return { valid: false };
  }
}
