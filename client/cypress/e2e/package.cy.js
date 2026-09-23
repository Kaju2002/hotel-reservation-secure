// cypress/e2e/PackagePage.cy.js (or your chosen path)

describe("Package Page", () => {
  // --- Mock Data ---
  const mockUserCredentials = {
    email: "test-package-user@example.com", // Use a specific mock email
    password: "password123",                 // Mock password
  };

  const mockUserLoginResponse = { // Simulate the user object your /login endpoint returns
    _id: "user_pkg_page_id",
    userID: "PKGUSER001",
    firstName: "Package",
    lastName: "Tester",
    email: mockUserCredentials.email,
    username: "packagetester",
    profilePic: null,
    userType: "Customer", // Ensure this type has access to /packages
    // Add any other necessary fields returned by your login
  };

  const mockPackages = [
    {
      _id: "pkg1_mongo_id", // Important: Use _id for navigation link
      packageId: "PKG0001",
      packageImage: "/images/mock_package1.jpg", // Use placeholder or real paths if needed
      packageName: "Weekend Getaway",
      description: "A lovely weekend trip.",
      size: 2,
      price: 15000,
      createdAt: new Date().toISOString(),
    },
    {
      _id: "pkg2_mongo_id",
      packageId: "PKG0002",
      packageImage: "/images/mock_package2.jpg",
      packageName: "Adventure Combo",
      description: "For the thrill-seekers.",
      size: 4,
      price: 25000,
      createdAt: new Date().toISOString(),
    },
  ];

  // --- Test Setup ---
  beforeEach(() => {
    cy.log("Setting up test: Logging in and intercepting API calls");

    // --- Intercept Login API ---
    cy.intercept("POST", "/api/user/login", { // *** ADJUST LOGIN API PATH IF NEEDED ***
      statusCode: 200,
      body: {
        message: "Login successful",
        user: mockUserLoginResponse, // Return mock user data
      },
    }).as("loginRequest");

    // --- Intercept Packages API (Default Success) ---
    // This intercept needs to be ready before the page visit
    cy.intercept("GET", "/api/package/getPackages", {
      statusCode: 200,
      body: { packages: mockPackages },
    }).as("getPackagesSuccess"); // Alias for waiting

    // --- Perform Programmatic Login via UI ---
    cy.visit("/login"); // *** ADJUST LOGIN PAGE URL IF NEEDED ***

    // *** ADJUST SELECTORS FOR YOUR LOGIN FORM ***
    cy.get('input[type="email"]').type(mockUserCredentials.email);
    cy.get('input[type="password"]').type(mockUserCredentials.password);
    cy.get('button[type="submit"]').click(); // Adjust if not type="submit"

    // Wait for the mocked login request to complete
    // This ensures authentication state (like localStorage) should be set by app logic
    cy.wait("@loginRequest");

    // --- AFTER LOGIN: Visit the target page ---
    cy.visit("/packages"); // *** ADJUST PACKAGES PAGE URL IF NEEDED ***

    // Wait for the packages data to be requested *on the packages page*
    cy.wait("@getPackagesSuccess");
  });

  // --- Test Cases ---

  it("1. should display the packages correctly after login", () => {
    cy.log("Checking initial package display");
    // No need to wait for getPackagesSuccess again, beforeEach handles it

    cy.get(".pkg_container").should("be.visible");
    cy.get(".pkg_card").should("have.length", mockPackages.length);

    // Check content of the first package card more thoroughly
    cy.get(".pkg_card")
      .first()
      .should("be.visible")
      .within(() => {
        cy.get(".pkg_image")
          .should("be.visible")
          .and("have.attr", "alt", mockPackages[0].packageName);
        cy.get(".pkg_title").should("contain", mockPackages[0].packageName);
        cy.get(".pkg_size").should("contain", `Size: ${mockPackages[0].size}`);
        cy.get(".pkg_price").should(
          "contain",
          `From Rs: ${mockPackages[0].price}`
        );
        cy.get(".pkg_button").should("contain", "More Info");
      });
  });

  it('2. should navigate to the package details page when "More Info" is clicked', () => {
    cy.log("Testing navigation on 'More Info' click");
    // No need to wait again

    cy.get(".pkg_card")
      .first()
      .find(".pkg_button")
      .click();

    // Assert URL change - This should now pass because the user is logged in
    cy.url().should("include", `/packages/${mockPackages[0]._id}`);
    cy.location("pathname").should("eq", `/packages/${mockPackages[0]._id}`);
  });

  it("3. should show an empty container if no packages are available", () => {
    cy.log("Testing empty state (no packages returned)");
    // Override the intercept for this specific test
    cy.intercept("GET", "/api/package/getPackages", {
      statusCode: 200,
      body: { packages: [] }, // Return an empty array
    }).as("getPackagesEmpty");

    // Re-visit the packages page AFTER login in beforeEach
    // This is necessary for the new intercept to take effect for this test
    cy.visit("/packages");
    cy.wait("@getPackagesEmpty");

    cy.get(".pkg_container").should("be.visible");
    cy.get(".pkg_card").should("not.exist"); // Check no cards rendered

    // Optional: Add check if you implemented the UI message
    // cy.contains('No packages available').should('be.visible');
  });

  it("4. should handle error when packages fail to load", () => {
    cy.log("Testing API error state");
    // Override the intercept to simulate a server error
    cy.intercept("GET", "/api/package/getPackages", {
      statusCode: 500,
      body: { message: "Failed to fetch packages" },
    }).as("getPackagesError");

    // Re-visit AFTER login in beforeEach
    cy.visit("/packages");
    cy.wait("@getPackagesError"); // Wait for the failed request

    cy.get(".pkg_container").should("be.visible");
    cy.get(".pkg_card").should("not.exist"); // Check no cards rendered

    // Optional: Add check if you implemented the UI error message
    // cy.contains('Failed to load packages').should('be.visible');
  });
});