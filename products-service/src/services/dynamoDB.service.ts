import * as AWS from "aws-sdk";
import {Product} from "../models/product";
import {Stock} from "../models/stock.model";
import {PRODUCTS_TABLE_NAME, STOCK_TABLE_NAME} from "../constants";

AWS.config.update({ region: 'eu-central-1' })
const dynamoDB = new AWS.DynamoDB.DocumentClient();

export const getAllProducts = async (): Promise<Product[]> => {
    const scanResults = await dynamoDB.scan({
        TableName: PRODUCTS_TABLE_NAME
    }).promise();
    return scanResults.Items as Product[]
}

export const getProductById = async ( id: string ): Promise<Product> => {
    const queryResult =  await dynamoDB.get({
        TableName: PRODUCTS_TABLE_NAME,
        Key: {
            id: id
        }
    }).promise();
    return queryResult.Item as Product
}

export const getStockItems = async (): Promise<Stock[]> => {
    const scanResults = await dynamoDB.scan({
        TableName: STOCK_TABLE_NAME
    }).promise();
    return scanResults.Items as Stock[]
}

export const putProducts = async (newProduct: Product) => {
    const params = {
        TableName: PRODUCTS_TABLE_NAME,
        Item: newProduct,
    };
    return await dynamoDB.put(params).promise();
}

export const putStockItem = async (newStockItem: Stock) => {
    const params = {
        TableName: STOCK_TABLE_NAME,
        Item: newStockItem,
    };
    return await dynamoDB.put(params).promise();
}
