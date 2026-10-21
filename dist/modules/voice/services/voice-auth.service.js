"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceAuthService = void 0;
const discord_js_1 = require("discord.js");
const voice_store_1 = require("../cache/voice.store");
const bot_developer_store_1 = require("../../user/cache/bot-developer.store");
class VoiceAuthService {
    static isManager(channelId, userId) {
        if (bot_developer_store_1.BotDeveloperStore.isDeveloper(userId))
            return true;
        const session = voice_store_1.VoiceMemoryStore.get(channelId);
        if (!session)
            return false;
        return session.ownerId === userId || session.coOwners.has(userId);
    }
    static isOwner(channelId, userId) {
        if (bot_developer_store_1.BotDeveloperStore.isDeveloper(userId))
            return true;
        const session = voice_store_1.VoiceMemoryStore.get(channelId);
        return session?.ownerId === userId;
    }
    static canManageTarget(channelId, actorId, targetId, guild) {
        if (bot_developer_store_1.BotDeveloperStore.isDeveloper(actorId))
            return true;
        if (bot_developer_store_1.BotDeveloperStore.isDeveloper(targetId))
            return false;
        if (guild) {
            const targetMember = guild.members?.cache?.get(targetId);
            if (targetMember?.permissions?.has(discord_js_1.PermissionFlagsBits.Administrator)) {
                return false;
            }
        }
        const session = voice_store_1.VoiceMemoryStore.get(channelId);
        if (!session)
            return false;
        if (targetId === session.ownerId)
            return false;
        if (actorId === session.ownerId)
            return true;
        if (session.coOwners.has(actorId)) {
            if (session.coOwners.has(targetId))
                return false;
            return true;
        }
        return false;
    }
}
exports.VoiceAuthService = VoiceAuthService;
