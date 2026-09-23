// describe('Parking Page', () => {
//   const mockUser = {
//     userID: 'testUserID',
//     firstName: 'John',
//     lastName: 'Doe',
//     email: 'john.doe@example.com', // Make sure email is included for gate pass
//     username: 'johndoe',
//   };

//   const mockAvailability = ['B1', 'B2', 'C21', 'C22']; // Mock available parking slots
//   const mockPrice = 500; // Mock price for the parking slot B1

//   beforeEach(() => {
//     // Mock the localStorage to simulate a logged-in user
//     // Ensure the email is part of the stored user object as the component uses it
//     window.localStorage.setItem('currentUser', JSON.stringify(mockUser));

//     // Intercept the API calls
//     // Use query parameters in the matcher for more specificity if needed, though often not required if path is unique
//     cy.intercept('GET', '/api/parking/availability*', {
//       statusCode: 200,
//       body: mockAvailability,
//     }).as('fetchAvailability');

//     cy.intercept('POST', '/api/parking/book', {
//       statusCode: 200,
//       body: { success: true, message: 'Parking slot booked successfully.' }, // Use the actual backend message if possible
//     }).as('bookParkingSlot');

//     // *** ADDED: Intercept the gate pass call ***
//     cy.intercept('POST', '/api/parking/send-gatepass', {
//       statusCode: 200,
//       body: { success: true, message: 'Gate pass sent.' }, // Mock response for gate pass
//     }).as('sendGatePass');

//     cy.visit('/parking'); // Visit the Parking Page
//   });

//   it('should load the Parking Page correctly', () => {
//     // Don't wait for fetchAvailability here, as it only triggers *after* date selection
//     // Check initial elements are present
//     cy.get('.parking-page1244').should('be.visible');
//     cy.get('.date-picker-container1244').should('be.visible');
//     // The availability grid might not be visible until a date is selected, adjust if needed
//     // cy.get('.availability-grid1244').should('not.exist'); // Or check it's hidden/empty initially
//     cy.get('input[type="date"].date-picker1244').should('be.visible');
//     cy.get('button.book-now-btn1244').should('be.disabled'); // Check initial button state too
//   });

//   it('should display available parking slots for the selected date', () => {
//     cy.get('input[type="date"].date-picker1244').type('2023-05-15'); // Select a date
//     cy.wait('@fetchAvailability'); // Wait for the availability to be fetched *after* date selection

//     // Check if the availability grid is now visible
//     cy.get('.availability-grid1244').should('be.visible');

//     // Check if the available slots are displayed with the correct class
//     cy.get('.availability-grid1244')
//       .find('.cell1244.available1244')
//       .should('have.length', mockAvailability.length);

//     // Check the content of specific available slots if needed (more robust)
//     cy.get('.availability-grid1244').contains('.cell1244.available1244', 'B1');
//     cy.get('.availability-grid1244').contains('.cell1244.available1244', 'C22');

//     // Check that the slot dropdown is populated
//      cy.get('select.slot-select1244 option')
//        .should('have.length', mockAvailability.length + 1); // +1 for the disabled default option
//      cy.get('select.slot-select1244').select('B1'); // Check if selection works
//   });

//   it('should display the correct price based on selected slot and duration', () => {
//     // Select a date and wait for availability
//     cy.get('input[type="date"].date-picker1244').type('2023-05-15');
//     cy.wait('@fetchAvailability');

//     // Select a slot (Bike slot)
//     cy.get('select.slot-select1244').select('B1');
//     cy.get('select.duration-select1244').select('Full day');
//     // Check price (using the mockPrice for B1, full day)
//     cy.get('.price-display1244').should('contain', `Price: LKR ${mockPrice}`); // 500 for B1 full day

//     // Select different duration
//     cy.get('select.duration-select1244').select('12 hours');
//     cy.get('.price-display1244').should('contain', `Price: LKR ${mockPrice * 0.75}`); // 375

//     // Select different duration
//     cy.get('select.duration-select1244').select('6 hours');
//     cy.get('.price-display1244').should('contain', `Price: LKR ${mockPrice * 0.5}`); // 250

//     // Select a Car slot
//      cy.get('select.slot-select1244').select('C21');
//      cy.get('select.duration-select1244').select('Full day');
//      cy.get('.price-display1244').should('contain', `Price: LKR ${1000}`); // Assuming 1000 for Car full day
//   });

//   it('should show an error message if vehicle number is invalid', () => {
//     cy.get('input[type="date"].date-picker1244').type('2023-05-15'); // Select a date
//     cy.wait('@fetchAvailability'); // Wait for availability

//     // Select a slot and duration
//     cy.get('select.slot-select1244').select('B1');
//     cy.get('select.duration-select1244').select('Full day');

//     // Enter an invalid vehicle number
//     cy.get('input.vehicle-number-input1244').type('ABC12'); // Invalid

//     // Attempt to book
//     cy.get('button.book-now-btn1244').click();

//     // *** UPDATED: Check for antd error message ***
//     cy.get('.ant-message-error').should('be.visible');
//     // Optionally check content more specifically
//     cy.get('.ant-message-error .ant-message-content')
//       .should('contain', 'Vehicle number must have exactly 3 capital letters followed by 4 digits');
//   });

//   it('should book a parking slot successfully', () => {
//     cy.get('input[type="date"].date-picker1244').type('2023-05-15'); // Select a date
//     cy.wait('@fetchAvailability'); // Wait for availability

//     // Select a slot and duration
//     cy.get('select.slot-select1244').select('B1');
//     cy.get('select.duration-select1244').select('Full day');

//     // Enter a valid vehicle number
//     cy.get('input.vehicle-number-input1244').type('ABC1234');

//     // Click the "Book Now" button
//     cy.get('button.book-now-btn1244').click();

//     // Wait for the booking and gate pass responses
//     cy.wait('@bookParkingSlot');
//     cy.wait('@sendGatePass'); // *** ADDED: Wait for gate pass call ***

//     // *** UPDATED: Check for antd success messages ***
//     // Check for booking success message
//      cy.get('.ant-message-success')
//        .should('contain', 'Parking slot booked successfully.');
//     // Check for gate pass success message (might appear separately or merged)
//     // Adjust selector/contain text based on how antd displays multiple messages
//      cy.get('.ant-message-success')
//        .should('contain', 'Gate pass sent to your email.');

//      // Also check if form fields were reset (as per component logic)
//      cy.get('input.vehicle-number-input1244').should('have.value', '');
//      cy.get('select.slot-select1244').should('have.value', ''); // Should reset to the default empty value
//      cy.get('input[type="date"].date-picker-form-1244').should('have.value', ''); // Should reset date in form

//   });

//   // This test passed originally, should still pass.
//   it('should disable the booking button if no date is selected', () => {
//     // Ensure no date is selected initially
//     cy.get('input[type="date"].date-picker1244').should('have.value', '');
//     // Check if the button is disabled
//     cy.get('button.book-now-btn1244').should('be.disabled');
//     // Check other form fields are also disabled
//      cy.get('input.vehicle-number-input1244').should('be.disabled');
//      cy.get('select.slot-select1244').should('be.disabled');
//      cy.get('select.duration-select1244').should('be.disabled');
//   });

//   it('should show a message if no parking slots are available for the selected date', () => {
//     // Mock the response to simulate no available slots
//     cy.intercept('GET', '/api/parking/availability*', {
//       statusCode: 200,
//       body: [], // Return empty array
//     }).as('fetchNoAvailability');

//     // No need to visit again if it's the same page, just trigger the fetch
//     cy.get('input[type="date"].date-picker1244').type('2023-05-16'); // Select a different date to ensure fetch
//     cy.wait('@fetchNoAvailability');

//     // *** UPDATED: Check the actual component state ***
//     // Check that the slot dropdown only contains the default disabled option
//     cy.get('select.slot-select1244 option').should('have.length', 1); // Only the "Select the slot" option
//     cy.get('select.slot-select1244 option[value=""]').should('exist'); // Verify it's the disabled one
//     cy.get('select.slot-select1244').should('contain', 'Select the slot');

//     // Optionally, check that the grid shows no available slots (all booked)
//     cy.get('.availability-grid1244').find('.cell1244.available1244').should('not.exist');
//     cy.get('.availability-grid1244').find('.cell1244.booked1244').should('have.length.greaterThan', 0); // Ensure grid rendered with booked slots
//   });
// });

// cypress/integration/ParkingPage.cy.js (or your chosen path)

describe("Parking Page", () => {
  const mockUser = {
    userID: "testUserID",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com", // Ensure email is included for gate pass
    username: "johndoe",
  };

  const mockAvailability = ["B1", "B2", "C21", "C22"];
  const bikeFullDayPrice = 500;
  const carFullDayPrice = 1000;

  // *** FIX: Use a date guaranteed to be in the future ***
  const getFutureDateString = () => {
    const today = new Date();
    const futureDate = new Date(today.setDate(today.getDate() + 7)); // 7 days in the future
    // Format as YYYY-MM-DD
    const year = futureDate.getFullYear();
    const month = String(futureDate.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(futureDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  let testDate; // Will be set in beforeEach

  beforeEach(() => {
    // Set the future date string for this test run
    testDate = getFutureDateString();

    // Mock localStorage
    window.localStorage.setItem("currentUser", JSON.stringify(mockUser));

    // Intercept API Calls
    cy.intercept("GET", "/api/parking/availability*", {
      statusCode: 200,
      body: mockAvailability,
    }).as("fetchAvailability");

    cy.intercept("POST", "/api/parking/book", {
      statusCode: 200,
      body: { success: true, message: "Parking slot booked successfully." },
    }).as("bookParkingSlot");

    cy.intercept("POST", "/api/parking/send-gatepass", {
      statusCode: 200,
      body: { success: true, message: "Gate pass sent to your email." },
    }).as("sendGatePass");

    // Visit the Parking Page
    cy.visit("/parking");
  });

  it("should load the Parking Page correctly with form disabled initially", () => {
    cy.get(".parking-page1244").should("be.visible");
    cy.get(".date-picker-container1244").should("be.visible");
    cy.get(".no-date-selected1244").should("be.visible");
    cy.get("button.book-now-btn1244").should("be.disabled");
    cy.get("input.vehicle-number-input1244").should("be.disabled");
  });

  it("should enable form, fetch and display available slots when a future date is selected", () => {
    // Select the future date
    cy.get('input[type="date"].date-picker1244').type(testDate);
    cy.wait("@fetchAvailability");

    cy.get(".no-date-selected1244").should("not.exist");
    cy.get(".availability-grid1244").should("be.visible");
    cy.get(".availability-grid1244 .cell1244.available1244").should(
      "have.length",
      mockAvailability.length
    );
    cy.get("button.book-now-btn1244").should("not.be.disabled");
    cy.get("input.vehicle-number-input1244").should("not.be.disabled");
    cy.get("select.slot-select1244").should("not.be.disabled");
    cy.get("select.slot-select1244 option").should(
      "have.length",
      mockAvailability.length + 1
    );
  });

  it("should display the correct price based on selected slot and duration", () => {
    cy.get('input[type="date"].date-picker1244').type(testDate);
    cy.wait("@fetchAvailability");

    cy.get("select.slot-select1244").select("B1");
    cy.get("select.duration-select1244").select("Full day");
    cy.get(".price-display1244").should(
      "contain",
      `Price: LKR ${bikeFullDayPrice}`
    );

    cy.get("select.duration-select1244").select("12 hours");
    cy.get(".price-display1244").should(
      "contain",
      `Price: LKR ${bikeFullDayPrice * 0.75}`
    );

    cy.get("select.slot-select1244").select("C21");
    cy.get("select.duration-select1244").select("6 hours");
    cy.get(".price-display1244").should(
      "contain",
      `Price: LKR ${carFullDayPrice * 0.5}`
    );
  });

  it("should show an error message if vehicle number is invalid", () => {
    cy.get('input[type="date"].date-picker1244').type(testDate);
    cy.wait("@fetchAvailability");

    cy.get("select.slot-select1244").select("B1");
    cy.get("select.duration-select1244").select("Full day");
    cy.get("input.vehicle-number-input1244").type("INVALID"); // Invalid format

    cy.get("button.book-now-btn1244").click();

    // *** FIX: Use a more reliable selector for the Antd message ***
    // Option 1: Target the content container
    // cy.get('.ant-message-notice-content')
    //   .should('be.visible')
    //   .and('contain', 'Vehicle number must have exactly 3 capital letters followed by 4 digits');

    // Option 2: Target by text (simpler if text is unique)
    cy.contains(
      "Vehicle number must have exactly 3 capital letters followed by 4 digits"
    ).should("be.visible");

    // Verify booking API was NOT called
    cy.get("@bookParkingSlot.all").should("have.length", 0);
  });

  it("should show an error message if date is in the past", () => {
    const pastDate = "2020-01-01";

    // Intercept again just for this test if needed, or rely on default mock
    // cy.intercept('GET', '/api/parking/availability*', { statusCode: 200, body: mockAvailability }).as('fetchForPastDate');

    // Select past date
    cy.get('input[type="date"].date-picker1244').type(pastDate);
    cy.wait("@fetchAvailability"); // Wait for fetch triggered by date change

    // Fill form even though date is invalid
    cy.get("input.vehicle-number-input1244").type("DEF4567");
    cy.get("select.slot-select1244").select("B2"); // Select an available slot from mock
    cy.get("select.duration-select1244").select("Full day");

    // Attempt to book
    cy.get("button.book-now-btn1244").click();

    // Check for the specific past date error message
    cy.contains("Please select a valid date.").should("be.visible");

    cy.get("@bookParkingSlot.all").should("have.length", 0); // Booking should not proceed
  });

  it("should book a parking slot successfully and clear the form", () => {
    // Select the future date
    cy.get('input[type="date"].date-picker1244').type(testDate);
    cy.wait("@fetchAvailability");

    const vehicleNumber = "XYZ7890";
    const selectedSlot = "C21";
    const selectedDuration = "12 hours";
    const expectedPrice = carFullDayPrice * 0.75;

    cy.get("input.vehicle-number-input1244").type(vehicleNumber);
    cy.get("select.slot-select1244").select(selectedSlot);
    cy.get("select.duration-select1244").select(selectedDuration);
    cy.get(".price-display1244").should(
      "contain",
      `Price: LKR ${expectedPrice}`
    );

    cy.get("button.book-now-btn1244").click();

    // *** FIX: Now the wait should succeed because the date is valid ***
    cy.wait("@bookParkingSlot").then((interception) => {
      expect(interception.request.body).to.deep.equal({
        vehicleNumber,
        parkingSlot: selectedSlot,
        date: testDate, // Use the dynamic future date
        duration: selectedDuration,
        userID: mockUser.userID,
        Price: expectedPrice,
      });
    });

    cy.wait("@sendGatePass");

    // Check for success messages
    cy.contains("Parking slot booked successfully.").should("be.visible");
    cy.contains("Gate pass sent to your email.").should("be.visible");

    // Verify form fields are cleared/reset
    cy.get("input.vehicle-number-input1244").should("have.value", "");
    // Corrected line
    cy.get("select.slot-select1244")
      .find("option:selected") // Find the actual selected <option> element
      .should("have.value", ""); // Check its value attribute is ""      cy.get('input[type="date"].date-picker-form-1244').should('have.value', '');
    cy.get("select.duration-select1244").should("have.value", "Full day");
    cy.get(".price-display1244").should("contain", "Price: LKR 0");

    // Verify availability was fetched again (total 2 fetches)
    cy.get("@fetchAvailability.all").should("have.length", 2);
  });

  it("should handle the case where no parking slots are available", () => {
    cy.intercept("GET", "/api/parking/availability*", {
      statusCode: 200,
      body: [], // No slots available
    }).as("fetchNoAvailability");

    cy.get('input[type="date"].date-picker1244').type(testDate);
    cy.wait("@fetchNoAvailability");

    cy.get(".availability-grid1244").should("be.visible");
    cy.get(".availability-grid1244 .cell1244.available1244").should(
      "not.exist"
    );
    cy.get(".availability-grid1244 .cell1244.booked1244").should(
      "have.length",
      50
    ); // Assuming 50 total

    cy.get("select.slot-select1244 option").should("have.length", 1);
    cy.get('select.slot-select1244 option[value=""]').should("be.disabled");
  });
});
