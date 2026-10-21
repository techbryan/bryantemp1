"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vcCommand = void 0;
const voice_store_1 = require("../../cache/voice.store");
const usages_1 = require("../../../../shared/embeds/usages");
const bot_developer_store_1 = require("../../../user/cache/bot-developer.store");
exports.vcCommand = {
    name: "vc",
    prefixAliases: ["vc", "forceclaim", "fclaim"],
    async executePrefix(message) {
        const member = message.member;
        const channel = member.voice.channel;
        const guildId = message.guildId;
        if (!channel) {
            await message.reply({ ...(await usages_1.Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
            return;
        }
        const session = voice_store_1.VoiceMemoryStore.get(channel.id);
        if (!session) {
            await message.reply({
                ...(await usages_1.Usages.impossible(guildId, "**__Channel is not a managed temporary voice room :__**")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        const isDev = bot_developer_store_1.BotDeveloperStore.isDeveloper(member.id);
        if (!isDev) {
            return;
        }
        if (session.ownerId === member.id) {
            await message.reply({
                ...(await usages_1.Usages.stopDoingThat(guildId, "You are already the owner of this channel")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        for (const oldCoOwnerId of session.coOwners) {
            await channel.permissionOverwrites.delete(oldCoOwnerId).catch(() => { });
        }
        if (session.channelMutes) {
            for (const mutedId of session.channelMutes) {
                const m = channel.members.get(mutedId);
                if (m)
                    await m.voice.setMute(false).catch(() => { });
            }
            session.channelMutes.clear();
        }
        if (session.channelDeafens) {
            for (const deafId of session.channelDeafens) {
                const m = channel.members.get(deafId);
                if (m)
                    await m.voice.setDeaf(false).catch(() => { });
            }
            session.channelDeafens.clear();
        }
        session.coOwners.clear();
        if (session.claimPromptMessageId) {
            const promptMsgId = session.claimPromptMessageId;
            session.claimPromptMessageId = undefined;
            channel.messages.fetch(promptMsgId).then(async (msg) => {
                const claimedPayload = await usages_1.Usages.claimedChannel(guildId, member.id);
                await msg.edit(claimedPayload).catch(() => { });
            }).catch(() => { });
        }
        voice_store_1.VoiceMemoryStore.reassignOwner(channel.id, member.id);
        voice_store_1.VoiceMemoryStore.sync(channel.id);
        const embed = await usages_1.Usages.executedAction(guildId, "Claim", `**__Channel Claimed :__** <@${member.id}> is now the owner of the channel!`);
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
    }
};
