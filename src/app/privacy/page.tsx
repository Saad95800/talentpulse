"use client";

import React from 'react';
import LegalWrapper from '@/components/LegalWrapper';

export default function PrivacyPage() {
  return (
    <LegalWrapper 
      title="Politique de Confidentialité" 
      subtitle="La protection de vos données et de celles de vos candidats est notre priorité."
    >
      <section className="mb-12">
        <h2 className="text-2xl font-black mb-4">1. Collecte des données</h2>
        <p>
          Dans le cadre de l'utilisation de TalentPulse, nous collectons les données suivantes :
        </p>
        <ul className="list-disc pl-5 mt-4 space-y-2">
          <li><strong>Compte utilisateur :</strong> Nom, prénom (facultatif), adresse e-mail.</li>
          <li><strong>Données de recrutement :</strong> Fichiers CV (PDF, DOCX) et textes de fiches de poste téléchargés par l'utilisateur.</li>
          <li><strong>Paiement :</strong> Les informations de carte bancaire sont traitées exclusivement par Mollie. Nous n'y avons jamais accès.</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-black mb-4">2. Finalité du traitement</h2>
        <p>
          Vos données sont traitées pour les finalités suivantes :
        </p>
        <ul className="list-disc pl-5 mt-4 space-y-2">
          <li>Gestion de votre compte et de vos accès.</li>
          <li>Exécution de l'analyse automatisée par l'Intelligence Artificielle (matching).</li>
          <li>Envoi d'e-mails de service (confirmation d'inscription, facturation).</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-black mb-4">3. Partage des données</h2>
        <p>
          Pour réaliser l'analyse, le texte extrait des CV est transmis de manière sécurisée aux APIs de nos partenaires d'IA (Gemini par Google, Claude par Anthropic ou OpenAI). 
          <strong>Aucune donnée n'est revendue à des tiers.</strong>
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-black mb-4">4. Conservation des données</h2>
        <p>
          Les CV et résultats de matching sont conservés tant que votre compte est actif pour vous permettre de les consulter dans votre dashboard. 
          Vous pouvez supprimer n'importe quel matching à tout moment, ce qui entraînera la suppression définitive des données associées sur nos serveurs.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-black mb-4">5. Vos droits (RGPD)</h2>
        <p>
          Conformément au Règlement Général sur la Protection des Données, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. 
          Pour exercer ces droits, contactez-nous à : <code>contact@reactivedigital.fr</code>.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-black mb-4">6. Cookies</h2>
        <p>
          Nous utilisons des cookies techniques strictement nécessaires au fonctionnement de la session utilisateur. Aucun cookie de pistage publicitaire tiers n'est utilisé.
        </p>
      </section>
    </LegalWrapper>
  );
}
