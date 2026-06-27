import { Pool, type QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  console.log('Successfully connected to the PostgreSQL database pool.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

type QueryParam = string | number | boolean | Date | null;

export const query = (text: string, params?: QueryParam[]): Promise<QueryResult> => {
  return pool.query(text, params);
};