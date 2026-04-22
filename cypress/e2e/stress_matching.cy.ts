describe('TalentPulse Matching Stress Test', () => {
    const testUser = {
        email: 'contact@reactivedigital.fr',
        password: '12345678'
    };

    const cvs = [
        { path: 'cypress/fixtures/cv/CV Saad RAJRAJI.pdf', name: 'Saad RAJRAJI' },
        { path: 'cypress/fixtures/cv/CV Saad Developpeur Web.png', name: 'Saad RAJRAJI' }, // OCR extrait le vrai nom
        { path: 'cypress/fixtures/cv/CV Fedoua.pdf', name: 'Fedoua' },
        { path: 'cypress/fixtures/cv/CV Abdellah.pdf', name: 'Abdellah' }
    ];

    const offers = [
        { path: 'cypress/fixtures/offres/20260324 - Recrutement Dev API.pdf', name: 'Dev API' },
        { path: 'cypress/fixtures/offres/Offre.docx', name: 'Offre Standard' },
        { path: 'cypress/fixtures/offres/Offre3.docx', name: 'Offre Technique' }
    ];

    beforeEach(() => {
        // Ignorer les erreurs de type "unexpected response" liées au cycle de vie Next.js
        Cypress.on('uncaught:exception', (err) => {
            if (err.message.includes('unexpected response received from the server')) {
                return false;
            }
            return true;
        });

        // Login with specified credentials (redirects to /dashboard)
        cy.login(testUser.email, testUser.password);
        
        // S'assurer que le dashboard est vierge
        cy.get('body').then(($body) => {
            if ($body.find('button:contains("Forcer l\'arrêt")').length > 0) {
                cy.contains('button', /Forcer l'arrêt/i).click();
                cy.wait(3000);
            }
            if ($body.find('button:contains("Nouvelle analyse")').length > 0) {
                cy.contains('button', /Nouvelle analyse/i).click();
                cy.wait(1000);
            }
        });
    });

    // We loop through combinations
    const combinations = [
        { cvIndex: 0, offerIndex: 0 }, // PDF Text vs PDF
        { cvIndex: 1, offerIndex: 1 }, // Image CV vs DOCX Offer
        { cvIndex: 2, offerIndex: 2 }, // PDF Scan vs DOCX Offer
        { cvIndex: 3, offerIndex: 0 }  // PDF Text vs PDF
    ];

    combinations.forEach(({ cvIndex, offerIndex }, i) => {
        const cv = cvs[cvIndex];
        const offer = offers[offerIndex];

        it(`Test #${i + 1} : Devrait matcher ${cv.name} avec ${offer.name}`, () => {
            cy.log(`Démarrage du matching : CV=${cv.name} | OFFRE=${offer.name}`);

            // 1. Upload Offre
            cy.contains('h4', 'Fiche de Poste')
                .closest('.flex-col')
                .find('input[type="file"]')
                .selectFile(offer.path, { force: true });
            
            // 2. Upload CV
            cy.contains('h4', 'Profil du Candidat')
                .closest('.flex-col')
                .find('input[type="file"]')
                .selectFile(cv.path, { force: true });

            // 3. Lancer le matching
            cy.contains('button', 'Générer le Matching').should('not.be.disabled').click();

            // 4. Attendre et Vérifier le résultat dans la liste
            cy.contains('.group', cv.name, { timeout: 120000 })
                .should('be.visible')
                .should('contain', '%');
            
            // On clique sur la carte pour voir les détails
            cy.contains('.group', cv.name).click({ force: true });
            cy.wait(2000);

            // 5. Vérifier le Score et les Popins (Scoping z-100 pour la vue détaillée)
            cy.get('.fixed.z-\\[100\\]').first().within(() => {
                cy.contains('Rapport de Matching', { timeout: 20000 }).should('be.visible');
                cy.contains('% Match').should('be.visible');
                
                // Popin Offre
                cy.contains('button', /Voir l'offre/i).click();
            });

            // L'aperçu de l'offre n'a pas de z-index spécifique mais est au-dessus
            cy.contains('h2', /Offre :/i, { timeout: 10000 }).should('be.visible');
            cy.contains('button', /Fermer l'aperçu/i).click(); 
            cy.wait(1500);
            
            // Popin Candidat (Scoping z-200)
            cy.get('.fixed.z-\\[100\\]').first().contains('button', /Voir candidat/i).click();
            cy.wait(1500); 

            cy.get('.fixed.z-\\[200\\]').first().within(() => {
                cy.contains('h4', /Parcours Professionnel/i, { timeout: 15000 })
                    .scrollIntoView({ block: 'center' })
                    .should('be.visible');
                
                cy.contains('h4', /Formation/i)
                    .scrollIntoView({ block: 'center' })
                    .should('be.visible');
                
                // Fermeture de la modale candidat via son bouton X
                cy.get('button').find('svg.lucide-x').parent().first().click({ force: true });
            });
            cy.wait(1000);

            // 6. Vérifier le verdict final (Back to z-100)
            cy.get('.fixed.z-\\[100\\]').first().within(() => {
                cy.contains('Verdict du Chasseur de Têtes').scrollIntoView({ block: 'center' }).should('be.visible');
                
                // Fermeture de la vue détaillée
                cy.get('button').find('svg.lucide-x').parent().first().click({ force: true });
            });
            cy.wait(1000);

            // 7. Retourner à une nouvelle analyse
            cy.contains('button', /Nouvelle analyse/i).click();
            cy.wait(2000);
        });
    });
});
