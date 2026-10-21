"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfileStore = void 0;
const user_profile_schema_1 = require("../../../database/schemas/user-profile.schema");
const logger_1 = require("../../../core/logger/logger");
class UserProfileStore {
    static cache = new Map();
    static MAX_ENTRIES = 5000;
    static makeKey(userId, guildId) {
        return `${guildId}:${userId}`;
    }
    static async preload() {
        try {
            const records = await user_profile_schema_1.UserProfileModel.find({ equippedBannerUrl: { $exists: true, $ne: "" } }).lean();
            for (const r of records) {
                this.cache.set(this.makeKey(r.userId, r.guildId), {
                    channelsCreated: r.channelsCreated || 0,
                    hasBannerAccess: Boolean(r.hasBannerAccess),
                    equippedBannerUrl: r.equippedBannerUrl
                });
            }
        }
        catch (err) {
            logger_1.FastLogger.error("UserProfileStore.preload failed", err);
        }
    }
    static getSync(userId, guildId) {
        return this.cache.get(this.makeKey(userId, guildId));
    }
    static async get(userId, guildId) {
        const key = this.makeKey(userId, guildId);
        const existing = this.cache.get(key);
        if (existing)
            return existing;
        try {
            const doc = await user_profile_schema_1.UserProfileModel.findOne({ userId, guildId }).lean();
            if (doc) {
                const item = {
                    channelsCreated: doc.channelsCreated || 0,
                    hasBannerAccess: Boolean(doc.hasBannerAccess),
                    equippedBannerUrl: doc.equippedBannerUrl
                };
                if (this.cache.size >= this.MAX_ENTRIES) {
                    const firstKey = this.cache.keys().next().value;
                    if (firstKey)
                        this.cache.delete(firstKey);
                }
                this.cache.set(key, item);
                return item;
            }
        }
        catch (err) {
            logger_1.FastLogger.error("UserProfileStore.get failed", { userId, guildId, err });
        }
        return null;
    }
    static set(userId, guildId, profile) {
        const key = this.makeKey(userId, guildId);
        if (this.cache.size >= this.MAX_ENTRIES && !this.cache.has(key)) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey)
                this.cache.delete(firstKey);
        }
        this.cache.set(key, profile);
    }
    static updateBanner(userId, guildId, bannerUrl) {
        const key = this.makeKey(userId, guildId);
        const existing = this.cache.get(key) || { channelsCreated: 0, hasBannerAccess: true };
        existing.equippedBannerUrl = bannerUrl;
        this.cache.set(key, existing);
    }
}
exports.UserProfileStore = UserProfileStore;
