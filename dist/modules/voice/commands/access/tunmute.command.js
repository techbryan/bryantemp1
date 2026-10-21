"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tunmuteCommand = void 0;
const voice_auth_service_1 = require("../../services/voice-auth.service");
const voice_permission_service_1 = require("../../services/voice-permission.service");
const usages_1 = require("../../../../shared/embeds/usages");
const member_parser_1 = require("../../../../shared/utils/member-parser");
exports.tunmuteCommand = {
    name: "tunmute",
    prefixAliases: ["tunmute", "textunmute"],
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
                ...(await usages_1.Usages.invalidCommand(guildId, "`.v tunmute`", "@user | username | `ID`")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        await Promise.all(targets.map((t) => voice_permission_service_1.VoicePermissionsManager.muteUserText(channel, t, false)));
        const embed = await usages_1.Usages.executedAction(guildId, "Text Unmute", usages_1.Usages.formatUserTarget("unmuted in chat", targets.map((t) => t.id)));
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
    }
};
