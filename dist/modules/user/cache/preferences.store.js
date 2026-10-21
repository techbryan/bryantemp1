"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferencesStore = void 0;
const user_preferences_schema_1 = require("../../../database/schemas/user-preferences.schema");
const logger_1 = require("../../../core/logger/logger");
class PreferencesStore {
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
    static async preload() {
    }
    static getSync(guildId, userId) {
        const key = this.makeKey(guildId, userId);
        const cached = this.cache.get(key);
        if (cached)
            return cached;
        const fallback = {
            blacklist: new Set(),
            trusted: new Set(),
            whitelist: new Set()
        };
        this.setBounded(key, fallback);
        void this.fetchAsync(guildId, userId);
        return fallback;
    }
    static async fetchAsync(guildId, userId) {
        try {
            const record = await user_preferences_schema_1.UserPreferencesModel.findOne({ guildId, userId }).maxTimeMS(1000).lean();
            if (record) {
                this.setBounded(this.makeKey(guildId, userId), {
                    blacklist: new Set(record.blacklist || []),
                    trusted: new Set(record.trusted || []),
                    whitelist: new Set(record.whitelist || [])
                });
            }
        }
        catch (err) {
            logger_1.FastLogger.error("Failed to fetch user preferences asynchronously", err);
        }
    }
    static async get(guildId, userId) {
        const key = this.makeKey(guildId, userId);
        const cached = this.cache.get(key);
        if (cached)
            return cached;
        try {
            const record = await user_preferences_schema_1.UserPreferencesModel.findOne({ guildId, userId }).maxTimeMS(1000).lean();
            const data = {
                blacklist: new Set(record?.blacklist || []),
                trusted: new Set(record?.trusted || []),
                whitelist: new Set(record?.whitelist || [])
            };
            this.setBounded(key, data);
            return data;
        }
        catch (err) {
            logger_1.FastLogger.error("PreferencesStore.get failed", { guildId, userId, err });
            const fallback = {
                blacklist: new Set(),
                trusted: new Set(),
                whitelist: new Set()
            };
            this.setBounded(key, fallback);
            return fallback;
        }
    }
    static async addBlacklist(guildId, userId, targetId) {
        const prefs = await this.get(guildId, userId);
        prefs.blacklist.add(targetId);
        this.setBounded(this.makeKey(guildId, userId), prefs);
        try {
            await user_preferences_schema_1.UserPreferencesModel.updateOne({ guildId, userId }, { $addToSet: { blacklist: targetId } }, { upsert: true }).exec();
        }
        catch (err) {
            logger_1.FastLogger.error("PreferencesStore.addBlacklist failed", { guildId, userId, targetId, err });
        }
    }
    static async removeBlacklist(guildId, userId, targetId) {
        const prefs = await this.get(guildId, userId);
        if (!prefs.blacklist.has(targetId))
            return false;
        prefs.blacklist.delete(targetId);
        this.setBounded(this.makeKey(guildId, userId), prefs);
        try {
            await user_preferences_schema_1.UserPreferencesModel.updateOne({ guildId, userId }, { $pull: { blacklist: targetId } }, { upsert: true }).exec();
        }
        catch (err) {
            logger_1.FastLogger.error("PreferencesStore.removeBlacklist failed", { guildId, userId, targetId, err });
        }
        return true;
    }
    static async addTrusted(guildId, userId, targetId) {
        const prefs = await this.get(guildId, userId);
        prefs.trusted.add(targetId);
        this.setBounded(this.makeKey(guildId, userId), prefs);
        try {
            await user_preferences_schema_1.UserPreferencesModel.updateOne({ guildId, userId }, { $addToSet: { trusted: targetId } }, { upsert: true }).exec();
        }
        catch (err) {
            logger_1.FastLogger.error("PreferencesStore.addTrusted failed", { guildId, userId, targetId, err });
        }
    }
    static async removeTrusted(guildId, userId, targetId) {
        const prefs = await this.get(guildId, userId);
        if (!prefs.trusted.has(targetId))
            return false;
        prefs.trusted.delete(targetId);
        this.setBounded(this.makeKey(guildId, userId), prefs);
        try {
            await user_preferences_schema_1.UserPreferencesModel.updateOne({ guildId, userId }, { $pull: { trusted: targetId } }, { upsert: true }).exec();
        }
        catch (err) {
            logger_1.FastLogger.error("PreferencesStore.removeTrusted failed", { guildId, userId, targetId, err });
        }
        return true;
    }
    static async addWhitelist(guildId, userId, targetId) {
        const prefs = await this.get(guildId, userId);
        prefs.whitelist.add(targetId);
        this.setBounded(this.makeKey(guildId, userId), prefs);
        try {
            await user_preferences_schema_1.UserPreferencesModel.updateOne({ guildId, userId }, { $addToSet: { whitelist: targetId } }, { upsert: true }).exec();
        }
        catch (err) {
            logger_1.FastLogger.error("PreferencesStore.addWhitelist failed", { guildId, userId, targetId, err });
        }
    }
    static async removeWhitelist(guildId, userId, targetId) {
        const prefs = await this.get(guildId, userId);
        if (!prefs.whitelist.has(targetId))
            return false;
        prefs.whitelist.delete(targetId);
        this.setBounded(this.makeKey(guildId, userId), prefs);
        try {
            await user_preferences_schema_1.UserPreferencesModel.updateOne({ guildId, userId }, { $pull: { whitelist: targetId } }, { upsert: true }).exec();
        }
        catch (err) {
            logger_1.FastLogger.error("PreferencesStore.removeWhitelist failed", { guildId, userId, targetId, err });
        }
        return true;
    }
    static async clearBlacklist(guildId, userId) {
        const prefs = await this.get(guildId, userId);
        prefs.blacklist.clear();
        this.setBounded(this.makeKey(guildId, userId), prefs);
        try {
            await user_preferences_schema_1.UserPreferencesModel.updateOne({ guildId, userId }, { $set: { blacklist: [] } }, { upsert: true }).exec();
        }
        catch (err) {
            logger_1.FastLogger.error("PreferencesStore.clearBlacklist failed", { guildId, userId, err });
        }
    }
    static async clearTrusted(guildId, userId) {
        const prefs = await this.get(guildId, userId);
        prefs.trusted.clear();
        this.setBounded(this.makeKey(guildId, userId), prefs);
        try {
            await user_preferences_schema_1.UserPreferencesModel.updateOne({ guildId, userId }, { $set: { trusted: [] } }, { upsert: true }).exec();
        }
        catch (err) {
            logger_1.FastLogger.error("PreferencesStore.clearTrusted failed", { guildId, userId, err });
        }
    }
    static async clearWhitelist(guildId, userId) {
        const prefs = await this.get(guildId, userId);
        prefs.whitelist.clear();
        this.setBounded(this.makeKey(guildId, userId), prefs);
        try {
            await user_preferences_schema_1.UserPreferencesModel.updateOne({ guildId, userId }, { $set: { whitelist: [] } }, { upsert: true }).exec();
        }
        catch (err) {
            logger_1.FastLogger.error("PreferencesStore.clearWhitelist failed", { guildId, userId, err });
        }
    }
}
exports.PreferencesStore = PreferencesStore;
