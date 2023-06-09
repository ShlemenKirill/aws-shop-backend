import { buildResponse } from "../utils/utils";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getProductById } from '../services/database.service'

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Get product:', event)
  try {
    const productId = event.pathParameters?.id;
    if (!productId) {
      return buildResponse(500, {
        message: "Product ID is missing",
      });
    }
    const product = await getProductById(productId);
    if (!product) {
      return buildResponse(500, {
        message: "Product is not found",
      });
    }
    return buildResponse(200, product);
  } catch (error: any) {
    return buildResponse(500, {
      message: error.message,
    });
  }
};
