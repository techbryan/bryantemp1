"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AliasStore = void 0;
const user_alias_schema_1 = require("../../../database/schemas/user-alias.schema");
const logger_1 = require("../../../core/logger/logger");
class AliasStore {
    static cache = new Map();
    static MAX_ENTRIES = 5000;
    static makeKey(guildId, userId) {
        return `${guildId}:${userId}`;
    }
    static setBounded(key, value) {
        if (this.cache.size >= this.MAX_ENTRIES && !this.cache.has(key)) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey)
                this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }
    static async getAliases(guildId, userId) {
        const key = this.makeKey(guildId, userId);
        const cached = this.cache.get(key);
        if (cached)
            return cached;
        const map = new Map();
        try {
            const record = await user_alias_schema_1.UserAliasModel.findOne({ guildId, userId }).maxTimeMS(2000).lean();
            if (record?.aliases) {
                for (const [k, v] of Object.entries(record.aliases)) {
                    if (typeof v === "string") {
                        map.set(k.toLowerCase(), v.toLowerCase());
                    }
                }
            }
        }
        catch (err) {
            logger_1.FastLogger.error("AliasStore.getAliases failed", { guildId, userId, err });
        }
        this.setBounded(key, map);
        return map;
    }
    static async resolve(guildId, userId, alias) {
        const map = await this.getAliases(guildId, userId);
        return map.get(alias.toLowerCase());
    }
    static async addAlias(guildId, userId, alias, targetCommand) {
        const map = await this.getAliases(guildId, userId);
        const lowerAlias = alias.toLowerCase();
        const lowerTarget = targetCommand.toLowerCase();
        if (map.size >= 5 && !map.has(lowerAlias)) {
            return { success: false, reason: "Max limit of 5 aliases reached." };
        }
        map.set(lowerAlias, lowerTarget);
        const key = this.makeKey(guildId, userId);
        this.setBounded(key, map);
        const plainObject = {};
        for (const [k, v] of Array.from(map.entries())) {
            plainObject[k] = v;
        }
        try {
            await user_alias_schema_1.UserAliasModel.updateOne({ guildId, userId }, { aliases: plainObject }, { upsert: true }).exec();
        }
        catch (err) {
            logger_1.FastLogger.error("AliasStore.addAlias failed", { guildId, userId, alias, err });
        }
        return { success: true };
    }
    static async removeAlias(guildId, userId, alias) {
        const map = await this.getAliases(guildId, userId);
        const lowerAlias = alias.toLowerCase();
        if (!map.has(lowerAlias))
            return false;
        map.delete(lowerAlias);
        const key = this.makeKey(guildId, userId);
        this.setBounded(key, map);
        const plainObject = {};
        for (const [k, v] of Array.from(map.entries())) {
            plainObject[k] = v;
        }
        try {
            await user_alias_schema_1.UserAliasModel.updateOne({ guildId, userId }, { aliases: plainObject }, { upsert: true }).exec();
        }
        catch (err) {
            logger_1.FastLogger.error("AliasStore.removeAlias failed", { guildId, userId, alias, err });
        }
        return true;
    }
}
exports.AliasStore = AliasStore;
