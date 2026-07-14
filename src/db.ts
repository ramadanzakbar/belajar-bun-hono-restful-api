import { PrismaClient } from "./generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";
import { logger } from "./applications/logging";

// Parse the DATABASE_URL connection string
const dbUrl = new URL(process.env.DATABASE_URL!);

const host = dbUrl.hostname;
const port = dbUrl.port ? parseInt(dbUrl.port) : 3306;
const user = dbUrl.username;
const password = decodeURIComponent(dbUrl.password);
const database = dbUrl.pathname.replace(/^\//, "");

// Initialize the driver adapter
const adapter = new PrismaMariaDb({
  host,
  port,
  user,
  password,
  database,
  connectionLimit: 10,
});

// Pass the adapter to the PrismaClient constructor
export const prisma = new PrismaClient({
  adapter,
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "error" },
    { emit: "event", level: "info" },
    { emit: "event", level: "warn" },
  ],
});

prisma.$on("query", (e) => {
  logger.info(e);
});

prisma.$on("error", (e) => {
  logger.error(e);
});

prisma.$on("info", (e) => {
  logger.info(e);
});

prisma.$on("warn", (e) => {
  logger.warn(e);
});
