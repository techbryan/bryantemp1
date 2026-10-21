"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unmuteCommand = void 0;
const voice_auth_service_1 = require("../../services/voice-auth.service");
const voice_store_1 = require("../../cache/voice.store");
const usages_1 = require("../../../../shared/embeds/usages");
const member_parser_1 = require("../../../../shared/utils/member-parser");
exports.unmuteCommand = {
    name: "unmute",
    prefixAliases: ["unmute", "vunmute"],
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
                ...(await usages_1.Usages.invalidCommand(guildId, "`.v unmute`")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        const session = voice_store_1.VoiceMemoryStore.get(channel.id);
        if (session?.channelMutes) {
            for (const t of targets) {
                session.channelMutes.delete(t.id);
            }
        }
        await Promise.all(targets.map((t) => {
            if (t.voice.channelId === channel.id) {
                return t.voice.setMute(false).catch(() => { });
            }
            return Promise.resolve();
        }));
        const embed = await usages_1.Usages.executedAction(guildId, "Unmute", usages_1.Usages.formatUserTarget("server unmuted in voice", targets.map((t) => t.id)));
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
    }
};
