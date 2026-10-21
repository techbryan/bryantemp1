"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceCreationService = void 0;
const discord_js_1 = require("discord.js");
const voice_store_1 = require("../cache/voice.store");
const guild_store_1 = require("../cache/guild.store");
const preferences_store_1 = require("../../user/cache/preferences.store");
const panel_builder_1 = require("../../../core/interactions/panel.builder");
const global_blacklist_store_1 = require("../../user/cache/global-blacklist.store");
const persistence_worker_1 = require("../../../core/workers/persistence.worker");
const action_logger_1 = require("../../../core/logger/action.logger");
const logger_1 = require("../../../core/logger/logger");
const usages_1 = require("../../../shared/embeds/usages");
const OWNER_ALLOW_BITS = String(discord_js_1.PermissionFlagsBits.Connect |
    discord_js_1.PermissionFlagsBits.Speak |
    discord_js_1.PermissionFlagsBits.Stream |
    discord_js_1.PermissionFlagsBits.ViewChannel |
    discord_js_1.PermissionFlagsBits.MoveMembers |
    discord_js_1.PermissionFlagsBits.SendMessages);
const TRUSTED_ALLOW_BITS = String(discord_js_1.PermissionFlagsBits.Connect |
    discord_js_1.PermissionFlagsBits.Speak |
    discord_js_1.PermissionFlagsBits.Stream |
    discord_js_1.PermissionFlagsBits.ViewChannel |
    discord_js_1.PermissionFlagsBits.SendMessages);
const BLOCKED_DENY_BITS = String(discord_js_1.PermissionFlagsBits.Connect |
    discord_js_1.PermissionFlagsBits.SendMessages);
class VoiceCreationService {
    static creatingUsers = new Map();
    static joinTimestamps = new Map();
    static activeCooldowns = new Map();
    static guildCreationQueues = new Map();
    static isCreating(userId) {
        const expires = this.creatingUsers.get(userId);
        if (!expires)
            return false;
        if (Date.now() > expires) {
            this.creatingUsers.delete(userId);
            return false;
        }
        return true;
    }
    static acquireCreationLock(userId) {
        const now = Date.now();
        const expires = this.creatingUsers.get(userId);
        if (expires && now <= expires) {
            return false;
        }
        this.creatingUsers.set(userId, now + 12000);
        return true;
    }
    static releaseCreationLock(userId) {
        this.creatingUsers.delete(userId);
    }
    static checkJoinRateLimit(userId) {
        const now = Date.now();
        if (this.isCreating(userId)) {
            return { isRateLimited: true, remainingSeconds: 2 };
        }
        const cooldownUntil = this.activeCooldowns.get(userId);
        if (cooldownUntil) {
            if (now < cooldownUntil) {
                return { isRateLimited: true, remainingSeconds: Math.ceil((cooldownUntil - now) / 1000) };
            }
            this.activeCooldowns.delete(userId);
        }
        const timestamps = this.joinTimestamps.get(userId) || [];
        const validTimestamps = timestamps.filter((t) => now - t <= 3500);
        validTimestamps.push(now);
        this.joinTimestamps.set(userId, validTimestamps);
        if (validTimestamps.length >= 2) {
            const cooldownExpiry = now + 3500;
            this.activeCooldowns.set(userId, cooldownExpiry);
            this.joinTimestamps.delete(userId);
            return { isRateLimited: true, remainingSeconds: 3 };
        }
        if (this.joinTimestamps.size > 2000) {
            for (const [k, v] of this.joinTimestamps) {
                if (v.length === 0 || now - v[v.length - 1] > 10000) {
                    this.joinTimestamps.delete(k);
                }
            }
        }
        return { isRateLimited: false, remainingSeconds: 0 };
    }
    static async createRoom(member) {
        if (global_blacklist_store_1.GlobalBlacklistStore.isUserBlacklisted(member.id)) {
            void member.voice.disconnect().catch(() => { });
            return null;
        }
        if (!member.voice?.channelId) {
            return null;
        }
        const guild = member.guild;
        const existingRoom = voice_store_1.VoiceMemoryStore.getByOwner(guild.id, member.id);
        if (existingRoom) {
            const existingCh = guild.channels.cache.get(existingRoom.channelId);
            if (existingCh && existingCh.isVoiceBased()) {
                await guild.client.rest.patch(discord_js_1.Routes.guildMember(guild.id, member.id), {
                    body: { channel_id: existingRoom.channelId }
                }).catch(() => { });
                return existingRoom.channelId;
            }
            else {
                voice_store_1.VoiceMemoryStore.remove(existingRoom.channelId);
                void guild.client.rest.delete(discord_js_1.Routes.channel(existingRoom.channelId)).catch(() => { });
            }
        }
        if (!this.acquireCreationLock(member.id)) {
            return null;
        }
        const guildId = member.guild.id;
        const currentQueue = this.guildCreationQueues.get(guildId) || Promise.resolve();
        const creationPromise = currentQueue
            .catch(() => { })
            .then(() => this.executeCreateRoom(member));
        this.guildCreationQueues.set(guildId, creationPromise);
        return creationPromise;
    }
    static async executeCreateRoom(member) {
        if (!member.voice?.channelId) {
            this.releaseCreationLock(member.id);
            return null;
        }
        let createdChannelId = null;
        const guild = member.guild;
        const rest = guild.client.rest;
        try {
            const config = guild_store_1.GuildMemoryStore.resolve(guild.id) || await guild_store_1.GuildMemoryStore.resolveAsync(guild.id);
            if (!config)
                return null;
            const existingRoom = voice_store_1.VoiceMemoryStore.getByOwner(guild.id, member.id);
            if (existingRoom) {
                const existingCh = guild.channels.cache.get(existingRoom.channelId);
                if (existingCh && existingCh.isVoiceBased()) {
                    await rest.patch(discord_js_1.Routes.guildMember(guild.id, member.id), {
                        body: { channel_id: existingRoom.channelId }
                    }).catch(() => { });
                    return existingRoom.channelId;
                }
                else {
                    voice_store_1.VoiceMemoryStore.remove(existingRoom.channelId);
                    void rest.delete(discord_js_1.Routes.channel(existingRoom.channelId)).catch(() => { });
                }
            }
            const prefs = preferences_store_1.PreferencesStore.getSync(guild.id, member.id);
            let channelName = `${member.displayName}'s Room`;
            if (config.nameTemplate) {
                channelName = config.nameTemplate
                    .replace(/{username}/gi, member.displayName)
                    .replace(/{user}/gi, member.user.username)
                    .replace(/{server}/gi, guild.name)
                    .slice(0, 100);
            }
            const rawChannel = (await rest.post(discord_js_1.Routes.guildChannels(guild.id), {
                body: {
                    name: channelName,
                    type: discord_js_1.ChannelType.GuildVoice,
                    parent_id: config.categoryId || undefined,
                    user_limit: config.defaultLimit,
                    permission_overwrites: [
                        {
                            id: member.id,
                            allow: OWNER_ALLOW_BITS,
                            deny: "0",
                            type: 1
                        }
                    ]
                }
            }));
            createdChannelId = rawChannel.id;
            const session = {
                channelId: createdChannelId,
                guildId: guild.id,
                ownerId: member.id,
                originalOwnerId: member.id,
                coOwners: new Set(prefs.trusted),
                whitelist: new Set(prefs.whitelist),
                isLocked: false,
                isTextLocked: false,
                isHidden: false,
                antiAbuseEnabled: true
            };
            voice_store_1.VoiceMemoryStore.set(session);
            try {
                await rest.patch(discord_js_1.Routes.guildMember(guild.id, member.id), {
                    body: { channel_id: createdChannelId }
                });
            }
            catch (moveErr) {
                const errorObj = moveErr;
                const isUserDisconnected = errorObj?.code === 40032 || errorObj?.code === 10026 || errorObj?.status === 400;
                if (isUserDisconnected) {
                    logger_1.FastLogger.info(`User ${member.user.tag} (${member.id}) disconnected before move completed`);
                }
                else {
                    logger_1.FastLogger.warn(`Failed to move user ${member.user.tag} (${member.id}) into channel ${createdChannelId} in guild ${guild.id}: ${errorObj?.message || String(moveErr)}`);
                }
                voice_store_1.VoiceMemoryStore.remove(createdChannelId);
                void rest.delete(discord_js_1.Routes.channel(createdChannelId)).catch((delErr) => {
                    logger_1.FastLogger.error(`Rollback channel delete failed for ${createdChannelId}`, delErr);
                });
                if (!isUserDisconnected && errorObj?.code === 50013) {
                    queueMicrotask(async () => {
                        try {
                            const errNotice = await usages_1.Usages.permissionError(guild.id, "Move Member to Room", ["Move Members"]);
                            await member.send(errNotice).catch(() => { });
                        }
                        catch { }
                    });
                }
                return null;
            }
            const extraOverwrites = [];
            for (const blockedId of prefs.blacklist) {
                const isRole = guild.roles.cache.has(blockedId);
                extraOverwrites.push({
                    id: blockedId,
                    allow: String(discord_js_1.PermissionFlagsBits.ViewChannel),
                    deny: BLOCKED_DENY_BITS,
                    type: isRole ? 0 : 1
                });
            }
            for (const trustedId of prefs.trusted) {
                const isRole = guild.roles.cache.has(trustedId);
                extraOverwrites.push({
                    id: trustedId,
                    allow: TRUSTED_ALLOW_BITS,
                    deny: "0",
                    type: isRole ? 0 : 1
                });
            }
            for (const wlId of prefs.whitelist) {
                if (!prefs.trusted.has(wlId)) {
                    const isRole = guild.roles.cache.has(wlId);
                    extraOverwrites.push({
                        id: wlId,
                        allow: TRUSTED_ALLOW_BITS,
                        deny: "0",
                        type: isRole ? 0 : 1
                    });
                }
            }
            if (extraOverwrites.length > 0) {
                void Promise.allSettled(extraOverwrites.map((ow) => rest.put(discord_js_1.Routes.channelPermission(createdChannelId, ow.id), {
                    body: { allow: ow.allow, deny: ow.deny, type: ow.type }
                })));
            }
            if (config.defaultStatus) {
                const formattedStatus = config.defaultStatus
                    .replace(/{username}/gi, member.displayName)
                    .replace(/{user}/gi, member.user.username)
                    .replace(/{server}/gi, guild.name)
                    .slice(0, 500);
                void rest.put(`/channels/${createdChannelId}/voice-status`, {
                    body: { status: formattedStatus }
                }).catch((statusErr) => {
                    logger_1.FastLogger.warn(`Failed to set channel status for ${createdChannelId}: ${statusErr}`);
                });
            }
            persistence_worker_1.PersistenceWorkerQueue.dispatch({
                type: "CREATE_ROOM",
                data: {
                    channelId: createdChannelId,
                    guildId: guild.id,
                    ownerId: member.id,
                    originalOwnerId: member.id,
                    coOwners: Array.from(prefs.trusted),
                    whitelist: Array.from(prefs.whitelist),
                    isLocked: false,
                    isTextLocked: false,
                    isHidden: false,
                    antiAbuseEnabled: true
                }
            });
            persistence_worker_1.PersistenceWorkerQueue.dispatch({
                type: "INCREMENT_CHANNELS_CREATED",
                userId: member.id,
                guildId: guild.id
            });
            const finalChannelId = createdChannelId;
            queueMicrotask(async () => {
                try {
                    const channel = guild.channels.cache.get(finalChannelId) ??
                        await guild.channels.fetch(finalChannelId).catch(() => null);
                    if (channel && channel.isSendable()) {
                        const fullPayload = await panel_builder_1.PanelBuilder.createFullPanelPayload(guild.id, member.id);
                        await channel.send(fullPayload).catch((sendErr) => {
                            logger_1.FastLogger.warn(`Failed to send panel to voice channel ${finalChannelId}: ${sendErr}`);
                        });
                    }
                    if (config.logsChannelId && channel) {
                        action_logger_1.ActionLogger.logAction({
                            guildId: guild.id,
                            executorId: member.id,
                            action: "Voice Channel Created",
                            channelName: channel.name
                        }).catch(() => { });
                    }
                }
                catch { }
            });
            return createdChannelId;
        }
        catch (err) {
            logger_1.FastLogger.error(`VoiceCreationService.createRoom failed for user ${member.id} in guild ${guild.id}`, err);
            if (createdChannelId) {
                voice_store_1.VoiceMemoryStore.remove(createdChannelId);
                void rest.delete(discord_js_1.Routes.channel(createdChannelId)).catch((delErr) => {
                    logger_1.FastLogger.error(`Failed to delete channel ${createdChannelId} after creation error`, delErr);
                });
            }
            return null;
        }
        finally {
            this.releaseCreationLock(member.id);
        }
    }
}
exports.VoiceCreationService = VoiceCreationService;
