describe('User Profile Page', () => {
    const mockUser = {
      userID: 'testUserID',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      username: 'johndoe',
      profilePic: 'https://example.com/profile.jpg',
      userType: 'Employee', // You can change to 'Admin' or other types as needed
    };
  
    beforeEach(() => {
      // Mock the localStorage to simulate a logged-in user
      window.localStorage.setItem('currentUser', JSON.stringify(mockUser));
  
      // Intercept the API calls
      cy.intercept('GET', '/api/event/getEvents', { statusCode: 200, body: { events: [] } }).as('fetchEvents');
      cy.intercept('GET', '/api/room/getRooms', { statusCode: 200, body: { rooms: [] } }).as('fetchRooms');
      cy.intercept('GET', '/api/room/getBookings', { statusCode: 200, body: { bookings: [] } }).as('fetchBookings');
      cy.visit('/userProfile'); // Visit the User Profile page
    });
  
    it('should render the User Profile correctly', () => {
      cy.get('.profile-card-1234').should('be.visible');
      cy.get('h3').should('contain', `${mockUser.firstName} ${mockUser.lastName}`);
      cy.get('p').should('contain', mockUser.userType);
      cy.get('img').should('have.attr', 'src', mockUser.profilePic); // Check if profile pic is displayed
    });
  
    it('should show tabs and navigate through them', () => {
      cy.get('.ant-tabs-tab').should('have.length', 8); // Check the number of tabs
      cy.get('.ant-tabs-tab').contains('Rooms').click(); // Click on the Rooms tab
      cy.url().should('include', '/rooms'); // Assuming that the rooms component is rendered when clicked
    });
  
    it('should open edit modal and save changes', () => {
      cy.get('.edit-button-1234').click(); // Click on the Edit Profile button
      cy.get('input[name="firstName"]').clear().type('Jane'); // Change first name
      cy.get('input[name="lastName"]').clear().type('Smith'); // Change last name
      cy.get('input[name="email"]').clear().type('jane.smith@example.com'); // Change email
      cy.get('input[name="username"]').clear().type('janesmith'); // Change username
      cy.get('input[type="file"]').attachFile('profile-pic.jpg'); // Attach a new profile picture file (make sure this file is in the fixtures folder)
      cy.get('.save-button-1234').click(); // Click Save
  
      // Verify that the save was successful and the profile is updated
      cy.contains('Profile updated successfully').should('be.visible');
      cy.get('h3').should('contain', 'Jane Smith'); // Verify the name has been updated
      cy.get('p').should('contain', 'janesmith'); // Verify the username has been updated
    });
  
    it('should show a toast message when there is an error saving the profile', () => {
      // Simulate an error in saving the profile
      cy.intercept('POST', 'http://localhost:5000/api/user/updateUser', {
        statusCode: 500,
        body: { message: 'Failed to update profile' },
      }).as('saveProfileError');
  
      cy.get('.edit-button-1234').click(); // Open edit modal
      cy.get('input[name="firstName"]').clear().type('Jane');
      cy.get('.save-button-1234').click(); // Try saving
  
      cy.wait('@saveProfileError');
      cy.contains('Failed to update profile').should('be.visible'); // Verify error message
    });
  
    it('should show the correct tabs based on user type', () => {
      cy.get('.ant-tabs-tab').contains('Leaves').should('be.visible'); // Employee users should see the "Leaves" tab
      cy.get('.ant-tabs-tab').contains('Salary Details').should('be.visible'); // Employee users should see the "Salary Details" tab
  
      // Change to an admin user
      mockUser.userType = 'Admin';
      window.localStorage.setItem('currentUser', JSON.stringify(mockUser));
      cy.reload(); // Reload to apply changes
  
      cy.get('.ant-tabs-tab').contains('Leaves').should('not.exist'); // Admin users should not see the "Leaves" tab
      cy.get('.ant-tabs-tab').contains('Salary Details').should('not.exist'); // Admin users should not see the "Salary Details" tab
    });
  
    it('should show Meal Orders tab for specific email', () => {
      // Simulate a user with a specific email to see the Meal Orders tab
      mockUser.email = 'cheff@gmail.com';
      window.localStorage.setItem('currentUser', JSON.stringify(mockUser));
      cy.reload(); // Reload the page
  
      cy.get('.ant-tabs-tab').contains('Meal Orders').should('be.visible'); // Check that "Meal Orders" tab is visible for the specified email
    });
  
    it('should handle file upload for profile picture', () => {
      cy.get('.edit-button-1234').click(); // Open the edit modal
      cy.get('input[type="file"]').attachFile('profile-pic.jpg'); // Upload a new profile picture
      cy.get('.save-button-1234').click(); // Save the changes
  
      cy.contains('Profile updated successfully').should('be.visible');
      cy.get('img').should('have.attr', 'src').and('include', 'profile-pic.jpg'); // Check if the new profile picture is displayed
    });
  
    it('should handle cancel button in the edit modal', () => {
      cy.get('.edit-button-1234').click(); // Open the edit modal
      cy.get('.cancel-button-1234').click(); // Click Cancel to close the modal
  
      // Verify that the modal is closed and no changes were made
      cy.get('.edit-modal-1234').should('not.exist'); // Check if modal is not visible anymore
    });
  
  });
  
  