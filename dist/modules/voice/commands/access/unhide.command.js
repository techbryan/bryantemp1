"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unhideCommand = void 0;
const voice_permission_service_1 = require("../../services/voice-permission.service");
const usages_1 = require("../../../../shared/embeds/usages");
exports.unhideCommand = {
    name: "unhide",
    prefixAliases: ["unhide"],
    async executePrefix(message) {
        const member = message.member;
        const channel = member.voice.channel;
        const guildId = message.guildId;
        const result = await voice_permission_service_1.VoicePermissionsManager.executeHide(channel, member, false);
        switch (result.status) {
            case "not_in_voice": {
                await message.reply({ ...(await usages_1.Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
                return;
            }
            case "not_manager": {
                await message.reply({ ...(await usages_1.Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
                return;
            }
            case "already_unhidden": {
                const embed = await usages_1.Usages.alreadyAction(guildId, "The channel is already visible");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            case "failed": {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "**__Failed to unhide channel on Discord :__**")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "unhidden": {
                const embed = await usages_1.Usages.executedAction(guildId, "Unhide", "**__Channel is now visible :__** The channel is now visible to members.");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
        }
    }
};
