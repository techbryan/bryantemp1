"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.ENV = {
    TOKEN: process.env.DISCORD_TOKEN || "",
    CLIENT_ID: process.env.CLIENT_ID || "",
    MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/onetap",
    MONGO_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/onetap",
    DEFAULT_PREFIX: process.env.DEFAULT_PREFIX || ".v",
    WEBHOOK_LOG_URL: process.env.WEBHOOK_LOG_URL || "",
    DEVID: process.env.DEVID || "",
    AUTO_LOAD_EMOJIS: process.env.AUTO_LOAD_EMOJIS !== "false"
};
