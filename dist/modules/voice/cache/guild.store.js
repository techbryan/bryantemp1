"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildMemoryStore = void 0;
const guild_config_schema_1 = require("../../../database/schemas/guild-config.schema");
class GuildMemoryStore {
    static store = new Map();
    static generatorMap = new Map();
    static normalize(item) {
        if (!item.generatorId && item.voiceChannelId) {
            item.generatorId = item.voiceChannelId;
        }
        if (!item.nameTemplate && item.channelNameTemplate) {
            item.nameTemplate = item.channelNameTemplate;
        }
        if (!item.defaultStatus && item.defaultChannelStatus) {
            item.defaultStatus = item.defaultChannelStatus;
        }
        return item;
    }
    static async preload() {
        try {
            const records = await guild_config_schema_1.GuildConfigModel.find().lean();
            for (const rawItem of records) {
                const item = this.normalize(rawItem);
                this.store.set(item.guildId, item);
                if (item.generatorId) {
                    this.generatorMap.set(item.generatorId, item.guildId);
                }
            }
        }
        catch { }
    }
    static isGenerator(channelId) {
        return this.generatorMap.has(channelId);
    }
    static getGuildByGenerator(channelId) {
        return this.generatorMap.get(channelId);
    }
    static resolve(guildId) {
        return this.store.get(guildId) || null;
    }
    static async resolveAsync(guildId) {
        const memory = this.store.get(guildId);
        if (memory)
            return memory;
        try {
            const data = await guild_config_schema_1.GuildConfigModel.findOne({ guildId }).maxTimeMS(500).lean();
            if (data) {
                const item = this.normalize(data);
                this.store.set(guildId, item);
                if (item.generatorId) {
                    this.generatorMap.set(item.generatorId, item.guildId);
                }
                return item;
            }
        }
        catch { }
        return null;
    }
    static set(guildId, data) {
        const item = this.normalize(data);
        const old = this.store.get(guildId);
        if (old?.generatorId && old.generatorId !== item.generatorId) {
            this.generatorMap.delete(old.generatorId);
        }
        this.store.set(guildId, item);
        if (item.generatorId) {
            this.generatorMap.set(item.generatorId, guildId);
        }
    }
    static purge(guildId) {
        const old = this.store.get(guildId);
        if (old?.generatorId) {
            this.generatorMap.delete(old.generatorId);
        }
        this.store.delete(guildId);
    }
}
exports.GuildMemoryStore = GuildMemoryStore;
