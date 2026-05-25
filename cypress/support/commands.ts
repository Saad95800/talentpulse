/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (email = 'contact@reactivedigital.fr', password = '12345678') => {
  // On visite la page d'accueil
  cy.visit('/');
  
  // Attente de l'hydratation Next.js
  cy.get('nav').should('be.visible');
  cy.wait(2000);

  // Tentative de connexion
  cy.get('nav').contains('button', 'Connexion').click({ force: true });
  
  // Attendre la modale
  cy.get('h3').contains('Bon retour !', { timeout: 10000 }).should('be.visible');

  cy.get('input[type="email"]').should('be.visible').type(email);
  cy.get('input[type="password"]').should('be.visible').type(password);
  
  cy.contains('button', 'Se connecter').click();

  // On gère le cas où l'utilisateur n'existe pas encore dans la DB du test
  cy.get('body').then(($body) => {
    if ($body.text().includes('Identifiants invalides')) {
      cy.log('Compte non trouvé, création automatique du compte de test...');
      
      // Cliquer sur le lien switch vers register
      cy.contains('button', 'Créer un compte gratuitement').click();
      
      // Remplir le formulaire d'inscription
      cy.get('input[placeholder="Jean"]').type('Test', { force: true });
      cy.get('input[placeholder="Dupont"]').type('Admin', { force: true });
      
      // Email et Password sont peut-être déjà là ou à remplir
      cy.get('input[type="email"]').last().clear().type(email);
      cy.get('input[type="password"]').first().clear().type(password);
      cy.get('input[placeholder="••••••••"]').last().clear().type(password); // Confirm password
      
      cy.get('input[type="tel"]').type('0102030405');
      
      cy.contains('button', 'Créer mon compte').click();
      
      // Attendre le succès et revenir au login
      cy.contains('Inscription réussie').should('be.visible');
      cy.contains('button', 'Retour à la connexion').click();
      
      // Re-tenter le login
      cy.get('input[type="email"]').should('be.visible').type(email);
      cy.get('input[type="password"]').should('be.visible').type(password);
      cy.contains('button', 'Se connecter').click();
    }
  });

  // Une fois connecté, on doit arriver sur le dashboard
  cy.url({ timeout: 20000 }).should('include', '/dashboard');
  cy.get('body').should('contain', 'Dashboard');
});
