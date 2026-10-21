"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FastLogger = void 0;
const webhook_logger_1 = require("./webhook.logger");
class FastLogger {
    static info(msg) {
        console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`);
    }
    static success(msg) {
        console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`);
    }
    static warn(msg) {
        console.warn(`\x1b[33m[WARN]\x1b[0m ${msg}`);
    }
    static error(msg, err) {
        console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`, err ?? "");
        webhook_logger_1.WebhookLogger.logError(msg, err).catch(() => { });
    }
}
exports.FastLogger = FastLogger;
