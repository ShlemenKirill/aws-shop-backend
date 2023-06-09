import { Pool } from "pg";
import {Product, ProductWithCount} from "../models/product";
import { Stock } from "../models/stock.model";
import { PRODUCTS_TABLE_NAME, STOCK_TABLE_NAME } from "../constants";

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
});

export const getAllProducts = async (): Promise<ProductWithCount[]> => {
    const client = await pool.connect();
    try {
        const query = `
      SELECT p.*, s.count
      FROM ${PRODUCTS_TABLE_NAME} p
      JOIN ${STOCK_TABLE_NAME} s ON p.id = s.product_id
    `;
        const result = await client.query(query);
        return result.rows as ProductWithCount[];
    } finally {
        client.release();
    }
};

export const getProductById = async (id: string): Promise<Product> => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT * FROM ${PRODUCTS_TABLE_NAME} WHERE id = $1`,
            [id]
        );
        return result.rows[0] as Product;
    } finally {
        client.release();
    }
};

export const getStockItems = async (): Promise<Stock[]> => {
    const client = await pool.connect();
    try {
        const result = await client.query(`SELECT * FROM ${STOCK_TABLE_NAME}`);
        return result.rows as Stock[];
    } finally {
        client.release();
    }
};

export const createProduct = async (newProduct: ProductWithCount) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Start the transaction

        const createProductQuery = `INSERT INTO ${PRODUCTS_TABLE_NAME} (id, title, description, price) VALUES ($1, $2, $3, $4)`;
        const productValues = [newProduct.id, newProduct.title, newProduct.description, newProduct.price];
        await client.query(createProductQuery, productValues);

        const createStockQuery = `INSERT INTO ${STOCK_TABLE_NAME} (product_id, count) VALUES ($1, $2)`;
        const stockValues = [newProduct.id, newProduct.count];
        await client.query(createStockQuery, stockValues);

        await client.query('COMMIT'); // Commit the transaction
    } catch (error) {
        await client.query('ROLLBACK'); // Rollback the transaction in case of an error
        throw error;
    } finally {
        client.release();
    }
};

export const putStockItem = async (newStockItem: Stock) => {
    const client = await pool.connect();
    try {
        const query = `INSERT INTO ${STOCK_TABLE_NAME} (product_id, count) VALUES ($1, $2)`;
        const values = [newStockItem.product_id, newStockItem.count];
        await client.query(query, values);
    } finally {
        client.release();
    }
};
