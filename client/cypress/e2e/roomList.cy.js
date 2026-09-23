describe('Room List Page', () => {
    const mockRooms = [
      {
        _id: '1',
        roomType: 'Deluxe Room',
        roomNumber: '101',
        size: 2,
        price: 3000,
        bedType: 'King Size',
        facilities: ['WiFi', 'Air Conditioning'],
        imageUrl: 'https://example.com/deluxe-room.jpg',
        status: 'Activate',
      },
      {
        _id: '2',
        roomType: 'Standard Room',
        roomNumber: '102',
        size: 2,
        price: 2000,
        bedType: 'Queen Size',
        facilities: ['WiFi', 'TV'],
        imageUrl: 'https://example.com/standard-room.jpg',
        status: 'Activate',
      },
    ];
  
    const mockBestSelling = [
      {
        _id: '3',
        roomType: 'Premium Room',
        price: 5000,
        imageUrl: 'https://example.com/premium-room.jpg',
      },
      {
        _id: '4',
        roomType: 'Suite Room',
        price: 7000,
        imageUrl: 'https://example.com/suite-room.jpg',
      },
    ];
  
    const mockReservations = [
      {
        roomNumber: '101',
        userID: 'testUserID',
        bookingDate: '2025-05-01',
      },
    ];
  
    beforeEach(() => {
      // Mock the API responses
      cy.intercept('GET', '/api/room/getRooms', {
        statusCode: 200,
        body: { rooms: mockRooms },
      }).as('fetchRooms');
  
      cy.intercept('GET', '/api/room/getBestSelling', {
        statusCode: 200,
        body: { rooms: mockBestSelling },
      }).as('fetchBestSelling');
  
      cy.intercept('GET', '/api/room/getBookings', {
        statusCode: 200,
        body: { bookings: mockReservations },
      }).as('fetchBookings');
  
      // Visit the Room List page
      cy.visit('/rooms');
    });
  
    it('should load the Room List page correctly', () => {
      cy.wait('@fetchRooms');
      cy.wait('@fetchBestSelling');
      cy.wait('@fetchBookings');
  
      // Ensure rooms are rendered
      cy.get('.room-list').should('be.visible');
      cy.get('.room').should('have.length', mockRooms.length);
  
      // Check if the first room is displayed correctly
      cy.get('.room').first().within(() => {
        cy.get('h2').should('contain', mockRooms[0].roomType);
        cy.get('p').should('contain', `Rs: ${mockRooms[0].price}`);
        cy.get('button').should('contain', 'More Info');
      });
    });
  
    it('should search rooms correctly', () => {
      cy.get('input[type="text"]').type('Deluxe Room');
  
      // Wait for the filtering to apply and check if the correct room is displayed
      cy.get('.room').should('have.length', 1);
      cy.get('.room').first().within(() => {
        cy.get('h2').should('contain', 'Deluxe Room');
      });
    });
  
    it('should navigate to room details when "More Info" is clicked', () => {
      // Mock a user being logged in by setting the localStorage
      window.localStorage.setItem('currentUser', JSON.stringify({ userID: 'testUserID' }));
  
      // Click the "More Info" button on the first room
      cy.get('.room').first().find('button').click();
  
      // Check if the URL is correct and includes the room ID
      cy.url().should('include', '/rooms/1');
    });
  
    it('should disable "More Info" button for booked rooms', () => {
      // Mock a room being booked by having the roomNumber in the reservations array
      cy.get('.room').first().within(() => {
        cy.get('button')
          .should('be.disabled')
          .and('contain', 'Already Booked'); // Check that the button is disabled and shows "Already Booked"
      });
    });
  
    it('should show best-selling rooms and recommended rooms', () => {
      cy.wait('@fetchBestSelling');
      cy.wait('@fetchBookings');
  
      // Ensure best-selling rooms are shown
      cy.contains('Best Selling Rooms').should('be.visible');
      cy.get('.pkg_container').should('have.length', mockBestSelling.length);
  
      // Check that the "Recommended for You" section is displayed
      cy.contains('Recommended for You').should('be.visible');
      cy.get('.pkg_card').should('have.length', 2); // Last visited + similar rooms
  
      // Check that the suggested rooms are displayed correctly
      cy.get('.pkg_card').first().within(() => {
        cy.get('h3').should('contain', mockBestSelling[0].roomType);
      });
    });
  
    it('should handle error when rooms fail to load', () => {
      // Simulate an API failure for rooms
      cy.intercept('GET', '/api/room/getRooms', {
        statusCode: 500,
        body: { error: 'Failed to fetch rooms' },
      }).as('fetchRoomsError');
  
      cy.visit('/rooms');
      cy.wait('@fetchRoomsError');
  
      // Check for error handling message
      cy.contains('Failed to fetch rooms').should('be.visible');
    });
  });
  