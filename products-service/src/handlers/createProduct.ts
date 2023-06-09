import { buildResponse } from "../utils/utils";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuid } from 'uuid';
import {putProducts} from '../services/dynamoDB.service'
import {PostNewProductDto, Product} from "../models/product";

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        if(event?.body) {
            const { title, description, price} = JSON.parse(event.body) as PostNewProductDto;
            if(!title || !description || isNaN(Number(price))) {
                return buildResponse(400, 'Invalid parameters');
            }
            const product: Product = {
                id: uuid(),
                title,
                description,
                price
            }
            await putProducts(product)
            return buildResponse(200, product);
        }
        return buildResponse(400, 'Missing required fields');
    } catch (error: any) {
        return buildResponse(500, {
            message: error.message,
        });
    }
};
