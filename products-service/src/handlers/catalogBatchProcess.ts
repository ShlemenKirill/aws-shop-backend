import { SQSEvent } from "aws-lambda";
import { createProduct } from "../services/database.service";
import { PostNewProductDto, ProductWithCount } from "../models/product";
import { buildResponse } from "../utils/utils";
import { v4 as uuid } from "uuid";

export const handler = async (event: SQSEvent) => {
  try {
    console.log("Batch process start", event);
    const products = [];
    for (const record of event.Records) {
      console.log("record", record);
      const { title, description, price, count } = JSON.parse(
        record.body
      ) as PostNewProductDto;
      if (
        !title ||
        !description ||
        isNaN(Number(price)) ||
        isNaN(Number(count))
      ) {
        console.log("Invalid parameters", record.body);
        return buildResponse(400, "Invalid parameters");
      }
      const product: ProductWithCount = {
        id: uuid(),
        title,
        description,
        price,
        count,
      };
      products.push(product);
      // Create the product in the DynamoDB table
      await createProduct(product);
    }
    return buildResponse(200, products);
  } catch (error: any) {
    console.log("Error", error.message);
    return buildResponse(500, {
      message: error.message,
    });
  }
};
