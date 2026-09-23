describe('Login Page', () => {
    beforeEach(() => {
        cy.visit('/login'); // Visit the login page
    });

    it('should load the login page correctly', () => {
        cy.contains('Hi, Welcome Back').should('be.visible'); // Check title
        cy.contains('Enter your credentials to continue').should('be.visible'); // Check subtitle
        cy.get('input[type="email"]').should('be.visible'); // Email input
        cy.get('input[type="password"]').should('be.visible'); // Password input
        cy.get('button[type="submit"]').contains('Login').should('be.visible'); // Submit button
        cy.get('input[type="checkbox"]').should('be.visible'); // Remember me checkbox
        cy.contains('Forgot Password?').should('be.visible'); // Forgot password link
        cy.contains('Sign up').should('be.visible'); // Signup link
    });

    // it('should show error when required fields are empty', () => {
    //     cy.get('button[type="submit"]').click(); // Submit empty form
    //     cy.contains('Something went wrong. Please try again.').should('be.visible'); // Generic error from catch block
    // });

    it('should show error for invalid credentials', () => {
        cy.intercept('POST', 'http://localhost:5000/api/user/login', {
            statusCode: 401,
            body: { message: 'Invalid email or password' },
        }).as('loginRequest');

        cy.get('input[type="email"]').type('wrong@example.com');
        cy.get('input[type="password"]').type('wrongpassword');
        cy.get('button[type="submit"]').click();

        cy.contains('Invalid email or password').should('be.visible');
    });

    it('should login successfully as a regular user and navigate to home', () => {
        cy.intercept('POST', 'http://localhost:5000/api/user/login', {
            statusCode: 200,
            body: {
                message: 'Login successful',
                user: { userType: 'User', email: 'test@example.com' },
            },
        }).as('loginRequest');

        cy.get('input[type="email"]').type('test@example.com');
        cy.get('input[type="password"]').type('password123');
        cy.get('button[type="submit"]').click();

        cy.contains('Login Successful!').should('be.visible');
        cy.url().should('eq', 'http://localhost:3000/'); // Redirect to home
        cy.window().its('localStorage.currentUser').should('exist');
    });

    it('should login successfully as an admin and navigate to admin dashboard', () => {
        cy.intercept('POST', 'http://localhost:5000/api/user/login', {
            statusCode: 200,
            body: {
                message: 'Login successful',
                user: { userType: 'Admin', email: 'admin@example.com' },
            },
        }).as('loginRequest');

        cy.get('input[type="email"]').type('admin@example.com');
        cy.get('input[type="password"]').type('admin123');
        cy.get('button[type="submit"]').click();

        cy.contains('Login Successful!').should('be.visible');
        cy.url().should('eq', 'http://localhost:3000/admin/'); // Redirect to admin dashboard
        cy.window().its('localStorage.currentUser').should('exist');
    });

    it('should toggle password visibility', () => {
        cy.get('input[type="password"]').should('have.attr', 'type', 'password');
        cy.get('.sg_custom_password_toggle').click();
        cy.get('input[type="text"]').should('exist'); // Password field becomes text
        cy.get('.sg_custom_password_toggle').click();
        cy.get('input[type="password"]').should('exist'); // Back to password
    });

    it('should navigate to signup page when signup link is clicked', () => {
        cy.contains('Sign up').click();
        cy.url().should('eq', 'http://localhost:3000/signup'); // Assuming signup link points to "/"
    });

    it('should navigate to forgot password page when forgot password link is clicked', () => {
        cy.contains('Forgot Password?').click();
        cy.url().should('eq', 'http://localhost:3000/'); // Assuming forgot password link points to "/"
    });
});