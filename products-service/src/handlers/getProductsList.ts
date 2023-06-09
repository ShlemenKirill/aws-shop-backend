import { buildResponse } from "../utils/utils";
import { getAllProducts } from "../services/database.service";

export const handler = async () => {
  console.log('Get products')
  try {
    const productsList = await getAllProducts();
    if(productsList) {
      return buildResponse(200, productsList);
    }
    return []
  } catch (error: any) {
    return buildResponse(500, {
      message: error.message,
    });
  }
};
