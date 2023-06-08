import {Product} from "../models/product";
import {putProducts} from "../services/dynamoDB.service";
import {TEST_UUID_1, TEST_UUID_2} from "../constants";

const testProducts: Product[] = [
    {
        id: TEST_UUID_1,
        title: 'iPhone 12',
        description: 'iPhone 12 description',
        price: 400
    },
    {
        id: TEST_UUID_2,
        title: 'iPhone 11',
        description: 'iPhone 11 description',
        price: 300
    }
]

const fillTableWithTestProducts = async () => {
    for (const item of testProducts) {
        try {
            await putProducts(item)
            console.log(`Successfully inserted item with ID ${item.id}`);
        } catch (error) {
            console.error(`Error inserting item with ID ${item.id}:`, error);
        }
    }
};

fillTableWithTestProducts().catch()
