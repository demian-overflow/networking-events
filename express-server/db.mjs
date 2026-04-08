import pg from "pg";
import { config } from "./config.mjs";

const poolConfig = { ...config.db };
if (process.env.DB_SSL !== undefined) {
  poolConfig.ssl = { rejectUnauthorized: false };
}
const pool = new pg.Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Unexpected pool error:", err.message);
});

export async function query(text, params) {
  return pool.query(text, params);
}

export async function getClient() {
  return pool.connect();
}

export async function closePool() {
  return pool.end();
}

export default pool;
