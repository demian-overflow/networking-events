import pg from "pg";
import { config } from "./config.mjs";

const pool = new pg.Pool(config.db);

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
