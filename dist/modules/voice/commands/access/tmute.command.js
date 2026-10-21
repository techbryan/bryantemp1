"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tmuteCommand = void 0;
const voice_auth_service_1 = require("../../services/voice-auth.service");
const voice_permission_service_1 = require("../../services/voice-permission.service");
const usages_1 = require("../../../../shared/embeds/usages");
const member_parser_1 = require("../../../../shared/utils/member-parser");
exports.tmuteCommand = {
    name: "tmute",
    prefixAliases: ["tmute", "textmute"],
    async executePrefix(message, args) {
        const member = message.member;
        const channel = member.voice.channel;
        const guildId = message.guildId;
        if (!channel) {
            await message.reply({ ...(await usages_1.Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
            return;
        }
        if (!voice_auth_service_1.VoiceAuthService.isManager(channel.id, member.id)) {
            await message.reply({ ...(await usages_1.Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
            return;
        }
        const targets = await (0, member_parser_1.extractTargetMembers)(message, args);
        if (targets.length === 0) {
            await message.reply({
                ...(await usages_1.Usages.invalidCommand(guildId, "`.v tmute`", "@user | username | `ID`")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (targets.some((t) => t.id === member.id)) {
            await message.reply({
                ...(await usages_1.Usages.stopDoingThat(guildId, "You Can't Mute yourself in chat")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        const validTargets = targets.filter((t) => {
            return voice_auth_service_1.VoiceAuthService.canManageTarget(channel.id, member.id, t.id, message.guild);
        });
        if (validTargets.length === 0) {
            await message.reply({
                ...(await usages_1.Usages.impossible(guildId, "You cannot mute room managers or owners")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        await Promise.all(validTargets.map((t) => voice_permission_service_1.VoicePermissionsManager.muteUserText(channel, t, true)));
        const embed = await usages_1.Usages.executedAction(guildId, "Text Mute", usages_1.Usages.formatUserTarget("muted in chat", validTargets.map((t) => t.id)));
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
    }
};
