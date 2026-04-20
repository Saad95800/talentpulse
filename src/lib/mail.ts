/**
 * Service d'envoi d'emails via l'API REST de Brevo (Sendinblue).
 * Approche moderne remplaçant SMTP pour une meilleure fiabilité.
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_LIST_ID = parseInt(process.env.BREVO_LIST_ID || '3');
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Configuration de l'expéditeur (doit être vérifié dans Brevo)
const SENDER = {
  name: "TalentPulse",
  email: process.env.SMTP_USER || "contact@reactivedigital.fr"
};

/**
 * Inscription d'un contact dans la liste Brevo
 */
export async function syncContactToBrevo(email: string, name: string, phone?: string) {
  if (!BREVO_API_KEY) {
    console.warn("⚠️ BREVO_API_KEY manquante, synchronisation contact ignorée.");
    return;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        attributes: {
          NOM: name,
          SMS: phone || "",
          SOURCE: "TalentPulse"
        },
        listIds: [BREVO_LIST_ID],
        updateEnabled: true // Met à jour si le contact existe déjà
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Si l'erreur est "Contact already exists in list", on peut l'ignorer ou logguer
      if (errorData.code === 'duplicate_parameter') {
        console.log(`[Brevo] Contact ${email} déjà présent, mis à jour.`);
      } else {
        console.error("❌ Erreur API Brevo Contacts:", errorData);
      }
    } else {
      console.log(`✅ [Brevo] Contact synchronisé : ${email}`);
    }
  } catch (error) {
    console.error("❌ Échec de la synchronisation Brevo:", error);
  }
}

/**
 * Envoie un email transactionnel via l'API Brevo v3
 */
async function sendBrevoEmail(to: string, subject: string, htmlContent: string) {
  if (!BREVO_API_KEY) {
    console.error("❌ BREVO_API_KEY manquante dans les variables d'environnement.");
    throw new Error("Erreur de configuration email.");
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Erreur API Brevo:", errorData);
      throw new Error(`Brevo API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Échec de l'envoi d'email via API Brevo:", error);
    throw error;
  }
}

/**
 * Envoie un email de vérification de compte
 */
export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h1 style="color: #0f172a; text-align: center;">Bienvenue sur TalentPulse !</h1>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">
        Merci de vous être inscrit. Pour commencer à utiliser notre outil de matching IA et profiter de vos crédits offerts, merci de confirmer votre adresse email en cliquant sur le bouton ci-dessous :
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Confirmer mon adresse email
        </a>
      </div>
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
        <a href="${verifyUrl}">${verifyUrl}</a>
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
      <p style="color: #64748b; font-size: 14px; text-align: center;">
        L'équipe TalentPulse
      </p>
    </div>
  `;

  return sendBrevoEmail(email, 'Activez votre compte TalentPulse 🚀', htmlContent);
}

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Réinitialisation de votre mot de passe</h2>
      <p>Vous avez demandé la réinitialisation de votre mot de passe TalentPulse.</p>
      <p>Cliquez sur le lien ci-dessous pour procéder :</p>
      <a href="${resetUrl}">${resetUrl}</a>
    </div>
  `;

  return sendBrevoEmail(email, 'Réinitialisation de votre mot de passe', htmlContent);
}

/**
 * Envoie un email en cas d'échec de prélèvement
 */
export async function sendBillingFailureEmail(email: string, attempt: number) {
  const subject = attempt >= 3 
    ? '🛑 Suspension de votre abonnement TalentPulse' 
    : `⚠️ Échec de paiement - Tentative ${attempt}/3`;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 12px; background-color: #fef2f2;">
      <h2 style="color: #991b1b; text-align: center;">Problème de paiement</h2>
      <p style="color: #4b5563; font-size: 16px;">
        Nous n'avons pas pu prélever votre abonnement mensuel de 39,90€ pour votre accès Premium TalentPulse.
      </p>
      ${attempt >= 3 
        ? `<p style="color: #b91c1c; font-weight: bold;">Suite à 3 tentatives infructueuses, votre accès Premium a été suspendu et votre compte est repassé en mode gratuit.</p>`
        : `<p>Nous ferons une nouvelle tentative demain. Merci de vérifier vos fonds ou de mettre à jour votre carte si nécessaire.</p>`
      }
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_URL}/dashboard" style="background-color: #991b1b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Gérer mon abonnement
        </a>
      </div>
      <p style="color: #6b7280; font-size: 14px; text-align: center;">L'équipe Reactive Digital</p>
    </div>
  `;

  return sendBrevoEmail(email, subject, htmlContent);
}

/**
 * Envoie une confirmation de paiement réussi
 */
export async function sendBillingSuccessEmail(email: string, amount: string | number, receiptNumber: string) {
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #dcfce7; border-radius: 12px; background-color: #f0fdf4;">
      <h2 style="color: #166534; text-align: center;">Merci pour votre confiance !</h2>
      <p style="color: #374151; font-size: 16px;">
        Votre abonnement Premium TalentPulse a été activé/renouvelé avec succès.
      </p>
      <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
        <p style="margin: 5px 0;"><strong>Référence :</strong> ${receiptNumber}</p>
        <p style="margin: 5px 0;"><strong>Montant :</strong> ${amount}€</p>
        <p style="margin: 5px 0;"><strong>Détail :</strong> 100 crédits TalentPulse</p>
      </div>
      <p>Votre solde a été réinitialisé à 100 crédits pour ce nouveau mois.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_URL}/dashboard" style="background-color: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Accéder à mon Dashboard
        </a>
      </div>
      <p style="color: #6b7280; font-size: 14px; text-align: center;">L'équipe Reactive Digital</p>
    </div>
  `;

  return sendBrevoEmail(email, `Confirmation de paiement ${receiptNumber} - TalentPulse ✅`, htmlContent);
}
