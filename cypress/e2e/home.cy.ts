describe('Home Page', () => {
  it('should load the home page and display the welcome message', () => {
    cy.visit('/');
    cy.contains("Matchez vos talents").should('be.visible');
  });
});
