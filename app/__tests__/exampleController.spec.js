const { refactoreMe1  } = require('../controllers/exampleController');
const db = require('../models');

jest.mock('../models', () => {
  return {
    sequelize: {
      query: jest.fn(),
      QueryTypes: {
        SELECT: 'SELECT',
      },
    },
  };
});

describe('refactoreMe1 function', () => {
  let mockRequest, mockResponse;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockRequest = {}; // Mock request object
    mockResponse = {
      status: jest.fn().mockReturnThis(), // Mock response status method
      send: jest.fn() // Mock response send method
    };
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear all mocks after each test to avoid data interference
  });

  it('should return average values for each index', async () => {
    // Arrange: Mock the database query result
    db.sequelize.query.mockResolvedValue([
      [
        { values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
        { values: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
      ]
    ]);

    // Act: Call the function
    await refactoreMe1(mockRequest, mockResponse);

    // Assert: Check the correct response is sent
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalledWith({
      statusCode: 200,
      success: true,
      data: [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5]
    });
  });

  it('should return 500 error when an exception occurs', async () => {
    // Arrange: Mock the database query to throw an error
    db.sequelize.query.mockRejectedValue(new Error('DB error'));

    // Act: Call the function
    await refactoreMe1(mockRequest, mockResponse);

    // Assert: Check the error response is sent
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.send).toHaveBeenCalledWith({
      statusCode: 500,
      success: false,
      message: 'An error occurred while processing the survey data.'
    });
  });
});