describe('TalentPulse Matching Flow', () => {
  beforeEach(() => {
    // Authentification via la commande personnalisée fiable
    cy.login();
  });

  it('devrait matcher un CV PDF avec une offre PDF (Matching Simple)', () => {
    // 1. Sélection de la fiche de poste (le 2ème conteneur de type file)
    // On cible via le titre de la section pour être sûr
    cy.contains('h4', 'Fiche de Poste')
      .parent()
      .find('input[type="file"]')
      .selectFile('cypress/fixtures/offres/20260324 - Recrutement Dev API.pdf', { force: true });
    
    cy.contains('20260324 - Recrutement Dev API').should('be.visible');

    // 2. Sélection du CV (le 1er conteneur)
    cy.contains('h4', 'Profil du Candidat')
      .parent()
      .find('input[type="file"]')
      .selectFile('cypress/fixtures/cv/CV Saad RAJRAJI.pdf', { force: true });
    
    cy.contains('CV Saad RAJRAJI').should('be.visible');

    // 3. Lancement du matching
    cy.contains('button', 'Générer le Matching').should('not.be.disabled').click();

    // 4. Vérification du loader global (via Portail)
    // On cherche l'élement de chargement avec un timeout plus élevé
    cy.get('div.fixed.inset-0.z-\\[9999\\]', { timeout: 10000 }).should('be.visible');
    cy.contains('Analyse en cours').should('be.visible');

    // 5. Vérification du résultat final
    // L'analyse IA peut prendre du temps (Gemini + Claude)
    cy.get('[data-testid="match-result"]', { timeout: 45000 }).should('be.visible');
    cy.contains('Score de Matching').should('be.visible');
    cy.contains('Analyse sémantique').should('be.visible');
  });

  it('devrait matcher plusieurs CV simultanément (Mode Batch)', () => {
    // 1. Sélection de la fiche de poste
    cy.contains('h4', 'Fiche de Poste')
      .parent()
      .find('input[type="file"]')
      .selectFile('cypress/fixtures/offres/Offre.docx', { force: true });

    // 2. Sélection de 4 CVs
    const batchCVs = [
      'cypress/fixtures/cv/CV Abdellah.pdf',
      'cypress/fixtures/cv/CV Développeur Full Stack - Jolibois.pdf',
      'cypress/fixtures/cv/CV Fedoua.pdf',
      'cypress/fixtures/cv/CV Mehdi 2 (1).pdf'
    ];
    cy.contains('h4', 'Profil du Candidat')
      .parent()
      .find('input[type="file"]')
      .selectFile(batchCVs, { force: true });

    // 3. Lancer le batch
    cy.contains('button', /Matcher les 4 profils/i).click();

    // 4. Vérifier la progression séquentielle dans le loader
    // On attend que le premier soit fini pour voir le second
    cy.contains('Analyse du candidat 1/4', { timeout: 10000 }).should('be.visible');
    cy.contains('Analyse du candidat 2/4', { timeout: 30000 }).should('be.visible');
    
    // 5. Vérifier que les résultats s'affichent
    cy.get('[data-testid="multi-match-results"]', { timeout: 60000 }).should('be.visible');
    // On vérifie qu'on a bien nos 4 cartes
    cy.get('div.bg-white.rounded-3xl.shadow-xl').should('have.length.at.least', 4);
  });

  it('devrait matcher via saisie manuelle (Copier-Coller)', () => {
    // 1. Passer en mode texte pour l'offre
    cy.contains('div', 'Fiche de Poste').within(() => {
      cy.contains('button', 'Saisie Manuelle').click();
      cy.get('textarea').type("Recrutement d'un Développeur Senior React / Node.js. 5 ans d'expérience minimum, maîtrise des architectures micro-services.");
    });

    // 2. Passer en mode texte pour le CV
    cy.contains('div', 'Profil du Candidat').within(() => {
      cy.contains('button', 'Saisie Manuelle').click();
      cy.get('textarea').type("Jean Expert. Développeur Fullstack avec 7 ans d'expérience en React, Node.js et Kubernetes. Habitué aux environnements à forte charge.");
    });

    // 3. Matcher
    cy.contains('button', 'Générer le Matching').click();

    // 4. Vérifier le succès
    cy.get('[data-testid="match-result"]', { timeout: 30000 }).should('be.visible');
    cy.contains('Score de Matching').should('be.visible');
  });

  it('devrait rejeter un document qui n\'est pas un CV (Sécurité)', () => {
    cy.contains('h4', 'Fiche de Poste')
      .parent()
      .find('input[type="file"]')
      .selectFile('cypress/fixtures/offres/Offre.docx', { force: true });
    
    // On upload une image qui n'est manifestement pas un CV (ex: logo ou pizza)
    cy.contains('h4', 'Profil du Candidat')
      .parent()
      .find('input[type="file"]')
      .selectFile('cypress/fixtures/cv/CV Saad Developpeur Web.png', { force: true });

    cy.contains('button', 'Générer le Matching').click();

    // On s'attend à ce que l'analyse échoue ou indique une non-conformité
    // Le système retourne une erreur affichée dans le dashboard
    cy.contains('Analyse interrompue', { timeout: 20000 }).should('be.visible');
    cy.contains('ne semble pas être un CV valide', { timeout: 20000 }).should('be.visible');
  });
});
