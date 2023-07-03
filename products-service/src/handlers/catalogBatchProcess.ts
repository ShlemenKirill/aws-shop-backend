import { SQSEvent } from "aws-lambda";
import { createProduct } from "../services/database.service";
import { PostNewProductDto, ProductWithCount } from "../models/product";
import { buildResponse } from "../utils/utils";
import { v4 as uuid } from "uuid";
import {
  SNSClient,
  PublishCommand,
  PublishCommandInput,
} from "@aws-sdk/client-sns";
const sns = new SNSClient({ region: "eu-central-1" });

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

      const snsParams: PublishCommandInput = {
        Subject: "New created product",
        Message: `A new product was created: ${JSON.stringify(product)}`,
        TopicArn: process.env.SNS_TOPIC_ARN,
        MessageAttributes: {
          price: {
            DataType: "Number",
            StringValue: product?.count ? product?.count.toString() : "0",
          },
        },
      };
      await createProduct(product);
      const result = await sns.send(new PublishCommand(snsParams));
      console.log("Message published to SNS:", result.MessageId);
    }
    return buildResponse(200, products);
  } catch (error: any) {
    console.log("Error", error.message);
    return buildResponse(500, {
      message: error.message,
    });
  }
};
