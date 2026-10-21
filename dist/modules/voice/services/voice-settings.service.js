"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceSettingsService = void 0;
const voice_auth_service_1 = require("./voice-auth.service");
const logger_1 = require("../../../core/logger/logger");
const usages_1 = require("../../../shared/embeds/usages");
class VoiceSettingsService {
    static renameCooldowns = new Map();
    static canRename(channelId) {
        const now = Date.now();
        const entry = this.renameCooldowns.get(channelId);
        if (!entry || now > entry.resetAt) {
            this.renameCooldowns.set(channelId, { count: 1, resetAt: now + 600000 });
            return { allowed: true };
        }
        if (entry.count < 2) {
            entry.count++;
            return { allowed: true };
        }
        const waitSeconds = Math.ceil((entry.resetAt - now) / 1000);
        return { allowed: false, waitSeconds };
    }
    static rollbackRename(channelId) {
        const entry = this.renameCooldowns.get(channelId);
        if (!entry)
            return;
        if (entry.count > 1) {
            entry.count--;
        }
        else {
            this.renameCooldowns.delete(channelId);
        }
    }
    static clearCooldown(channelId) {
        this.renameCooldowns.delete(channelId);
    }
    static async renameChannel(channel, member, rawName) {
        if (!channel) {
            return { status: "not_in_voice" };
        }
        if (!voice_auth_service_1.VoiceAuthService.isManager(channel.id, member.id)) {
            return { status: "not_manager" };
        }
        const trimmed = rawName.trim();
        if (!trimmed) {
            return { status: "empty_name" };
        }
        const sanitized = usages_1.Usages.sanitize(trimmed).slice(0, 100);
        if (!usages_1.Usages.isValidChannelName(sanitized)) {
            return { status: "invalid_name" };
        }
        if (channel.name === sanitized) {
            return { status: "same_name", name: sanitized };
        }
        const rateCheck = this.canRename(channel.id);
        if (!rateCheck.allowed) {
            return { status: "cooldown", retryAfterSeconds: rateCheck.waitSeconds || 0 };
        }
        try {
            await channel.setName(sanitized);
            return { status: "renamed", name: sanitized };
        }
        catch (err) {
            this.rollbackRename(channel.id);
            logger_1.FastLogger.error("Failed to update channel name on Discord", {
                channelId: channel.id,
                guildId: channel.guildId,
                actorId: member.id,
                targetName: sanitized,
                err
            });
            return { status: "failed", error: err instanceof Error ? err.message : String(err) };
        }
    }
    static async setLimit(channel, member, rawLimit) {
        if (!channel) {
            return { status: "not_in_voice" };
        }
        if (!voice_auth_service_1.VoiceAuthService.isManager(channel.id, member.id)) {
            return { status: "not_manager" };
        }
        const parsed = typeof rawLimit === "number" ? rawLimit : parseInt(String(rawLimit).trim(), 10);
        if (isNaN(parsed) || parsed < 0 || parsed > 99) {
            return { status: "invalid_limit" };
        }
        if (channel.userLimit === parsed) {
            return { status: "same_limit", limit: parsed };
        }
        try {
            await channel.setUserLimit(parsed);
            return { status: "updated", limit: parsed };
        }
        catch (err) {
            logger_1.FastLogger.error("Failed to set user limit on Discord", {
                channelId: channel.id,
                guildId: channel.guildId,
                actorId: member.id,
                limit: parsed,
                err
            });
            return { status: "failed", error: err instanceof Error ? err.message : String(err) };
        }
    }
    static async setBitrate(channel, member, rawBitrate) {
        if (!channel) {
            return { status: "not_in_voice" };
        }
        if (!voice_auth_service_1.VoiceAuthService.isManager(channel.id, member.id)) {
            return { status: "not_manager" };
        }
        let maxAllowedKbps = 96;
        const tier = channel.guild.premiumTier;
        if (tier === 1)
            maxAllowedKbps = 128;
        else if (tier === 2)
            maxAllowedKbps = 256;
        else if (tier === 3)
            maxAllowedKbps = 384;
        const parsed = typeof rawBitrate === "number" ? rawBitrate : parseInt(String(rawBitrate).trim(), 10);
        if (isNaN(parsed) || parsed < 8 || parsed > maxAllowedKbps) {
            return { status: "invalid_bitrate", maxAllowedKbps };
        }
        const currentKbps = Math.round(channel.bitrate / 1000);
        if (currentKbps === parsed) {
            return { status: "same_bitrate", bitrateKbps: parsed };
        }
        try {
            await channel.setBitrate(parsed * 1000);
            return { status: "updated", bitrateKbps: parsed };
        }
        catch (err) {
            logger_1.FastLogger.error("Failed to set bitrate on Discord", {
                channelId: channel.id,
                guildId: channel.guildId,
                actorId: member.id,
                bitrateKbps: parsed,
                err
            });
            return { status: "failed", error: err instanceof Error ? err.message : String(err) };
        }
    }
    static async setRegion(channel, member, rawRegion) {
        if (!channel) {
            return { status: "not_in_voice" };
        }
        if (!voice_auth_service_1.VoiceAuthService.isManager(channel.id, member.id)) {
            return { status: "not_manager" };
        }
        const validRegions = {
            automatic: null,
            auto: null,
            brazil: "brazil",
            rotterdam: "rotterdam",
            hongkong: "hongkong",
            india: "india",
            japan: "japan",
            russia: "russia",
            singapore: "singapore",
            southafrica: "southafrica",
            sydney: "sydney",
            "us-central": "us-central",
            "us-east": "us-east",
            "us-south": "us-south",
            "us-west": "us-west"
        };
        const clean = rawRegion.toLowerCase().trim();
        if (!(clean in validRegions)) {
            return { status: "invalid_region" };
        }
        const targetRegion = validRegions[clean];
        if (channel.rtcRegion === targetRegion) {
            return { status: "same_region", region: targetRegion };
        }
        try {
            await channel.setRTCRegion(targetRegion);
            return { status: "updated", region: targetRegion };
        }
        catch (err) {
            logger_1.FastLogger.error("Failed to set RTC region on Discord", {
                channelId: channel.id,
                guildId: channel.guildId,
                actorId: member.id,
                region: targetRegion,
                err
            });
            return { status: "failed", error: err instanceof Error ? err.message : String(err) };
        }
    }
    static async setStatus(channel, member, rawStatus) {
        if (!channel) {
            return { status: "not_in_voice" };
        }
        if (!voice_auth_service_1.VoiceAuthService.isManager(channel.id, member.id)) {
            return { status: "not_manager" };
        }
        const trimmed = rawStatus.trim();
        if (trimmed.length > 500) {
            return { status: "invalid_status" };
        }
        try {
            await channel.client.rest.put(`/channels/${channel.id}/voice-status`, {
                body: { status: trimmed }
            });
            if (!trimmed) {
                return { status: "cleared" };
            }
            return { status: "updated", textStatus: trimmed };
        }
        catch (err) {
            logger_1.FastLogger.error("Failed to set voice channel status on Discord", {
                channelId: channel.id,
                guildId: channel.guildId,
                actorId: member.id,
                status: trimmed,
                err
            });
            return { status: "failed", error: err instanceof Error ? err.message : String(err) };
        }
    }
}
exports.VoiceSettingsService = VoiceSettingsService;
