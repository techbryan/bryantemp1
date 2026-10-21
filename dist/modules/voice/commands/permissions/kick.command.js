"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kickCommand = void 0;
const voice_auth_service_1 = require("../../services/voice-auth.service");
const voice_permission_service_1 = require("../../services/voice-permission.service");
const usages_1 = require("../../../../shared/embeds/usages");
const member_parser_1 = require("../../../../shared/utils/member-parser");
exports.kickCommand = {
    name: "kick",
    prefixAliases: ["kick", "kkick", "dc", "disconnect"],
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
        const extracted = await (0, member_parser_1.extractTargetMembers)(message, args);
        const targets = extracted.filter((m) => m.voice.channelId === channel.id && voice_auth_service_1.VoiceAuthService.canManageTarget(channel.id, member.id, m.id, message.guild));
        if (targets.length === 0) {
            await message.reply({
                ...(await usages_1.Usages.invalidCommand(guildId, "`.v kick`")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        await Promise.all(targets.map((m) => voice_permission_service_1.VoicePermissionsManager.kickMember(channel, m)));
        const ids = targets.map((m) => m.id);
        const embed = await usages_1.Usages.executedAction(guildId, "Kick", usages_1.Usages.formatUserTarget("kicked", ids));
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
    }
};
