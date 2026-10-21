"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tlockCommand = void 0;
const voice_permission_service_1 = require("../../services/voice-permission.service");
const usages_1 = require("../../../../shared/embeds/usages");
exports.tlockCommand = {
    name: "tlock",
    prefixAliases: ["tlock"],
    async executePrefix(message) {
        const member = message.member;
        const channel = member.voice.channel;
        const guildId = message.guildId;
        const result = await voice_permission_service_1.VoicePermissionsManager.executeTextLock(channel, member, true);
        switch (result.status) {
            case "not_in_voice": {
                await message.reply({ ...(await usages_1.Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
                return;
            }
            case "not_manager": {
                await message.reply({ ...(await usages_1.Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
                return;
            }
            case "already_locked": {
                const embed = await usages_1.Usages.alreadyAction(guildId, "Text chat is already locked");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            case "failed": {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "**__Failed to lock text chat on Discord :__**")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "locked": {
                const embed = await usages_1.Usages.executedAction(guildId, "Text Lock", "**__Text chat has been locked :__** Only Managers and Permitted users can send messages.");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            default: {
                return;
            }
        }
    }
};
