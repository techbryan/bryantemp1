"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoicePersistManager = void 0;
const logger_1 = require("../logger/logger");
const bot_gateway_1 = require("../gateway/bot.gateway");
const bot_voice_persist_schema_1 = require("../../database/schemas/bot-voice-persist.schema");
class VoicePersistManager {
    static data = {};
    static isLoaded = false;
    static reconnectingMain = false;
    static async preload() {
        try {
            const records = await bot_voice_persist_schema_1.BotVoicePersistModel.find().lean();
            for (const rec of records) {
                if (rec.botType === "main") {
                    this.data.mainBot = { guildId: rec.guildId, channelId: rec.channelId };
                }
            }
            this.isLoaded = true;
            logger_1.FastLogger.info("Voice persist configurations loaded from database");
        }
        catch (err) {
            logger_1.FastLogger.error("Failed to preload BotVoicePersistModel", err);
        }
    }
    static load() {
        return this.data;
    }
    static setMainBotChannel(guildId, channelId) {
        this.data.mainBot = { guildId, channelId };
        void bot_voice_persist_schema_1.BotVoicePersistModel.updateOne({ botType: "main" }, { $set: { guildId, channelId } }, { upsert: true }).exec().catch((err) => {
            logger_1.FastLogger.error("Failed to save main bot voice persist to database", err);
        });
    }
    static async joinVoice(client, guildId, channelId) {
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild)
                return false;
            let channel = guild.channels.cache.get(channelId);
            if (!channel) {
                channel = (await guild.channels.fetch(channelId).catch(() => null)) ?? undefined;
            }
            if (!channel || !channel.isVoiceBased())
                return false;
            const shard = guild.shard;
            if (!shard)
                return false;
            shard.send({
                op: 4,
                d: {
                    guild_id: guildId,
                    channel_id: channelId,
                    self_mute: false,
                    self_deaf: true
                }
            });
            return true;
        }
        catch (err) {
            logger_1.FastLogger.error(`Failed to join voice channel ${channelId}`, err);
            return false;
        }
    }
    static async reconnectMain() {
        if (this.reconnectingMain)
            return;
        const data = this.load();
        if (!data.mainBot || !bot_gateway_1.BotGateway.client)
            return;
        this.reconnectingMain = true;
        try {
            await this.joinVoice(bot_gateway_1.BotGateway.client, data.mainBot.guildId, data.mainBot.channelId);
        }
        finally {
            setTimeout(() => {
                this.reconnectingMain = false;
            }, 5000);
        }
    }
    static async reconnectAll() {
        const data = this.load();
        if (data.mainBot && bot_gateway_1.BotGateway.client) {
            void this.joinVoice(bot_gateway_1.BotGateway.client, data.mainBot.guildId, data.mainBot.channelId);
        }
    }
}
exports.VoicePersistManager = VoicePersistManager;
