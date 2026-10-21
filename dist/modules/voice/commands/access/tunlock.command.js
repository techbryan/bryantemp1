"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tunlockCommand = void 0;
const voice_permission_service_1 = require("../../services/voice-permission.service");
const usages_1 = require("../../../../shared/embeds/usages");
exports.tunlockCommand = {
    name: "tunlock",
    prefixAliases: ["tunlock"],
    async executePrefix(message) {
        const member = message.member;
        const channel = member.voice.channel;
        const guildId = message.guildId;
        const result = await voice_permission_service_1.VoicePermissionsManager.executeTextLock(channel, member, false);
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
                const embed = await usages_1.Usages.alreadyAction(guildId, "Text chat is already unlocked");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            case "failed": {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "**__Failed to unlock text chat on Discord :__**")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "unlocked": {
                const embed = await usages_1.Usages.executedAction(guildId, "Text Unlock", "**__Text chat has been unlocked :__** Everyone can send messages.");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            default: {
                return;
            }
        }
    }
};
