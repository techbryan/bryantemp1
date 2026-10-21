"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.limitCommand = void 0;
const voice_settings_service_1 = require("../../services/voice-settings.service");
const usages_1 = require("../../../../shared/embeds/usages");
exports.limitCommand = {
    name: "limit",
    prefixAliases: ["limit"],
    async executePrefix(message, args) {
        const member = message.member;
        const channel = member.voice.channel;
        const guildId = message.guildId;
        const result = await voice_settings_service_1.VoiceSettingsService.setLimit(channel, member, args[0]);
        switch (result.status) {
            case "not_in_voice": {
                await message.reply({ ...(await usages_1.Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
                return;
            }
            case "not_manager": {
                await message.reply({ ...(await usages_1.Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
                return;
            }
            case "invalid_limit": {
                await message.reply({
                    ...(await usages_1.Usages.invalidCommand(guildId, "`.v limit <0-99>`")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "same_limit": {
                const embed = await usages_1.Usages.alreadyAction(guildId, `The channel limit is already set to \`${result.limit}\``);
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            case "failed": {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "**__Failed to update user limit on Discord :__**")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "updated": {
                const embed = await usages_1.Usages.executedAction(guildId, "Limit", `Voice channel limit updated to : \`${result.limit}\``);
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
        }
    }
};
