import {buildResponse} from "../utils/utils";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {products} from "../mocks/products";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try{
        const productId = event.pathParameters?.id
        if(!productId) {
            return buildResponse(500, {
                message: 'Product ID is missing'
            })
        }
        const product = products.find((prod) => prod.id === productId)
        if(!product) {
            return buildResponse(500, {
                message: 'Product is not found'
            })
        }
        return buildResponse(200, {
            product: product
        })
    }catch (error: any){
        return buildResponse(500, {
            message: error.message
        })
    }
}
