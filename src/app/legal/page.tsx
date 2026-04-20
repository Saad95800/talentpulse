"use client";

import React from 'react';
import LegalWrapper from '@/components/LegalWrapper';

export default function LegalPage() {
  return (
    <LegalWrapper 
      title="Mentions Légales" 
      subtitle="Informations obligatoires concernant l'éditeur et l'hébergeur du site TalentPulse."
    >
      <section className="mb-12">
        <h2 className="text-2xl font-black mb-4">1. Édition du site</h2>
        <p>
          Le site <strong>TalentPulse</strong> accessible à l'adresse <code>{typeof window !== 'undefined' ? window.location.origin : 'https://talentpulse.fr'}</code> est édité par :
        </p>
        <ul className="list-disc pl-5 mt-4 space-y-2">
          <li><strong>Société / Nom :</strong> <span className="text-red-500 font-bold">[VOTRE NOM OU SOCIETE, ex: ReactiveDigital]</span></li>
          <li><strong>Forme juridique :</strong> <span className="text-red-500 font-bold">[AUTO-ENTREPRENEUR / SAS / SARL]</span></li>
          <li><strong>Siège social :</strong> <span className="text-red-500 font-bold">[VOTRE ADRESSE]</span></li>
          <li><strong>SIRET :</strong> <span className="text-red-500 font-bold">[VOTRE NUMERO SIRET]</span></li>
          <li><strong>Directeur de la publication :</strong> <span className="text-red-500 font-bold">[VOTRE NOM]</span></li>
          <li><strong>Contact :</strong> <code>contact@reactivedigital.fr</code></li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-black mb-4">2. Hébergement du site</h2>
        <p>
          Le site est hébergé par :
        </p>
        <ul className="list-disc pl-5 mt-4 space-y-2">
          <li><strong>Hébergeur :</strong> <span className="text-red-500 font-bold">[EX: VERCEL INC. / OVH SAS]</span></li>
          <li><strong>Adresse :</strong> <span className="text-red-500 font-bold">[ADRESSE DE L'HEBERGEUR]</span></li>
          <li><strong>Site web :</strong> <span className="text-red-500 font-bold">[URL HEBERGEUR]</span></li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-black mb-4">3. Propriété intellectuelle</h2>
        <p>
          L'ensemble des contenus (textes, images, graphismes, logo, icônes) présents sur le site sont la propriété exclusive de l'éditeur, sauf mention contraire. 
          Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-black mb-4">4. Limitation de responsabilité</h2>
        <p>
          L'éditeur ne pourra être tenu responsable des dommages directs et indirects causés au matériel de l'utilisateur, lors de l'accès au site. 
          Le service TalentPulse utilise des technologies d'Intelligence Artificielle. Bien que nous nous efforcions de fournir les résultats les plus précis possible, l'exactitude des analyses de matching n'est pas garantie et ne doit pas constituer le seul critère de décision de recrutement.
        </p>
      </section>
    </LegalWrapper>
  );
}
