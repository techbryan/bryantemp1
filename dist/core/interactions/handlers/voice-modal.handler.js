"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceModalHandler = void 0;
const discord_js_1 = require("discord.js");
const voice_auth_service_1 = require("../../../modules/voice/services/voice-auth.service");
const voice_settings_service_1 = require("../../../modules/voice/services/voice-settings.service");
const voice_lifecycle_service_1 = require("../../../modules/voice/services/voice-lifecycle.service");
const voice_permission_service_1 = require("../../../modules/voice/services/voice-permission.service");
const voice_store_1 = require("../../../modules/voice/cache/voice.store");
const usages_1 = require("../../../shared/embeds/usages");
const action_logger_1 = require("../../logger/action.logger");
class VoiceModalHandler {
    static async handle(interaction) {
        const member = interaction.member;
        if (!member || !(member instanceof discord_js_1.GuildMember))
            return;
        const guildId = interaction.guildId;
        if (!guildId)
            return;
        const channel = member.voice.channel;
        if (!channel) {
            await interaction.deferUpdate().catch(() => { });
            return;
        }
        const customId = interaction.customId;
        const session = voice_store_1.VoiceMemoryStore.get(channel.id);
        if (customId === "modal:transfer") {
            if (!voice_auth_service_1.VoiceAuthService.isOwner(channel.id, member.id)) {
                await interaction.deferUpdate().catch(() => { });
                return;
            }
            const targetMember = await this.extractTargetMember(interaction);
            if (!targetMember) {
                await interaction.reply({
                    ...(await usages_1.Usages.impossible(guildId, "User not found")),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            await voice_permission_service_1.VoicePermissionsManager.transferOwnership(channel, member.id, targetMember);
            action_logger_1.ActionLogger.logAction({
                guildId,
                executorId: member.id,
                action: "Ownership Transferred",
                channelName: channel.name,
                targetId: targetMember.id
            }).catch(() => { });
            const embed = await usages_1.Usages.executedAction(guildId, "Transfer", `**__Ownership Transferred :__** Transferred channel ownership to <@${targetMember.id}>`);
            await interaction.reply({
                ...embed,
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (!voice_auth_service_1.VoiceAuthService.isManager(channel.id, member.id)) {
            await interaction.deferUpdate().catch(() => { });
            return;
        }
        if (customId === "modal:rename") {
            const rawName = interaction.fields.getTextInputValue("channel_name");
            const sanitized = usages_1.Usages.sanitize(rawName).slice(0, 100);
            if (!usages_1.Usages.isValidChannelName(sanitized)) {
                await interaction.reply({
                    ...(await usages_1.Usages.invalidInputWarning(guildId)),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            if (channel.name === sanitized) {
                const embed = await usages_1.Usages.alreadyAction(guildId, `The channel is already named \`${sanitized}\``);
                await interaction.reply({
                    ...embed,
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            const rateCheck = voice_settings_service_1.VoiceSettingsService.canRename(channel.id);
            if (!rateCheck.allowed) {
                await interaction.reply({
                    ...(await usages_1.Usages.renameCooldown(guildId, rateCheck.waitSeconds || 0)),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            try {
                await channel.setName(sanitized);
            }
            catch {
                voice_settings_service_1.VoiceSettingsService.rollbackRename(channel.id);
                await interaction.reply({
                    ...(await usages_1.Usages.impossible(guildId, "Failed to update channel name on Discord")),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            action_logger_1.ActionLogger.logAction({
                guildId,
                executorId: member.id,
                action: "Channel Renamed",
                channelName: sanitized,
                details: `\`${channel.name}\` -> \`${sanitized}\``
            }).catch(() => { });
            const embed = await usages_1.Usages.executedAction(guildId, "Rename", `Voice channel name updated to : \`${sanitized}\``);
            await interaction.reply({
                ...embed,
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (customId === "modal:limit") {
            const rawLimit = interaction.fields.getTextInputValue("room_limit");
            const amount = parseInt(rawLimit, 10);
            if (isNaN(amount) || amount < 0 || amount > 99) {
                await interaction.reply({
                    ...(await usages_1.Usages.impossible(guildId, "Please provide a valid limit between 0 and 99")),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            if (channel.userLimit === amount) {
                const embed = await usages_1.Usages.alreadyAction(guildId, `The channel limit is already set to \`${amount}\``);
                await interaction.reply({
                    ...embed,
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            await channel.setUserLimit(amount);
            action_logger_1.ActionLogger.logAction({
                guildId,
                executorId: member.id,
                action: "Channel Limit Changed",
                channelName: channel.name,
                details: `Limit set to \`${amount}\``
            }).catch(() => { });
            const embed = await usages_1.Usages.executedAction(guildId, "Limit", `Voice channel limit updated to : \`${amount}\``);
            await interaction.reply({
                ...embed,
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                allowedMentions: { parse: [] }
            });
            return;
        }
        const targetMember = await this.extractTargetMember(interaction);
        if (!targetMember) {
            await interaction.reply({
                ...(await usages_1.Usages.impossible(guildId, "User not found")),
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        if (targetMember.id === member.id) {
            if (customId === "modal:reject" || customId === "modal:temp_reject") {
                await interaction.reply({
                    ...(await usages_1.Usages.selfReject(guildId)),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            if (customId === "modal:permit") {
                await interaction.reply({
                    ...(await usages_1.Usages.stopDoingThat(guildId, "You cannot permit yourself")),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
        }
        if (!voice_auth_service_1.VoiceAuthService.canManageTarget(channel.id, member.id, targetMember.id, interaction.guild)) {
            await interaction.reply({
                ...(await usages_1.Usages.impossible(guildId, "Cannot manage the owner, fellow managers, or server administrators")),
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        if (customId === "modal:reject") {
            const overwrite = channel.permissionOverwrites.cache.get(targetMember.id);
            if (overwrite && overwrite.deny.has("Connect")) {
                const embed = await usages_1.Usages.stopDoingThat(guildId, "You cannot reject someone who is already rejected");
                await interaction.reply({
                    ...embed,
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            await voice_permission_service_1.VoicePermissionsManager.rejectMember(channel, targetMember);
            if (session) {
                session.whitelist.delete(targetMember.id);
                voice_store_1.VoiceMemoryStore.sync(channel.id);
            }
            action_logger_1.ActionLogger.logAction({
                guildId,
                executorId: member.id,
                action: "Member Rejected",
                channelName: channel.name,
                targetId: targetMember.id
            }).catch(() => { });
            const embed = await usages_1.Usages.executedAction(guildId, "Reject", usages_1.Usages.formatUserTarget("rejected", [targetMember.id]));
            await interaction.reply({
                ...embed,
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (customId === "modal:permit") {
            const overwrite = channel.permissionOverwrites.cache.get(targetMember.id);
            if (overwrite && overwrite.allow.has("Connect")) {
                const embed = await usages_1.Usages.stopDoingThat(guildId, "You cannot permit someone who is already permitted");
                await interaction.reply({
                    ...embed,
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            await voice_permission_service_1.VoicePermissionsManager.permitMember(channel, targetMember);
            if (session) {
                session.whitelist.add(targetMember.id);
                voice_store_1.VoiceMemoryStore.sync(channel.id);
            }
            action_logger_1.ActionLogger.logAction({
                guildId,
                executorId: member.id,
                action: "Member Permitted",
                channelName: channel.name,
                targetId: targetMember.id
            }).catch(() => { });
            const embed = await usages_1.Usages.executedAction(guildId, "Permit", usages_1.Usages.formatUserTarget("permitted", [targetMember.id]));
            await interaction.reply({
                ...embed,
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (customId === "modal:mute") {
            if (session) {
                if (!session.channelMutes)
                    session.channelMutes = new Set();
                session.channelMutes.add(targetMember.id);
            }
            if (targetMember.voice.channelId === channel.id) {
                await targetMember.voice.setMute(true).catch(() => { });
            }
            action_logger_1.ActionLogger.logAction({
                guildId,
                executorId: member.id,
                action: "Member Voice Muted",
                channelName: channel.name,
                targetId: targetMember.id
            }).catch(() => { });
            const embed = await usages_1.Usages.executedAction(guildId, "Mute", `**__User has been server muted in voice :__** <@${targetMember.id}>`);
            await interaction.reply({
                ...embed,
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (customId === "modal:deafen") {
            if (session) {
                if (!session.channelDeafens)
                    session.channelDeafens = new Set();
                session.channelDeafens.add(targetMember.id);
            }
            if (targetMember.voice.channelId === channel.id) {
                await targetMember.voice.setDeaf(true).catch(() => { });
            }
            action_logger_1.ActionLogger.logAction({
                guildId,
                executorId: member.id,
                action: "Member Voice Deafened",
                channelName: channel.name,
                targetId: targetMember.id
            }).catch(() => { });
            const embed = await usages_1.Usages.executedAction(guildId, "Deafen", `**__User has been server deafened in voice :__** <@${targetMember.id}>`);
            await interaction.reply({
                ...embed,
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (customId === "modal:temp_reject") {
            const durationStr = interaction.fields.getTextInputValue("duration").trim();
            const ms = this.parseDuration(durationStr);
            if (!ms || ms < 5000 || ms > 86400000) {
                await interaction.reply({
                    ...(await usages_1.Usages.impossible(guildId, "Invalid duration. Use format like 30s, 5m, 1h (min 5s, max 24h)")),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            await voice_permission_service_1.VoicePermissionsManager.rejectMember(channel, targetMember);
            const timerId = setTimeout(async () => {
                const stillChannel = interaction.guild?.channels.cache.get(channel.id);
                if (stillChannel && stillChannel instanceof discord_js_1.VoiceChannel) {
                    await Promise.resolve(voice_permission_service_1.VoicePermissionsManager.resetMember(stillChannel, targetMember)).catch(() => { });
                }
            }, ms);
            voice_lifecycle_service_1.VoiceLifecycleService.registerTempTimer(channel.id, timerId);
            action_logger_1.ActionLogger.logAction({
                guildId,
                executorId: member.id,
                action: "Member Temp Rejected",
                channelName: channel.name,
                targetId: targetMember.id,
                details: `Duration: \`${durationStr}\``
            }).catch(() => { });
            const embed = await usages_1.Usages.executedAction(guildId, "Temp Reject", `**__User temporarily rejected for \`${durationStr}\` :__** <@${targetMember.id}>`);
            await interaction.reply({
                ...embed,
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                allowedMentions: { parse: [] }
            });
        }
    }
    static async extractTargetMember(interaction) {
        try {
            const raw = interaction.fields.getTextInputValue("target_user")?.trim();
            if (!raw)
                return null;
            const rawId = raw.replace(/[<@!>]/g, "");
            if (/^\d{17,20}$/.test(rawId)) {
                const member = await interaction.guild?.members.fetch(rawId).catch(() => null);
                if (member)
                    return member;
            }
            const search = raw.toLowerCase().replace(/^@/, "");
            const found = interaction.guild?.members.cache.find((m) => m.user.username.toLowerCase() === search ||
                m.user.globalName?.toLowerCase() === search ||
                m.displayName.toLowerCase() === search);
            if (found)
                return found;
        }
        catch { }
        return null;
    }
    static parseDuration(input) {
        const match = input.match(/^(\d+)\s*(s|sec|seconds?|m|min|minutes?|h|hours?)$/i);
        if (!match)
            return null;
        const value = parseInt(match[1] ?? "0", 10);
        const unit = (match[2] ?? "").toLowerCase();
        if (unit.startsWith("s"))
            return value * 1000;
        if (unit.startsWith("m"))
            return value * 60 * 1000;
        if (unit.startsWith("h"))
            return value * 60 * 60 * 1000;
        return null;
    }
}
exports.VoiceModalHandler = VoiceModalHandler;
