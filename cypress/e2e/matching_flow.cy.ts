describe('Talent Matcher E2E Flow', () => {
  beforeEach(() => {
    // On efface les cookies/localStorage pour simuler un nouvel utilisateur
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('should complete the lead registration and access the dashboard', () => {
    // 1. Accueil
    cy.contains("Matchez vos talents").should('be.visible');
    
    // 2. Ouvrir le formulaire
    cy.contains("Analyser un CV gratuitement").click();
    
    // 3. Remplir le formulaire
    cy.get('input[name="name"]').type('Jean Testeur');
    cy.get('input[name="email"]').type('jean.test@example.com');
    cy.get('input[name="phone"]').type('0612345678');
    
    // On intercepte l'appel API (Server Action) - Note: Cypress ne peut pas facilement 
    // intercepter les server actions mais on peut vérifier le résultat UI
    cy.get('button[type="submit"]').click();
    
    // 4. Vérifier la redirection
    cy.url().should('include', '/dashboard');
    cy.contains('Bienvenue, Jean Testeur').should('be.visible');
    cy.contains('Tes Crédits : 3').should('be.visible');
  });

  it('should protect the dashboard route', () => {
    // Tenter d'accéder au dashboard directement
    cy.visit('/dashboard');
    // Devrait rediriger vers la home car non connecté
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });
});
