import { handler } from "../src/handlers/getProductById";
import { APIGatewayProxyEvent } from "aws-lambda";
import { products } from "../src/mocks/products";
import { TEST_EVENT } from "./constants";

describe("handler", () => {
  let mockEvent: APIGatewayProxyEvent;

  beforeEach(() => {
    mockEvent = {
      ...TEST_EVENT,
    };
  });

  it("should return the product when a valid ID is provided", async () => {
    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify(products[0]));
  });

  it("should return an error response when the product ID is missing", async () => {
    mockEvent.pathParameters = null;
    const expectedErrorMessage = "Product ID is missing";

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe(JSON.stringify({ message: expectedErrorMessage }));
  });

  it("should return an error response when the product is not found", async () => {
    mockEvent = {
      ...mockEvent,
      pathParameters: {
        id: "not-existing-id",
      },
    };
    const expectedErrorMessage = "Product is not found";

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe(JSON.stringify({ message: expectedErrorMessage }));
  });

  it("should return an error response when an exception is thrown", async () => {
    const expectedErrorMessage = "Some error message";
    jest.spyOn(products, "find").mockImplementation(() => {
      throw new Error(expectedErrorMessage);
    });

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe(JSON.stringify({ message: expectedErrorMessage }));
  });
});
