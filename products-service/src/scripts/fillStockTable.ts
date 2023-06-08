import {putStockItem} from "../services/dynamoDB.service";
import {Stock} from "../models/stock.model";
import {TEST_UUID_1, TEST_UUID_2} from "../constants";

const testStockItems: Stock[] = [
    {
        product_id: TEST_UUID_1,
        count: 133
    },
    {
        product_id: TEST_UUID_2,
        count: 143
    }
]

const fillTableWithTestStockItems = async () => {
    for (const item of testStockItems) {
        try {
            await putStockItem(item)
            console.log(`Successfully inserted item with ID ${item.product_id}`);
        } catch (error) {
            console.error(`Error inserting item with ID ${item.product_id}:`, error);
        }
    }
};

fillTableWithTestStockItems().catch()
