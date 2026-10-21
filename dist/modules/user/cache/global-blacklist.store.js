"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalBlacklistStore = void 0;
const global_blacklist_schema_1 = require("../../../database/schemas/global-blacklist.schema");
const logger_1 = require("../../../core/logger/logger");
class GlobalBlacklistStore {
    static userBlacklist = new Set();
    static serverBlacklist = new Set();
    static loaded = false;
    static async preload() {
        if (this.loaded)
            return;
        try {
            const records = await global_blacklist_schema_1.GlobalBlacklistModel.find().lean();
            for (const item of records) {
                if (item.type === "user") {
                    this.userBlacklist.add(item.targetId);
                }
                else if (item.type === "server") {
                    this.serverBlacklist.add(item.targetId);
                }
            }
            this.loaded = true;
        }
        catch (err) {
            logger_1.FastLogger.error("GlobalBlacklistStore.preload failed", err);
        }
    }
    static isUserBlacklisted(userId) {
        return this.userBlacklist.has(userId);
    }
    static isServerBlacklisted(serverId) {
        return this.serverBlacklist.has(serverId);
    }
    static async addUser(userId, reason) {
        this.userBlacklist.add(userId);
        try {
            await global_blacklist_schema_1.GlobalBlacklistModel.updateOne({ targetId: userId }, { targetId: userId, type: "user", reason, addedAt: new Date() }, { upsert: true }).exec();
        }
        catch (err) {
            logger_1.FastLogger.error("GlobalBlacklistStore.addUser failed", { userId, reason, err });
        }
    }
    static async removeUser(userId) {
        this.userBlacklist.delete(userId);
        try {
            await global_blacklist_schema_1.GlobalBlacklistModel.deleteOne({ targetId: userId, type: "user" }).exec();
        }
        catch (err) {
            logger_1.FastLogger.error("GlobalBlacklistStore.removeUser failed", { userId, err });
        }
    }
    static getUserBlacklist() {
        return Array.from(this.userBlacklist);
    }
    static async addServer(serverId, reason) {
        this.serverBlacklist.add(serverId);
        try {
            await global_blacklist_schema_1.GlobalBlacklistModel.updateOne({ targetId: serverId }, { targetId: serverId, type: "server", reason, addedAt: new Date() }, { upsert: true }).exec();
        }
        catch (err) {
            logger_1.FastLogger.error("GlobalBlacklistStore.addServer failed", { serverId, reason, err });
        }
    }
    static async removeServer(serverId) {
        this.serverBlacklist.delete(serverId);
        try {
            await global_blacklist_schema_1.GlobalBlacklistModel.deleteOne({ targetId: serverId, type: "server" }).exec();
        }
        catch (err) {
            logger_1.FastLogger.error("GlobalBlacklistStore.removeServer failed", { serverId, err });
        }
    }
    static getServerBlacklist() {
        return Array.from(this.serverBlacklist);
    }
}
exports.GlobalBlacklistStore = GlobalBlacklistStore;
