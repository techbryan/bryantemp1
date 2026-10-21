"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotDeveloperStore = void 0;
const bot_developer_schema_1 = require("../../../database/schemas/bot-developer.schema");
const env_1 = require("../../../core/config/env");
const logger_1 = require("../../../core/logger/logger");
class BotDeveloperStore {
    static developers = new Set();
    static loaded = false;
    static getMainDevIds() {
        return new Set(env_1.ENV.DEVID.split(/[\s,]+/).filter(Boolean));
    }
    static async preload() {
        if (this.loaded)
            return;
        try {
            const records = await bot_developer_schema_1.BotDeveloperModel.find().lean();
            for (const item of records) {
                this.developers.add(item.userId);
            }
            this.loaded = true;
        }
        catch (err) {
            logger_1.FastLogger.error("BotDeveloperStore.preload failed", err);
        }
    }
    static isDeveloper(userId) {
        if (this.getMainDevIds().has(userId))
            return true;
        return this.developers.has(userId);
    }
    static isMainDev(userId) {
        return this.getMainDevIds().has(userId);
    }
    static async addDeveloper(userId, addedBy) {
        this.developers.add(userId);
        try {
            await bot_developer_schema_1.BotDeveloperModel.updateOne({ userId }, { userId, addedBy, addedAt: new Date() }, { upsert: true }).exec();
        }
        catch (err) {
            logger_1.FastLogger.error("BotDeveloperStore.addDeveloper failed", { userId, addedBy, err });
        }
    }
    static async removeDeveloper(userId) {
        this.developers.delete(userId);
        try {
            await bot_developer_schema_1.BotDeveloperModel.deleteOne({ userId }).exec();
        }
        catch (err) {
            logger_1.FastLogger.error("BotDeveloperStore.removeDeveloper failed", { userId, err });
        }
    }
    static getDeveloperList() {
        return Array.from(this.developers);
    }
}
exports.BotDeveloperStore = BotDeveloperStore;
