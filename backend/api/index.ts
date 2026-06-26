import type { IncomingMessage, ServerResponse } from "node:http";
import mongoose from "mongoose";
import { createApp } from "../src/app";
import { connectDatabase } from "../src/config/db";

// The Express app is built once per warm serverless instance.
const app = createApp();

// Cache the Mongo connection across invocations on the same instance so we
// don't open a new connection on every request (serverless best practice).
let dbPromise: Promise<unknown> | null = null;
async function ensureDb(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  if (!dbPromise) dbPromise = connectDatabase();
  await dbPromise;
}

// Vercel/Node serverless handler. Express apps are themselves (req, res)
// handlers, so we just delegate to it after ensuring the DB is connected.
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    await ensureDb();
  } catch {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({ success: false, message: "Database connection failed" }),
    );
    return;
  }
  (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(
    req,
    res,
  );
}
