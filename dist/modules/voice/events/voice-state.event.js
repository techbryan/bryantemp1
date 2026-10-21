"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onVoiceStateUpdate = onVoiceStateUpdate;
const guild_store_1 = require("../cache/guild.store");
const voice_lifecycle_service_1 = require("../services/voice-lifecycle.service");
const voice_creation_service_1 = require("../services/voice-creation.service");
const voice_store_1 = require("../cache/voice.store");
const usages_1 = require("../../../shared/embeds/usages");
const global_blacklist_store_1 = require("../../user/cache/global-blacklist.store");
const logger_1 = require("../../../core/logger/logger");
const bot_developer_store_1 = require("../../user/cache/bot-developer.store");
async function onVoiceStateUpdate(oldState, newState) {
    if (oldState.channelId === newState.channelId)
        return;
    const guildId = newState.guild.id;
    if (newState.channelId) {
        const member = newState.member;
        if (member) {
            let isGen = guild_store_1.GuildMemoryStore.isGenerator(newState.channelId);
            let config = guild_store_1.GuildMemoryStore.resolve(guildId);
            if (!config) {
                config = await guild_store_1.GuildMemoryStore.resolveAsync(guildId);
                if (config && config.generatorId === newState.channelId) {
                    isGen = true;
                }
            }
            if (isGen && config && newState.channelId === config.generatorId) {
                if (global_blacklist_store_1.GlobalBlacklistStore.isUserBlacklisted(member.id)) {
                    await member.voice.disconnect().catch(() => { });
                    return;
                }
                const rateLimit = voice_creation_service_1.VoiceCreationService.checkJoinRateLimit(member.id);
                if (rateLimit.isRateLimited) {
                    await member.voice.disconnect().catch(() => { });
                    if (oldState.channelId) {
                        const oldChannel = oldState.channel;
                        if (oldChannel && voice_store_1.VoiceMemoryStore.get(oldChannel.id)) {
                            voice_lifecycle_service_1.VoiceLifecycleService.checkEmpty(oldChannel).catch(() => { });
                        }
                    }
                    queueMicrotask(async () => {
                        try {
                            const notice = await usages_1.Usages.cooldownNotice(guildId, `${rateLimit.remainingSeconds}s`);
                            await member.send(notice).catch(() => { });
                        }
                        catch { }
                    });
                    return;
                }
                await voice_creation_service_1.VoiceCreationService.createRoom(member);
                if (oldState.channelId) {
                    const oldChannel = oldState.channel;
                    if (oldChannel && voice_store_1.VoiceMemoryStore.get(oldChannel.id)) {
                        voice_lifecycle_service_1.VoiceLifecycleService.checkEmpty(oldChannel).catch(() => { });
                    }
                }
                return;
            }
        }
    }
    if (oldState.channelId) {
        const oldChannel = oldState.channel;
        const oldSession = oldChannel ? voice_store_1.VoiceMemoryStore.get(oldChannel.id) : null;
        if (oldChannel && oldSession) {
            if (oldState.member) {
                if (oldSession.channelMutes?.has(oldState.member.id)) {
                    oldState.member.voice.setMute(false).catch(() => { });
                }
                if (oldSession.channelDeafens?.has(oldState.member.id)) {
                    oldState.member.voice.setDeaf(false).catch(() => { });
                }
            }
            if (oldChannel.members.size === 0) {
                voice_lifecycle_service_1.VoiceLifecycleService.checkEmpty(oldChannel).catch(() => { });
            }
            else if (oldState.member?.id === oldSession.ownerId && !oldChannel.members.has(oldSession.ownerId)) {
                if (!oldSession.claimPromptMessageId) {
                    queueMicrotask(async () => {
                        try {
                            const promptPayload = await usages_1.Usages.claimPrompt(guildId, oldSession.ownerId);
                            const msg = await oldChannel.send(promptPayload).catch(() => null);
                            if (msg) {
                                oldSession.claimPromptMessageId = msg.id;
                            }
                        }
                        catch { }
                    });
                }
            }
        }
    }
    if (newState.channelId) {
        const member = newState.member;
        const session = voice_store_1.VoiceMemoryStore.get(newState.channelId);
        if (session && member) {
            const channel = newState.channel;
            const isOwner = session.ownerId === member.id;
            const isCoOwner = session.coOwners?.has(member.id) ?? false;
            const hasWhitelistedRole = member.roles.cache.some((r) => session.whitelist?.has(r.id));
            const isWhitelisted = (session.whitelist?.has(member.id) ?? false) || hasWhitelistedRole;
            const isDev = bot_developer_store_1.BotDeveloperStore.isDeveloper(member.id);
            const overwrite = channel?.permissionOverwrites.cache.get(member.id);
            const isExplicitlyPermitted = overwrite?.allow.has("Connect") ?? false;
            const isAuthorized = isOwner || isCoOwner || isWhitelisted || isDev || isExplicitlyPermitted;
            if (isExplicitlyPermitted && !isWhitelisted) {
                session.whitelist.add(member.id);
                voice_store_1.VoiceMemoryStore.sync(session.channelId);
            }
            if (isAuthorized && session.antiAbuseAttempts?.has(member.id)) {
                session.antiAbuseAttempts.delete(member.id);
            }
            const antiAbuseActive = session.antiAbuseEnabled !== false;
            const isExplicitlyRejected = overwrite?.deny.has("Connect") ?? false;
            const everyoneOverwrite = channel?.permissionOverwrites.cache.get(channel.guild.roles.everyone.id);
            const isLockedChannel = session.isLocked || (everyoneOverwrite?.deny.has("Connect") ?? false);
            const isLockedViolation = antiAbuseActive && isLockedChannel && !isAuthorized;
            const isRejectViolation = antiAbuseActive && isExplicitlyRejected && !isAuthorized;
            const isLimitViolation = antiAbuseActive && channel && channel.userLimit > 0 && channel.members.size > channel.userLimit && !isAuthorized;
            if (!isAuthorized && (isLockedViolation || isRejectViolation || isLimitViolation)) {
                logger_1.FastLogger.info(`[Anti-Abuse] Kicking unauthorized user ${member.user.tag} (${member.id}) from channel ${session.channelId}`);
                void member.voice.disconnect().catch(() => { });
                if (!session.antiAbuseAttempts) {
                    session.antiAbuseAttempts = new Map();
                }
                const now = Date.now();
                const userEntry = session.antiAbuseAttempts.get(member.id) || { count: 0, lastTime: 0, notified: false };
                if (now - userEntry.lastTime > 60000) {
                    userEntry.count = 1;
                    userEntry.notified = false;
                }
                else {
                    userEntry.count++;
                }
                userEntry.lastTime = now;
                session.antiAbuseAttempts.set(member.id, userEntry);
                if (userEntry.count >= 2 && !userEntry.notified) {
                    userEntry.notified = true;
                    queueMicrotask(async () => {
                        try {
                            if (channel && channel.isSendable()) {
                                const notice = await usages_1.Usages.antiAbuseNotice(guildId, session.ownerId, member.id, channel.id);
                                await channel.send(notice).catch(() => { });
                            }
                        }
                        catch { }
                    });
                }
                return;
            }
            if (session.channelMutes?.has(member.id)) {
                await member.voice.setMute(true).catch(() => { });
            }
            if (session.channelDeafens?.has(member.id)) {
                await member.voice.setDeaf(true).catch(() => { });
            }
            if (member.id === session.ownerId && session.claimPromptMessageId) {
                const targetChannel = newState.channel;
                if (targetChannel) {
                    const promptMsgId = session.claimPromptMessageId;
                    session.claimPromptMessageId = undefined;
                    try {
                        const msg = await targetChannel.messages.fetch(promptMsgId).catch(() => null);
                        if (msg) {
                            const returnedPayload = await usages_1.Usages.ownerReturned(guildId, member.id);
                            await msg.edit(returnedPayload).catch(() => { });
                        }
                    }
                    catch { }
                }
            }
        }
    }
}
