"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceButtonHandler = void 0;
const discord_js_1 = require("discord.js");
const voice_auth_service_1 = require("../../../modules/voice/services/voice-auth.service");
const voice_permission_service_1 = require("../../../modules/voice/services/voice-permission.service");
const voice_store_1 = require("../../../modules/voice/cache/voice.store");
const guild_store_1 = require("../../../modules/voice/cache/guild.store");
const usages_1 = require("../../../shared/embeds/usages");
const replies_1 = require("../../../shared/embeds/replies");
const panel_builder_1 = require("../panel.builder");
const stats_command_1 = require("../../../modules/voice/commands/settings/stats.command");
const theme_1 = require("../../config/theme");
const action_logger_1 = require("../../logger/action.logger");
const needhelp_command_1 = require("../../../modules/voice/commands/management/needhelp.command");
function textInputRow(customId, label, placeholder, value, maxLength = 100) {
    const input = new discord_js_1.TextInputBuilder()
        .setCustomId(customId)
        .setLabel(label)
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder(placeholder);
    if (value)
        input.setValue(value);
    if (maxLength)
        input.setMaxLength(maxLength);
    return new discord_js_1.ActionRowBuilder().addComponents(input);
}
class VoiceButtonHandler {
    static async handle(interaction) {
        const member = interaction.member;
        if (!member || !(member instanceof discord_js_1.GuildMember))
            return;
        const guildId = interaction.guildId;
        if (!guildId)
            return;
        const customId = interaction.customId;
        if (customId === "btn:need_help") {
            const result = await needhelp_command_1.NeedHelpService.execute(member, guildId);
            await interaction.reply({
                ...result.payload,
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (customId === "btn:ticket") {
            const config = guild_store_1.GuildMemoryStore.resolve(guildId) ?? await guild_store_1.GuildMemoryStore.resolveAsync(guildId);
            if (config?.ticketTextChannelId) {
                await interaction.reply({
                    ...(await usages_1.Usages.executedAction(guildId, "Ticket", `Please open a ticket in <#${config.ticketTextChannelId}>`)),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
            }
            else {
                await interaction.reply({
                    ...(await usages_1.Usages.impossible(guildId, "Ticket channel has not been configured yet")),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
            }
            return;
        }
        if (customId.startsWith("btn_see_members:")) {
            const channelId = customId.split(":")[1];
            const targetChannel = (channelId ? interaction.guild?.channels.cache.get(channelId) : null) ?? member.voice.channel;
            if (!targetChannel || !(targetChannel instanceof discord_js_1.VoiceChannel)) {
                await interaction.reply({
                    ...(await usages_1.Usages.impossible(guildId, "Voice channel not found")),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            const color = await theme_1.ThemeManager.getColor(guildId);
            const accentColor = color ? (0, discord_js_1.resolveColor)(color) : null;
            const membersList = targetChannel.members.size > 0
                ? Array.from(targetChannel.members.values())
                    .map((m) => `> ### - <@${m.id}> / \`${m.id}\``)
                    .join("\n")
                : "> ### - *No users currently in channel*";
            const container = new discord_js_1.ContainerBuilder();
            if (accentColor)
                container.setAccentColor(accentColor);
            container
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# <a:cutehello:1546983161764773939> __All Users In Channel__`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(membersList))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
            await interaction.reply({
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                components: [container],
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (customId.startsWith("antiabuse_permit:") || customId.startsWith("antiabuse_deny:")) {
            const parts = customId.split(":");
            const action = parts[0];
            const targetChannelId = parts[1];
            const targetUserId = parts[2];
            if (!targetChannelId || !targetUserId)
                return;
            const session = voice_store_1.VoiceMemoryStore.get(targetChannelId);
            if (!session) {
                await interaction.reply({
                    ...(await usages_1.Usages.impossible(guildId, "Voice channel no longer active")),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            if (interaction.user.id !== session.ownerId && !voice_auth_service_1.VoiceAuthService.isManager(targetChannelId, interaction.user.id)) {
                await interaction.reply({
                    ...(await usages_1.Usages.notManagerOrOwner(guildId)),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            const targetChannel = interaction.guild?.channels.cache.get(targetChannelId);
            const voiceTargetChannel = targetChannel instanceof discord_js_1.VoiceChannel ? targetChannel : null;
            if (!voice_auth_service_1.VoiceAuthService.canManageTarget(targetChannelId, interaction.user.id, targetUserId, interaction.guild)) {
                await interaction.reply({
                    ...(await usages_1.Usages.impossible(guildId, "Cannot manage administrators or server managers")),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            if (action === "antiabuse_permit") {
                session.whitelist.add(targetUserId);
                voice_store_1.VoiceMemoryStore.sync(targetChannelId);
                if (session.antiAbuseAttempts?.has(targetUserId)) {
                    session.antiAbuseAttempts.delete(targetUserId);
                }
                const targetMember = interaction.guild?.members.cache.get(targetUserId);
                if (voiceTargetChannel && targetMember) {
                    await voice_permission_service_1.VoicePermissionsManager.permitMember(voiceTargetChannel, targetMember);
                }
                else if (voiceTargetChannel) {
                    await voiceTargetChannel.permissionOverwrites.edit(targetUserId, {
                        Connect: true,
                        ViewChannel: true,
                        SendMessages: true,
                        Speak: true,
                        Stream: true
                    }).catch(() => { });
                }
                const updatedNotice = await usages_1.Usages.antiAbuseActionCompleted(guildId, "Permit", session.ownerId, targetUserId);
                await interaction.update(updatedNotice).catch(async () => {
                    await interaction.message.edit(updatedNotice).catch(() => { });
                });
                return;
            }
            else {
                session.whitelist.delete(targetUserId);
                voice_store_1.VoiceMemoryStore.sync(targetChannelId);
                const targetMember = interaction.guild?.members.cache.get(targetUserId);
                if (voiceTargetChannel && targetMember) {
                    await voice_permission_service_1.VoicePermissionsManager.rejectMember(voiceTargetChannel, targetMember);
                }
                else if (voiceTargetChannel) {
                    await voiceTargetChannel.permissionOverwrites.edit(targetUserId, {
                        Connect: false,
                        ViewChannel: true,
                        SendMessages: false
                    }).catch(() => { });
                }
                if (targetMember && targetMember.voice.channelId === targetChannelId) {
                    await targetMember.voice.disconnect().catch(() => { });
                }
                const updatedNotice = await usages_1.Usages.antiAbuseActionCompleted(guildId, "Deny", session.ownerId, targetUserId);
                await interaction.update(updatedNotice).catch(async () => {
                    await interaction.message.edit(updatedNotice).catch(() => { });
                });
                return;
            }
        }
        let channel = member.voice.channel;
        if (!channel && interaction.channel && interaction.channel.isVoiceBased()) {
            channel = interaction.channel;
        }
        if (!channel) {
            await interaction.reply({
                ...(await usages_1.Usages.notInVoice(guildId)),
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
            }).catch(() => { });
            return;
        }
        const session = voice_store_1.VoiceMemoryStore.get(channel.id);
        if (!session) {
            await interaction.reply({
                ...(await usages_1.Usages.impossible(guildId, "This is not a managed temporary voice channel")),
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
            }).catch(() => { });
            return;
        }
        if (customId === "btn:claim") {
            if (!channel.members.has(member.id)) {
                await interaction.reply({
                    ...(await usages_1.Usages.notInVoice(guildId)),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            if (session.ownerId === member.id) {
                await interaction.reply({
                    ...(await usages_1.Usages.stopDoingThat(guildId, "You are already the owner of this channel")),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            const ownerInChannel = channel.members.has(session.ownerId);
            if (ownerInChannel) {
                await interaction.reply({
                    ...(await usages_1.Usages.impossible(guildId, "The owner is still inside the voice channel")),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            const oldOwnerId = session.ownerId;
            await voice_permission_service_1.VoicePermissionsManager.transferOwnership(channel, oldOwnerId, member);
            const claimedPayload = await usages_1.Usages.claimedChannel(guildId, member.id);
            if (session.claimPromptMessageId) {
                const promptMsgId = session.claimPromptMessageId;
                session.claimPromptMessageId = undefined;
                await interaction.update(claimedPayload).catch(async () => {
                    if (!channel)
                        return;
                    const msg = await channel.messages.fetch(promptMsgId).catch(() => null);
                    if (msg)
                        await msg.edit(claimedPayload).catch(() => { });
                });
            }
            else {
                await interaction.update(claimedPayload).catch(async () => {
                    await interaction.message.edit(claimedPayload).catch(() => { });
                });
            }
            action_logger_1.ActionLogger.logAction({
                guildId,
                executorId: member.id,
                action: "Channel Claimed",
                channelName: channel.name
            }).catch(() => { });
            return;
        }
        if (customId === "modal_open:transfer") {
            if (!voice_auth_service_1.VoiceAuthService.isOwner(channel.id, member.id)) {
                await interaction.reply({
                    ...(await usages_1.Usages.impossible(guildId, "Only the channel owner can transfer ownership")),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            await this.showUserSelectionModal(interaction, "modal:transfer", "Transfer Ownership", "Select New Owner", "Choose a member from your channel or type username/ID");
            return;
        }
        if (customId === "btn:extra") {
            if (!voice_auth_service_1.VoiceAuthService.isManager(channel.id, member.id)) {
                await interaction.reply({
                    ...(await usages_1.Usages.notManagerOrOwner(guildId)),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            const extraPanelPayload = await panel_builder_1.PanelBuilder.createExtraPanel(guildId);
            await interaction.reply({
                ...extraPanelPayload,
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        if (customId === "btn:antiabuse") {
            if (!voice_auth_service_1.VoiceAuthService.isOwner(channel.id, member.id)) {
                await interaction.reply({
                    ...(await replies_1.Replies.notOwner(guildId)),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            const currentState = session.antiAbuseEnabled ?? true;
            session.antiAbuseEnabled = !currentState;
            voice_store_1.VoiceMemoryStore.sync(channel.id);
            const statusText = session.antiAbuseEnabled
                ? "__Anti Abuse System Has been Turned On__"
                : "__Anti Abuse System Has been Turned Off__";
            const replyPayload = await usages_1.Usages.executedAction(guildId, "Anti Abuse", statusText);
            await interaction.reply({
                ...replyPayload,
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (customId === "btn:owner") {
            const embed = await usages_1.Usages.executedAction(guildId, "Owner", `**__Channel Owner :__** <@${session.ownerId}>`);
            await interaction.reply({
                ...embed,
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (customId === "btn:info") {
            const payload = await (0, stats_command_1.buildChannelInfoPayload)(channel, guildId);
            await interaction.reply({
                ...payload,
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (!voice_auth_service_1.VoiceAuthService.isManager(channel.id, member.id)) {
            await interaction.reply({
                ...(await usages_1.Usages.notManagerOrOwner(guildId)),
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
            }).catch(() => { });
            return;
        }
        if (customId === "btn:reset") {
            const current = channel.rtcRegion;
            const next = current === "rotterdam" ? "frankfurt" : (current ? null : "rotterdam");
            await channel.setRTCRegion(next).catch(() => { });
            action_logger_1.ActionLogger.logAction({
                guildId,
                executorId: member.id,
                action: "Channel Reset",
                channelName: channel.name
            }).catch(() => { });
            const embed = await usages_1.Usages.executedAction(guildId, "Reset", "**__Voice channel settings & region have been refreshed.__**");
            await interaction.reply({
                ...embed,
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (customId === "modal_open:reject") {
            await this.showUserSelectionModal(interaction, "modal:reject", "Reject Member", "Select Member to Reject", "Choose a member or enter username/ID to reject from voice");
            return;
        }
        if (customId === "modal_open:permit") {
            await this.showUserSelectionModal(interaction, "modal:permit", "Permit Member", "Select Member to Permit", "Choose a member or enter username/ID to permit into voice");
            return;
        }
        if (customId === "modal_open:mute") {
            await this.showUserSelectionModal(interaction, "modal:mute", "Mute Member In VC", "Select Member to Mute", "Choose a member or enter username/ID to server mute");
            return;
        }
        if (customId === "modal_open:deafen") {
            await this.showUserSelectionModal(interaction, "modal:deafen", "Deafen Member In VC", "Select Member to Deafen", "Choose a member or enter username/ID to server deafen");
            return;
        }
        if (customId === "modal_open:temp_reject") {
            const modal = new discord_js_1.ModalBuilder()
                .setCustomId("modal:temp_reject")
                .setTitle("Temp Reject Member")
                .addComponents(textInputRow("target_user", "Member to Temp Reject (@user or ID)", "@user"), textInputRow("duration", "Duration (e.g. 30s, 5m, 1h)", "10m"));
            await interaction.showModal(modal);
            return;
        }
        if (customId === "modal_open:rename") {
            const modal = new discord_js_1.ModalBuilder()
                .setCustomId("modal:rename")
                .setTitle("Rename Voice Channel")
                .addComponents(textInputRow("channel_name", "New Channel Name", "My Voice Channel", channel.name, 100));
            await interaction.showModal(modal);
            return;
        }
        if (customId === "modal_open:limit") {
            const modal = new discord_js_1.ModalBuilder()
                .setCustomId("modal:limit")
                .setTitle("Set User Limit")
                .addComponents(textInputRow("room_limit", "User Limit (0-99)", "0", channel.userLimit ? channel.userLimit.toString() : "0", 2));
            await interaction.showModal(modal);
            return;
        }
        if (customId === "btn:lock") {
            if (session.isLocked) {
                await interaction.reply({
                    ...await usages_1.Usages.alreadyAction(guildId, "The channel is already locked"),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            session.isLocked = true;
            voice_store_1.VoiceMemoryStore.sync(channel.id);
            const embedPromise = usages_1.Usages.executedAction(guildId, "Lock", "**__Channel has been locked__**");
            const replyPromise = embedPromise.then((embed) => interaction.reply({
                ...embed,
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                allowedMentions: { parse: [] }
            }));
            void voice_permission_service_1.VoicePermissionsManager.setConnectionLock(channel, true);
            void action_logger_1.ActionLogger.logAction({
                guildId,
                executorId: member.id,
                action: "Channel Locked",
                channelName: channel.name
            });
            await replyPromise;
            return;
        }
        if (customId === "btn:unlock") {
            if (!session.isLocked) {
                await interaction.reply({
                    ...await usages_1.Usages.alreadyAction(guildId, "The channel is already unlocked"),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            session.isLocked = false;
            voice_store_1.VoiceMemoryStore.sync(channel.id);
            const embedPromise = usages_1.Usages.executedAction(guildId, "Unlock", "**__Channel has been unlocked__**");
            const replyPromise = embedPromise.then((embed) => interaction.reply({
                ...embed,
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                allowedMentions: { parse: [] }
            }));
            void voice_permission_service_1.VoicePermissionsManager.setConnectionLock(channel, false);
            void action_logger_1.ActionLogger.logAction({
                guildId,
                executorId: member.id,
                action: "Channel Unlocked",
                channelName: channel.name
            });
            await replyPromise;
            return;
        }
        if (customId === "btn:hide") {
            if (session.isHidden) {
                await interaction.reply({
                    ...await usages_1.Usages.alreadyAction(guildId, "The channel is already hidden"),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            session.isHidden = true;
            voice_store_1.VoiceMemoryStore.sync(channel.id);
            const embedPromise = usages_1.Usages.executedAction(guildId, "Hide", "**__Channel has been hidden :__** The channel is now invisible to members.");
            const replyPromise = embedPromise.then((embed) => interaction.reply({
                ...embed,
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                allowedMentions: { parse: [] }
            }));
            void voice_permission_service_1.VoicePermissionsManager.setVisibility(channel, true);
            void action_logger_1.ActionLogger.logAction({
                guildId,
                executorId: member.id,
                action: "Channel Hidden",
                channelName: channel.name
            });
            await replyPromise;
            return;
        }
        if (customId === "btn:unhide") {
            if (!session.isHidden) {
                await interaction.reply({
                    ...await usages_1.Usages.alreadyAction(guildId, "The channel is already visible"),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            session.isHidden = false;
            voice_store_1.VoiceMemoryStore.sync(channel.id);
            const embedPromise = usages_1.Usages.executedAction(guildId, "Unhide", "**__Channel is now visible :__** The channel is now visible to members.");
            const replyPromise = embedPromise.then((embed) => interaction.reply({
                ...embed,
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                allowedMentions: { parse: [] }
            }));
            void voice_permission_service_1.VoicePermissionsManager.setVisibility(channel, false);
            void action_logger_1.ActionLogger.logAction({
                guildId,
                executorId: member.id,
                action: "Channel Unhidden",
                channelName: channel.name
            });
            await replyPromise;
            return;
        }
        if (customId === "btn:random_reject") {
            const candidates = Array.from(channel.members.values()).filter((m) => m.id !== member.id && m.id !== session.ownerId);
            if (candidates.length === 0) {
                await interaction.reply({
                    ...(await usages_1.Usages.impossible(guildId, "No other eligible members in voice to reject")),
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            const randomTarget = candidates[Math.floor(Math.random() * candidates.length)];
            if (!randomTarget)
                return;
            if (session.coOwners.has(randomTarget.id)) {
                void voice_permission_service_1.VoicePermissionsManager.kickMember(channel, randomTarget);
                void action_logger_1.ActionLogger.logAction({
                    guildId,
                    executorId: member.id,
                    action: "Random Kick",
                    channelName: channel.name,
                    targetId: randomTarget.id
                });
                const embed = await usages_1.Usages.executedAction(guildId, "Random Kick", usages_1.Usages.formatUserTarget("kicked", [randomTarget.id]));
                await interaction.reply({
                    ...embed,
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                    allowedMentions: { parse: [] }
                });
                return;
            }
            void voice_permission_service_1.VoicePermissionsManager.rejectMember(channel, randomTarget);
            void action_logger_1.ActionLogger.logAction({
                guildId,
                executorId: member.id,
                action: "Random Reject",
                channelName: channel.name,
                targetId: randomTarget.id
            });
            const embed = await usages_1.Usages.executedAction(guildId, "Random Reject", usages_1.Usages.formatUserTarget("rejected", [randomTarget.id]));
            await interaction.reply({
                ...embed,
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                allowedMentions: { parse: [] }
            });
        }
    }
    static async showUserSelectionModal(interaction, customId, title, selectLabel, selectDesc) {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId(customId)
            .setTitle(title)
            .addComponents(textInputRow("target_user", "Member (@user, username, or ID)", "@user"));
        await interaction.showModal(modal);
    }
}
exports.VoiceButtonHandler = VoiceButtonHandler;
