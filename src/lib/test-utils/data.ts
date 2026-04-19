/**
 * Bibliothèque de données de test pour TalentPulse.
 * Contient des simulations de CV, d'offres d'emploi et de cas d'erreur.
 */

export const MOCK_CV_DEV = {
  filename: "cv_dev.pdf",
  content: "Jean Dupont. Développeur Fullstack avec 5 ans d'expérience en React et Node.js. Formation: Master Informatique.",
  category: "CV"
};

export const MOCK_CV_JUNIOR_MARKETING = {
  filename: "marketing_jr.docx",
  content: "Alice Martin. Stage en Marketing Digital. Compétences: SEO, Google Ads, Réseaux sociaux.",
  category: "CV"
};

export const MOCK_JOB_FRONTEND = {
  filename: "job_frontend.txt",
  content: "Recherche Développeur Frontend Senior. Stack: React, Tailwind, TypeScript. 5+ ans d'expérience requis.",
  category: "OFFRE"
};

export const MOCK_JOB_COOK = {
  filename: "job_cuisinier.pdf",
  content: "RECHERCHE CHEF DE CUISINE. Expérience en restaurant étoilé. Maîtrise de la cuisine française traditionnelle.",
  category: "OFFRE"
};

export const MOCK_INVALID_PIZZA_ORDER = {
  filename: "pizza_order.pdf",
  content: "Commande de Pizza: 1x Regina, 1x Calzone. Livraison à 19h30 au 12 rue des Fleurs.",
  category: "AUTRE"
};

export const MOCK_IMAGE_ONLY_ERROR_MSG = {
  filename: "scanned_doc.pdf",
  content: "This document contains image-only content and cannot be parsed textually.",
  category: "CV"
};

export const MOCK_EMPTY_DOC = {
  filename: "empty.txt",
  content: "   ",
  category: "CV"
};

export const MOCK_VERY_LONG_DOC = {
  filename: "long_report.txt",
  content: "A".repeat(60000), // Pour tester la troncature à 50k
  category: "AUTRE"
};

/**
 * Matrice de test pour la conformité.
 */
export const CONFORMITY_TEST_CASES = [
  { name: "Valid CV Dev", doc: MOCK_CV_DEV, expectedCategory: "CV", shouldPass: true },
  { name: "Valid Job Frontend", doc: MOCK_JOB_FRONTEND, expectedCategory: "OFFRE", shouldPass: true },
  { name: "Invalid: Pizza as Job", doc: MOCK_INVALID_PIZZA_ORDER, expectedCategory: "OFFRE", shouldPass: false },
  { name: "Invalid: Job as CV", doc: MOCK_JOB_FRONTEND, expectedCategory: "CV", shouldPass: false },
  { name: "Empty Document", doc: MOCK_EMPTY_DOC, expectedCategory: "CV", shouldPass: false },
];
