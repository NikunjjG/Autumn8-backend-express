import { Pool, type QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  database: process.env.DB_DATABASE,
});

type QueryParam = string | number | boolean | Date | null;

export const query = (text: string, params?: QueryParam[]): Promise<QueryResult> => {
  return pool.query(text, params);
};