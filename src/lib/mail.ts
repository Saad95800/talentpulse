/**
 * Service d'envoi d'emails via l'API REST de Brevo (Sendinblue).
 * Approche moderne remplaçant SMTP pour une meilleure fiabilité.
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Configuration de l'expéditeur (doit être vérifié dans Brevo)
const SENDER = {
  name: "TalentMatcher",
  email: process.env.SMTP_USER || "contact@reactivedigital.fr"
};

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
      <h1 style="color: #0f172a; text-align: center;">Bienvenue sur TalentMatcher !</h1>
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
        L'équipe TalentMatcher
      </p>
    </div>
  `;

  return sendBrevoEmail(email, 'Activez votre compte TalentMatcher 🚀', htmlContent);
}

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Réinitialisation de votre mot de passe</h2>
      <p>Vous avez demandé la réinitialisation de votre mot de passe TalentMatcher.</p>
      <p>Cliquez sur le lien ci-dessous pour procéder :</p>
      <a href="${resetUrl}">${resetUrl}</a>
    </div>
  `;

  return sendBrevoEmail(email, 'Réinitialisation de votre mot de passe', htmlContent);
}
