import express from "express";
import { env } from "./config/env.js";
import { runMigrations } from "./db/index.js";
import { healthRouter } from "./routes/health.js";
import { errorHandler } from "./shared/errors.js";
import { logger } from "./shared/logger.js";

runMigrations();

const app = express();
app.use(express.json());
app.use(healthRouter);
app.use(errorHandler);

app.listen(env.port, () => {
  logger.info(`API listening on :${env.port}`);
});
