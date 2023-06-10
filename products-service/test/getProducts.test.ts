import { buildResponse } from "../src/utils/utils";
import { handler } from "../src/handlers/getProductsList";
import { products } from "../src/mocks/products";
import { APIGatewayProxyEvent } from "aws-lambda";

jest.mock("../src/utils/utils", () => ({
  buildResponse: jest.fn(),
}));
describe("handler", () => {
  it("should return a successful response with products", async () => {
    const expectedResponse = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
      body: JSON.stringify(products),
    };
    (buildResponse as jest.Mock).mockReturnValueOnce(expectedResponse);

    const result = await handler();

    expect(result).toEqual(expectedResponse);
  });
});
