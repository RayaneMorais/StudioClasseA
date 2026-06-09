import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Test DB connection at startup so we know immediately if it fails
pool.connect((err, client, release) => {
  if (err) {
    logger.error({ err: { message: err.message, code: (err as any).code, stack: err.stack } }, "DB connection failed at startup");
  } else {
    logger.info("DB connection OK");
    release();
  }
});

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
