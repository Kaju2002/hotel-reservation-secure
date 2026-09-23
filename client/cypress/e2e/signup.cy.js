describe('Signup Page', () => {
    beforeEach(() => {
      cy.visit('/signup');  // Visit the signup page
    });
  
    it('should load the signup page correctly', () => {
      cy.contains('Sign up'); // Check if the title exists
      cy.get('input[name="firstName"]').should('be.visible');
      cy.get('input[name="lastName"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="username"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('input[name="confirmPassword"]').should('be.visible');
      cy.get('input[name="profilePic"]').should('be.visible');
      cy.get('input[name="agreeToTerms"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });
  
    it('should show error when required fields are empty', () => {
      // Try submitting the form with empty fields
      cy.get('button[type="submit"]').click();
  
      // Check if error messages appear
      cy.contains('Please fill in all required fields.');
    });
  
    it('should show error if passwords do not match', () => {
      // Fill in the form with mismatched passwords
      cy.get('input[name="firstName"]').type('John');
      cy.get('input[name="lastName"]').type('Doe');
      cy.get('input[name="email"]').type('john.doe@example.com');
      cy.get('input[name="username"]').type('john_doe');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password456');
      cy.get('button[type="submit"]').click();
  
      // Check if the password mismatch error appears
      cy.contains('Passwords do not match.');
    });
  
    it('should show error if terms are not agreed to', () => {
      // Fill in the form and leave the agree to terms checkbox unchecked
      cy.get('input[name="firstName"]').type('John');
      cy.get('input[name="lastName"]').type('Doe');
      cy.get('input[name="email"]').type('john.doe@example.com');
      cy.get('input[name="username"]').type('john_doe');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password123');
      cy.get('button[type="submit"]').click();
  
      // Check if the terms agreement error appears
      cy.contains('You must agree to the terms and conditions.');
    });
  
    it('should show error if profile picture is not uploaded', () => {
      // Fill in the form without uploading a profile picture
      cy.get('input[name="firstName"]').type('John');
      cy.get('input[name="lastName"]').type('Doe');
      cy.get('input[name="email"]').type('john.doe@example.com');
      cy.get('input[name="username"]').type('john_doe');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password123');
      cy.get('input[name="agreeToTerms"]').check();  // Agree to terms
      cy.get('button[type="submit"]').click();
  
      // Check if the profile picture error appears
      cy.contains('Please upload a profile picture.');
    });
  
    it('should submit the form successfully with valid data', () => {
      // Fill in the form with valid data
      cy.get('input[name="firstName"]').type('John');
      cy.get('input[name="lastName"]').type('Doe');
      cy.get('input[name="email"]').type('john.doe@example.com');
      cy.get('input[name="username"]').type('john_doe');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password123');
  
      // Attach the profile picture
      cy.get('input[name="profilePic"]').selectFile('cypress/fixtures/profilepic.jpg');
  
      cy.get('input[name="agreeToTerms"]').check(); // Agree to terms
  
      // Mock the API call for a successful signup
      cy.intercept('POST', '/api/user/signup', {
        statusCode: 201,
        body: {
          message: 'User created successfully.',
          user: { username: 'john_doe' },
        },
      }).as('signupRequest');
  
      // Click submit button
      cy.get('button[type="submit"]').click();
  
      // Wait for the API request to complete
      cy.wait('@signupRequest');
  
      // Check if the success message appears
      cy.contains('User created successfully.', { timeout: 10000 }); // Wait up to 10 seconds for the message to appear
  
      // Check if the user is redirected to the home page
      cy.url().should('eq', 'http://localhost:3000/');
    });
  });
  