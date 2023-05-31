import {buildResponse} from "../utils/utils";
import {products} from "../mocks/products";

export const handler = async () => {
    try{
        return buildResponse(200, products)
    }catch (error: any){
        return buildResponse(500, {
            message: error.message
        })
    }
}
