describe('Talent Matcher E2E Flow', () => {
  beforeEach(() => {
    // On efface les cookies/localStorage pour simuler un nouvel utilisateur
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('should complete the lead registration and access the dashboard', () => {
    const testEmail = `test-${Date.now()}@test.com`;

    // 1. Accueil
    cy.contains("Matchez vos talents").should('be.visible');
    
    // 2. Ouvrir le formulaire
    cy.contains("Analyser un CV gratuitement").click();
    
    // 3. Remplir le formulaire
    cy.get('input[placeholder="Jean"]').type('Jean');
    cy.get('input[placeholder="Dupont"]').type('Testeur');
    cy.get('input[type="email"]').type(testEmail);
    cy.get('input[type="tel"]').type('0612345678');
    cy.get('input[placeholder="••••••••"]').first().type('12345678');
    cy.get('input[placeholder="••••••••"]').last().type('12345678'); // Confirmation
    
    cy.get('button[type="submit"]').click();

    // 4. Inscription réussie -> Go to Login
    cy.contains('Inscription réussie').should('be.visible');
    cy.contains('button', 'Retour à la connexion').click();
    
    // 5. Connexion
    cy.get('input[type="email"]').type(testEmail);
    cy.get('input[type="password"]').type('12345678');
    cy.contains('button', 'Se connecter').click();
    
    // 6. Vérifier la redirection
    cy.url({ timeout: 10000 }).should('include', '/dashboard');
    cy.contains('Jean Testeur', { timeout: 10000 }).should('be.visible');
  });

  it('should protect the dashboard route', () => {
    // Tenter d'accéder au dashboard directement
    cy.visit('/dashboard');
    // Devrait rediriger vers la home car non connecté
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });
});
