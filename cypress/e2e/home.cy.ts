describe('Home Page', () => {
  it('should load the home page and display the welcome message', () => {
    cy.visit('/');
    cy.contains("Bienvenue sur l'Algorithme de Matching IA").should('be.visible');
  });
});
