describe('Feedback Page', () => {
    const userID = 'testUserID';  // Example user ID for simulation
  
    beforeEach(() => {
      // Simulate a logged-in user by setting the localStorage
      window.localStorage.setItem('currentUser', JSON.stringify({ userID }));
  
      // Mock API response for fetching feedbacks
      cy.intercept('GET', '/api/feedback/searchFeedback', {
        statusCode: 200,
        body: {
          feedbacks: [
            {
              _id: '1',
              title: 'Great feedback',
              username: 'JohnDoe',
              description: 'This is some feedback',
              rating: 4,
              likes: 10,
              dislikes: 2,
              likedBy: [userID],
              dislikedBy: []
            }
          ],
          total: 1
        }
      }).as('fetchFeedbacks');
    });
  
    it('should load the Feedback Page correctly when logged in', () => {
      cy.visit('/feedbacks');  // Adjust to your Feedback page URL
      
      // Verify that feedbacks are loaded correctly
      cy.contains('Feedbacks..');
      cy.get('input[type="search"]').should('be.visible');
      cy.get('button').contains('Add Feedback').should('be.visible');
    });
  
    it('should not allow feedback submission if not logged in', () => {
      // Simulate a logged-out user by removing the user from localStorage
      window.localStorage.removeItem('currentUser');
  
      cy.visit('/feedbacks');
      
      // Try to add feedback without being logged in
      cy.get('button').contains('Add Feedback').click();
      
      // Check that the user sees an error message to log in
      cy.contains('Please log in to add feedback');
    });
  
    it('should allow feedback submission when logged in', () => {
      cy.visit('/feedbacks');
      
      // Simulate adding feedback as a logged-in user
      cy.get('button').contains('Add Feedback').click();
      cy.get('input[placeholder="Title"]').type('Test Feedback');
      cy.get('input[placeholder="Username"]').type('JaneDoe');
      cy.get('textarea[placeholder="Description"]').type('This is a test feedback description');
      cy.get('button').contains('Save').click();
  
      cy.contains('Feedback added successfully');
    });
  
    it('should show a toast message when trying to add feedback while not logged in', () => {
      // Simulate logged-out state
      window.localStorage.removeItem('currentUser');
  
      cy.visit('/feedbacks');
      
      // Simulate clicking the Add Feedback button without being logged in
      cy.get('button').contains('Add Feedback').click();
  
      // Ensure the toast message is shown
      cy.contains('Please log in to add feedback');
    });
  
    it('should load the Feedback Page correctly', () => {
      cy.visit('/feedbacks');  // Change to your Feedback page URL
      
      cy.contains('Feedbacks..');
      cy.get('input[type="search"]').should('be.visible');
      cy.get('button').contains('Add Feedback').should('be.visible');
    });
  
    it('should search feedbacks correctly', () => {
      cy.visit('/feedbacks');
      
      cy.get('input[type="search"]').type('Great');
      cy.wait('@fetchFeedbacks');
      
      cy.get('.feedback-list-6789').should('have.length', 1);
    });
  
    it('should open the Add Feedback modal when clicked', () => {
      cy.visit('/feedbacks');
      
      cy.get('button').contains('Add Feedback').click();
      cy.get('input[placeholder="Title"]').should('be.visible');
      cy.get('input[placeholder="Username"]').should('be.visible');
      cy.get('textarea[placeholder="Description"]').should('be.visible');
    });
  
    it('should submit the Add Feedback form', () => {
      cy.visit('/feedbacks');
      
      cy.get('button').contains('Add Feedback').click();
      cy.get('input[placeholder="Title"]').type('Test Feedback');
      cy.get('input[placeholder="Username"]').type('JaneDoe');
      cy.get('textarea[placeholder="Description"]').type('This is a test feedback description');
      cy.get('button').contains('Save').click();
  
      cy.contains('Feedback added successfully');
    });
  
    it('should like a feedback', () => {
      cy.visit('/feedbacks');
      
      // Simulate liking a feedback
      cy.get('button')
        .contains('Like')
        .click();
      
      cy.contains('Like 1');  // The like count should now show 11
    });
  
    it('should dislike a feedback', () => {
      cy.visit('/feedbacks');
      
      // Simulate disliking a feedback
      cy.get('button')
        .contains('Dislike')
        .click();
      
    });
  
    it('should paginate feedbacks correctly', () => {
      cy.visit('/feedbacks');
      
      // Simulate pagination
      cy.get('.ant-pagination-item-2').click();
      cy.get('.feedback-list-6789').should('have.length', 1);
    });
  
    it('should open the Edit Feedback modal and submit the form', () => {
      cy.visit('/feedbacks');
      
      // Simulate opening the edit modal
      cy.get('.feedback-card-6789').first().find('button').contains('Edit').click();
      cy.get('input[placeholder="Title"]').should('have.value', 'Great feedback');
      cy.get('textarea[placeholder="Description"]').should('have.value', 'This is some feedback');
      
      cy.get('button').contains('Update').click();
      cy.contains('Feedback updated successfully');
    });
  
    
  });
  