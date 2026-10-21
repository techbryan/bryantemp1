"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ownerCommand = void 0;
const voice_permission_service_1 = require("../../services/voice-permission.service");
const voice_store_1 = require("../../cache/voice.store");
const usages_1 = require("../../../../shared/embeds/usages");
const member_parser_1 = require("../../../../shared/utils/member-parser");
exports.ownerCommand = {
    name: "owner",
    prefixAliases: ["owner", "transfer"],
    async executePrefix(message, args) {
        const member = message.member;
        const channel = member.voice.channel;
        const guildId = message.guildId;
        if (!channel) {
            await message.reply({ ...(await usages_1.Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
            return;
        }
        const session = voice_store_1.VoiceMemoryStore.get(channel.id);
        if (!session) {
            await message.reply({ ...(await usages_1.Usages.impossible(guildId, "**__Channel is not managed :__**")), allowedMentions: { parse: [] } });
            return;
        }
        if (!args[0]) {
            const embed = await usages_1.Usages.executedAction(guildId, "Owner", `**__Current owner is__** <@${session.ownerId}>`);
            await message.reply({ ...embed, allowedMentions: { parse: [] } });
            return;
        }
        const targets = await (0, member_parser_1.extractTargetMembers)(message, args, 1);
        if (targets.length === 0) {
            await message.reply({ ...(await usages_1.Usages.impossible(guildId, "**__User not found :__**")), allowedMentions: { parse: [] } });
            return;
        }
        const targetMember = targets[0];
        const result = await voice_permission_service_1.VoicePermissionsManager.executeTransferOwner(channel, member, targetMember);
        switch (result.status) {
            case "not_in_voice": {
                await message.reply({ ...(await usages_1.Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
                return;
            }
            case "not_owner": {
                await message.reply({ ...(await usages_1.Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
                return;
            }
            case "target_is_self": {
                const embed = await usages_1.Usages.alreadyAction(guildId, "You are already the channel owner");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            case "target_is_bot": {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "**__You cannot transfer ownership to a bot :__**")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "target_not_in_channel": {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "**__Target user is not in the voice channel :__**")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "failed": {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "**__Failed to transfer ownership on Discord :__**")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "transferred": {
                const embed = await usages_1.Usages.executedAction(guildId, "Transfer", `**__Ownership Transferred :__** Transferred channel ownership to <@${result.newOwner.id}>`);
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
        }
    }
};
