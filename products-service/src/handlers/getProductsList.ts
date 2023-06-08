import { buildResponse } from "../utils/utils";
import {getAllProducts, getStockItems} from "../services/dynamoDB.service";
import {ProductWithCount} from "../models/product";

export const handler = async () => {
  try {
    const productsList = await getAllProducts();
    const stockItems = await getStockItems();
    if(productsList && stockItems) {
      const joinedResponse: ProductWithCount[] = productsList.map((product) => {
        const stockItem = stockItems.find((stockItem) => stockItem.product_id === product.id)
        return {
            ...product,
          count: stockItem?.count ?? 0
        }
      })
      return buildResponse(200, joinedResponse);
    }
    return []
  } catch (error: any) {
    return buildResponse(500, {
      message: error.message,
    });
  }
};
