"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlockCommand = void 0;
const voice_permission_service_1 = require("../../services/voice-permission.service");
const usages_1 = require("../../../../shared/embeds/usages");
exports.unlockCommand = {
    name: "unlock",
    prefixAliases: ["unlock"],
    async executePrefix(message) {
        const member = message.member;
        const channel = member.voice.channel;
        const guildId = message.guildId;
        const result = await voice_permission_service_1.VoicePermissionsManager.executeLock(channel, member, false);
        switch (result.status) {
            case "not_in_voice": {
                await message.reply({ ...(await usages_1.Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
                return;
            }
            case "not_manager": {
                await message.reply({ ...(await usages_1.Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
                return;
            }
            case "already_unlocked": {
                const embed = await usages_1.Usages.alreadyAction(guildId, "The channel is already unlocked");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            case "failed": {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "**__Failed to unlock channel on Discord :__**")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "unlocked": {
                const embed = await usages_1.Usages.executedAction(guildId, "Unlock", "**__Channel has been unlocked__**");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
        }
    }
};
