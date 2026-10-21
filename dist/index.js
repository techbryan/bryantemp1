"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./database/connection");
const bot_gateway_1 = require("./core/gateway/bot.gateway");
const logger_1 = require("./core/logger/logger");
const persistence_worker_1 = require("./core/workers/persistence.worker");
async function main() {
    await (0, connection_1.initDatabase)();
    const bot = new bot_gateway_1.BotGateway();
    await bot.start();
    logger_1.FastLogger.info("One Tap Voice Manager is active");
}
process.on("SIGINT", async () => {
    await persistence_worker_1.PersistenceWorkerQueue.flush();
    process.exit(0);
});
process.on("SIGTERM", async () => {
    await persistence_worker_1.PersistenceWorkerQueue.flush();
    process.exit(0);
});
process.on("unhandledRejection", (reason) => {
    logger_1.FastLogger.error("Unhandled Promise Rejection", reason);
});
process.on("uncaughtException", (err) => {
    logger_1.FastLogger.error("Uncaught Exception — initiating graceful process exit", err);
    process.exit(1);
});
main().catch((err) => {
    logger_1.FastLogger.error("Fatal error during bootstrap", err);
    process.exit(1);
});
