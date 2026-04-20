"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken, verifyToken } from "@/lib/auth";
import { sendVerificationEmail, syncContactToBrevo } from "@/lib/mail";
import { v4 as uuidv4 } from "uuid";

import { z } from "zod";

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
    // 0. Gestion du payload : si c'est un tableau (test manuel), on prend le premier élément
    const formData = Array.isArray(data) ? data[0] : data;

    // 1. Validation Zod des données
    const validated = registerSchema.safeParse(formData);
    if (!validated.success) {
      return { 
        success: false, 
        error: validated.error.issues[0].message 
      };
    }

    const { firstName, lastName, email, phone, password } = validated.data;

    // 2. Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "Cet email est déjà utilisé." };
    }

    // 3. Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Génération du token de vérification
    const verificationToken = uuidv4();

    // 5. Création de l'utilisateur
    await prisma.user.create({
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email,
        phone,
        password: hashedPassword,
        verificationToken,
        isVerified: false,
        // VIP logic: contact@reactivedigital.fr is admin with unlimited credits
        credits: email.toLowerCase() === 'contact@reactivedigital.fr' ? 999999 : 3,
      },
    });
    
    // 5.5 Synchronisation Brevo (CRM)
    try {
      await syncContactToBrevo(email, firstName, lastName, phone);
    } catch (brevoError) {
      console.error("❌ [Brevo] Erreur synchronisation contact:", brevoError);
    }

    // 6. Envoi de l'email de vérification
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (mailError) {
      console.error("❌ [Mail] Erreur envoi mail:", mailError);
      // On continue quand même pour ne pas bloquer l'expérience utilisateur
    }

    return { 
      success: true, 
      message: "Inscription réussie ! Un email de confirmation vous a été envoyé pour activer votre compte." 
    };

  } catch (error) {
    console.error("❌ [RegisterAction] Erreur critique:", error);
    // En développement, on peut être plus bavard sur l'erreur réelle
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return { 
      success: false, 
      error: process.env.NODE_ENV === 'development' 
        ? `Erreur serveur: ${errorMessage}` 
        : "Une erreur est survenue lors de l'inscription. Veuillez réessayer." 
    };
  }
}

/**
 * Connexion de l'utilisateur
 */
export async function loginAction(formData: { email: string; password: string }) {
  try {
    const { email, password } = formData;

    // 1. Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "Identifiants invalides." };
    }

    // 2. Vérifier si le compte est activé
    if (!user.isVerified) {
      return { success: false, error: "Votre compte n'est pas encore activé. Vérifiez vos emails." };
    }

    // 3. Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { success: false, error: "Identifiants invalides." };
    }

    // 4. Générer le JWT
    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    return {
      success: true,
      token,
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
    console.error("Erreur Connexion:", error);
    return { success: false, error: "Erreur de connexion." };
  }
}

/**
 * Vérification de l'email via le token du lien
 */
export async function verifyEmailAction(token: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      return { success: false, error: "Lien de vérification invalide ou expiré." };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null, // On invalide le token après usage
      },
    });

    return { success: true, message: "Votre compte a été activé avec succès ! Vous pouvez maintenant vous connecter." };

  } catch {
    return { success: false, error: "Erreur lors de la vérification de l'email." };
  }
}

/**
 * Validation asynchrone du token (AJAX)
 */
export async function validateTokenAction(token: string) {
  try {
    const decoded = verifyToken(token) as { userId: string } | null;
    
    if (!decoded || !decoded.userId) {
      return { valid: false };
    }

    // Vérifier si l'utilisateur existe toujours en base et récupérer ses infos
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

    if (!user || !user.isVerified) {
      return { valid: false };
    }

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
    return { valid: false };
  }
}
