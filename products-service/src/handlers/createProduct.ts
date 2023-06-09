import { buildResponse } from "../utils/utils";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuid } from 'uuid';
import {createProduct} from '../services/database.service'
import {PostNewProductDto, ProductWithCount} from "../models/product";

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    console.log('Create a new product:', event)
    try {
        if(event?.body) {
            const { title, description, price, count} = JSON.parse(event.body) as PostNewProductDto;
            if(!title || !description || isNaN(Number(price)) || isNaN(Number(count))) {
                return buildResponse(400, 'Invalid parameters');
            }
            const product: ProductWithCount = {
                id: uuid(),
                title,
                description,
                price,
                count
            }
            await createProduct(product)
            return buildResponse(200, product);
        }
        return buildResponse(400, 'Missing required fields');
    } catch (error: any) {
        return buildResponse(500, {
            message: error.message,
        });
    }
};
