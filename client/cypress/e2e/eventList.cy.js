// cypress/e2e/EventViewPage.cy.js
import moment from 'moment';

describe("Event View Page", () => {
  // --- Mock Data ---
  const mockEventId = "EVT123456";
  const mockEvent = { /* ... */ _id: "event1_mongo_id", eventId: mockEventId, eventName: "Summer Music Festival", eventType: "Music", price: 5000, description: "Annual summer festival...", baseImage: "/images/festival_detail.jpg", eventDate: new Date("2024-08-15T00:00:00.000Z").toISOString() };
  const mockUserCredentials = { email: "event.viewer@example.com", password: "password123" };
  const mockUserLoginResponse = { /* ... */ _id: "userviewer_mongo_id", userID: "EVENTVIEWER01", firstName: "Event", lastName: "Viewer", email: mockUserCredentials.email, username: "eventviewer" };

  // --- Test Setup ---
  beforeEach(() => {
    cy.log("Setting up test: Logging in and intercepting API calls");
    // Login & Intercepts... (same as before)
    cy.intercept("POST", "/api/user/login", { statusCode: 200, body: { message: "Login successful", user: mockUserLoginResponse } }).as("loginRequest");
    cy.visit("/login");
    cy.get('input[type="email"]').type(mockUserCredentials.email);
    cy.get('input[type="password"]').type(mockUserCredentials.password);
    cy.get('button[type="submit"]').click();
    cy.wait("@loginRequest");
    cy.intercept("GET", `/api/event/getEvent/${mockEventId}`, { statusCode: 200, body: { event: mockEvent } }).as("getEventDetails");
    cy.intercept("POST", `/api/event/reserveEvent/${mockEventId}`, { statusCode: 201, body: { message: "Booking successful" } }).as("reserveEvent");
    cy.intercept("POST", "/api/reminder/setReminder", { statusCode: 201, body: { message: "Reminder set successfully" } }).as("setReminder");
    cy.visit(`/events/${mockEventId}`);
    cy.wait("@getEventDetails");
  });

  // --- Test Cases ---

  it("1. should load and display event details correctly", () => { /* ... passes ... */ });

  // --- Test 2: Fixed Selectors ---
  it("2. should open reservation modal when 'Reserve' is clicked", () => {
    cy.log("Testing opening reservation modal");
    cy.contains("button", "Reserve").click();

    cy.get(".custom-event-reservation-modal")
      .should('be.visible')
      .within(() => {
        cy.get(".ant-modal-title").contains("Reserve Event").should("be.visible");

        // --- Try Targeting by ID (Antd default: matches Form.Item name) ---
        cy.get("input#name").should("be.visible"); // Assumes id="name"
        cy.get("input#email").should("be.visible"); // Assumes id="email"
        cy.get("input#phone").should("be.visible"); // Assumes id="phone"
        // For DatePicker, target the input *inside* the antd picker structure
        cy.get(".ant-picker input#eventDate").should("be.visible"); // Assumes id="eventDate"

        // --- Fallback: Targeting by placeholder if ID fails ---
        // cy.get("input[placeholder='Enter your name']").should("be.visible"); // Adjust placeholder text if needed
        // cy.get("input[placeholder='Enter your email']").should("be.visible");
        // cy.get("input[placeholder='Enter your phone number']").should("be.visible");
        // cy.get("input[placeholder='Select date']").should("be.visible"); // Date picker input placeholder

        cy.get(".total-cost").should("contain", `Total Cost: Rs ${mockEvent.price}`);
        cy.get(".ant-modal-footer button").contains("Cancel").should("be.visible");
        cy.get(".ant-modal-footer button.custom-submit-button").should("be.visible");
    });
  });

     // --- Test 3: Check Wrap Visibility ---
  it("3. should successfully submit the reservation form", () => {
    cy.log("Testing successful reservation");
    const reservationDetails = {
      name: "Cypress Visibility Check",
      email: "visible.check@cypress.io",
      phone: "1231231234", // 10 digits
      eventDate: moment().add(25, 'days').format('YYYY-MM-DD'),
    };

    cy.contains("button", "Reserve").click(); // Open modal

    // Fill form
    cy.get(".custom-event-reservation-modal").should('be.visible').within(() => {
      cy.get("input#name").type(reservationDetails.name);
      cy.get("input#email").type(reservationDetails.email);
      cy.get("input#phone").type(reservationDetails.phone);
      cy.get(".ant-picker input#eventDate").click({ force: true });
    });
    cy.get('body').find(`.ant-picker-cell[title="${reservationDetails.eventDate}"]`).not('.ant-picker-cell-disabled').click();

    // Click Reserve button
    cy.get(".custom-event-reservation-modal .ant-modal-footer button.custom-submit-button").click();

    // Wait for API call
    cy.wait("@reserveEvent").its('request.body').should('deep.include', {
        guestName: reservationDetails.name,
        userID: mockUserLoginResponse.userID
    });

    // Check success message appears
    cy.contains(".ant-message-notice-content", "Booking successful!", { timeout: 6000 })
      .should("be.visible");

    // *** THE FIX: Wait for the modal WRAPPER to become non-visible ***
    // This assertion waits until the closing animation likely finishes and the
    // wrapper gets display:none or similar.
    cy.get('.ant-modal-wrap', { timeout: 6000 }).should('not.be.visible');

    // Optional: You can add the 'not.exist' check *after* the 'not.be.visible'
    // check passes, just to be extra sure, but it might be redundant.
    // cy.get(".custom-event-reservation-modal").should("not.exist");
  });
  // --- Test 4: Fixed Selectors ---
  it("4. should show validation errors for invalid reservation form input", () => {
    cy.log("Testing reservation form validation");
    cy.contains("button", "Reserve").click();

    // Attempt empty submission
    cy.get(".custom-event-reservation-modal").should('be.visible').within(() => {
        cy.get(".ant-modal-footer button.custom-submit-button").click();

        // Check validation errors using Antd's structure targeting the Form.Item by the input's ID
        cy.get(".ant-form-item-has-error #name").parents('.ant-form-item').find(".ant-form-item-explain-error").should('contain', 'Please enter your name');
        cy.get(".ant-form-item-has-error #email").parents('.ant-form-item').find(".ant-form-item-explain-error").should('contain', 'Please enter your email');
        cy.get(".ant-form-item-has-error #phone").parents('.ant-form-item').find(".ant-form-item-explain-error").should('contain', 'Please enter your phone number');
        cy.get(".ant-form-item-has-error #eventDate").parents('.ant-form-item').find(".ant-form-item-explain-error").should('contain', 'Please select an event date');


        // Enter invalid data using ID selectors
        cy.get("input#name").type("OK");
        cy.get("input#email").type("invalid-email");
        cy.get("input#phone").type("123"); // Too short
        // Click date input to open picker
        cy.get(".ant-picker input#eventDate").click({ force: true });
    });

    // Select a past date
    const pastDate = moment().subtract(5, 'days').format('YYYY-MM-DD');
    cy.get('body').find(`.ant-picker-cell[title="${pastDate}"]`).click();

    // Click reserve again
    cy.get(".custom-event-reservation-modal .ant-modal-footer button.custom-submit-button").click();

    // Check specific validation errors again using ID targeting for the parent Form.Item
    cy.get(".custom-event-reservation-modal").within(() => {
        cy.get(".ant-form-item-has-error #email").parents('.ant-form-item').find(".ant-form-item-explain-error").should('contain', 'Please enter a valid email');
        cy.get(".ant-form-item-has-error #phone").parents('.ant-form-item').find(".ant-form-item-explain-error").should('contain', 'Phone number must be exactly 10 digits long');
        cy.get(".ant-form-item-has-error #eventDate").parents('.ant-form-item').find(".ant-form-item-explain-error").should('contain', 'Event date must be a future date');
    });

    // Ensure API call was not made
    cy.get('@reserveEvent.all').should('have.length', 0);
  });


  it("5. should successfully set a reminder", () => { /* ... unchanged ... */ });
  it("6. should show error if setting reminder without selecting a date", () => { /* ... unchanged ... */ });
  it("7. should display 'Event not found' message if API returns 404", () => { /* ... unchanged ... */ });
});