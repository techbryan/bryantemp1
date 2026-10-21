"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceLifecycleService = void 0;
const voice_store_1 = require("../cache/voice.store");
const guild_store_1 = require("../cache/guild.store");
const action_logger_1 = require("../../../core/logger/action.logger");
const logger_1 = require("../../../core/logger/logger");
const voice_creation_service_1 = require("./voice-creation.service");
const voice_auth_service_1 = require("./voice-auth.service");
const voice_settings_service_1 = require("./voice-settings.service");
const voice_claim_service_1 = require("./voice-claim.service");
class VoiceLifecycleService {
    static tempTimers = new Map();
    static isCreating(userId) {
        return voice_creation_service_1.VoiceCreationService.isCreating(userId);
    }
    static acquireCreationLock(userId) {
        return voice_creation_service_1.VoiceCreationService.acquireCreationLock(userId);
    }
    static releaseCreationLock(userId) {
        voice_creation_service_1.VoiceCreationService.releaseCreationLock(userId);
    }
    static checkJoinRateLimit(userId) {
        return voice_creation_service_1.VoiceCreationService.checkJoinRateLimit(userId);
    }
    static registerTempTimer(channelId, timer) {
        let set = this.tempTimers.get(channelId);
        if (!set) {
            set = new Set();
            this.tempTimers.set(channelId, set);
        }
        set.add(timer);
    }
    static clearTempTimers(channelId) {
        const set = this.tempTimers.get(channelId);
        if (set) {
            for (const timer of set) {
                clearTimeout(timer);
            }
            this.tempTimers.delete(channelId);
        }
    }
    static async createRoom(member) {
        return voice_creation_service_1.VoiceCreationService.createRoom(member);
    }
    static canRename(channelId) {
        return voice_settings_service_1.VoiceSettingsService.canRename(channelId);
    }
    static rollbackRename(channelId) {
        voice_settings_service_1.VoiceSettingsService.rollbackRename(channelId);
    }
    static async checkEmpty(channel) {
        if (channel.members.size === 0) {
            voice_store_1.VoiceMemoryStore.remove(channel.id);
            voice_settings_service_1.VoiceSettingsService.clearCooldown(channel.id);
            this.clearTempTimers(channel.id);
            try {
                await channel.delete();
            }
            catch (err) {
                logger_1.FastLogger.warn(`Failed to delete empty channel ${channel.id}: ${err instanceof Error ? err.message : String(err)}`);
            }
            queueMicrotask(async () => {
                const config = guild_store_1.GuildMemoryStore.resolve(channel.guildId);
                if (config?.logsChannelId) {
                    action_logger_1.ActionLogger.logAction({
                        guildId: channel.guildId,
                        executorId: channel.id,
                        action: "Voice Channel Deleted",
                        channelName: channel.name
                    }).catch(() => { });
                }
            });
        }
    }
    static isManager(channelId, userId) {
        return voice_auth_service_1.VoiceAuthService.isManager(channelId, userId);
    }
    static isOwner(channelId, userId) {
        return voice_auth_service_1.VoiceAuthService.isOwner(channelId, userId);
    }
    static canManageTarget(channelId, actorId, targetId, guild) {
        return voice_auth_service_1.VoiceAuthService.canManageTarget(channelId, actorId, targetId, guild);
    }
    static async renameChannel(channel, member, rawName) {
        return voice_settings_service_1.VoiceSettingsService.renameChannel(channel, member, rawName);
    }
    static async setLimit(channel, member, rawLimit) {
        return voice_settings_service_1.VoiceSettingsService.setLimit(channel, member, rawLimit);
    }
    static async setBitrate(channel, member, rawBitrate) {
        return voice_settings_service_1.VoiceSettingsService.setBitrate(channel, member, rawBitrate);
    }
    static async setRegion(channel, member, rawRegion) {
        return voice_settings_service_1.VoiceSettingsService.setRegion(channel, member, rawRegion);
    }
    static async setStatus(channel, member, rawStatus) {
        return voice_settings_service_1.VoiceSettingsService.setStatus(channel, member, rawStatus);
    }
    static async claimChannel(channel, member) {
        return voice_claim_service_1.VoiceClaimService.claimChannel(channel, member);
    }
}
exports.VoiceLifecycleService = VoiceLifecycleService;
