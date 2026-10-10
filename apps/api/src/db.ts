import dotenv from "dotenv";
import { Pool } from "pg";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const currentDir = dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: resolve(currentDir, "../.env"),
});

const password = process.env.DB_PASSWORD;

if (!password) {
  throw new Error(
    "DB_PASSWORD missing. Check apps/api/.env file."
  );
}

export const pool = new Pool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? "linksentry_db",
  user: process.env.DB_USER ?? "postgres",
  password,
  max: 10,
  connectionTimeoutMillis: 5000,
});