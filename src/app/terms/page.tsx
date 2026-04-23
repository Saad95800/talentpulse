"use client";

import React from 'react';
import LegalWrapper from '@/components/LegalWrapper';

export default function TermsPage() {
  return (
    <LegalWrapper 
      title="Conditions Générales de Vente" 
      subtitle="Les règles encadrant l'utilisation de nos services et les modalités d'abonnement."
    >
      <section className="mb-12">
        <h2 className="text-2xl font-black mb-4">1. Objet du service</h2>
        <p>
          TalentPulse est un service de "Software as a Service" (SaaS) proposant des outils d'aide au recrutement basés sur l'intelligence artificielle, notamment le matching de CV par rapport à des fiches de poste.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-black mb-4">2. Description des offres</h2>
        <p>Plusieurs formules sont proposées :</p>
        <ul className="list-disc pl-5 mt-4 space-y-2">
          <li><strong>Offre Gratuite :</strong> Accès limité à 3 crédits par semaine et analyse groupée limitée à 3 CV.</li>
          <li><strong>Offre Premium :</strong> Abonnement mensuel à <strong>39,90€ TTC</strong> offrant 100 crédits par mois et analyse groupée jusqu'à 10 CV.</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-black mb-4">3. Modalités de paiement</h2>
        <p>
          Le paiement s'effectue par carte bancaire via le prestataire sécurisé <strong>Mollie</strong>. 
          L'abonnement Premium est facturé mensuellement à la date anniversaire de la souscription.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-black mb-4">4. Droit de rétractation</h2>
        <p>
          Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne peut être exercé pour les contrats de fourniture de contenu numérique non fourni sur un support matériel dont l'exécution a commencé après accord préalable exprès du consommateur et renoncement exprès à son droit de rétractation.
        </p>
        <p className="mt-2 text-sm italic">
          En utilisant vos crédits immédiatement après l'achat, vous acceptez que l'exécution du service commence et renoncez à votre droit de rétractation.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-black mb-4">5. Résiliation</h2>
        <p>
          L'abonnement Premium est <strong>sans engagement</strong>. Vous pouvez résilier à tout moment depuis votre interface "Abonnement". 
          La résiliation prendra effet à la fin de la période mensuelle en cours. Aucun remboursement prorata temporis ne sera effectué.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-black mb-4">6. Force majeure et disponibilité</h2>
        <p>
          L'éditeur s'efforce d'assurer une disponibilité du service 24h/24, 7j/7, sauf en cas de maintenance ou de force majeure (panne des fournisseurs d'IA, réseaux, etc.).
        </p>
      </section>

      <section className="mb-12" id="litiges">
        <h2 className="text-2xl font-black mb-4">7. Litiges et Droit applicable</h2>
        <p>
          Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire devant les tribunaux compétents de <strong>Bobigny</strong>.
        </p>
      </section>
    </LegalWrapper>
  );
}
