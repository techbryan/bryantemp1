"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renameCommand = exports.nameCommand = void 0;
const voice_settings_service_1 = require("../../services/voice-settings.service");
const usages_1 = require("../../../../shared/embeds/usages");
exports.nameCommand = {
    name: "name",
    prefixAliases: ["name"],
    async executePrefix(message, args) {
        const member = message.member;
        const channel = member.voice.channel;
        const guildId = message.guildId;
        const rawName = args.join(" ");
        const result = await voice_settings_service_1.VoiceSettingsService.renameChannel(channel, member, rawName);
        switch (result.status) {
            case "not_in_voice": {
                await message.reply({ ...(await usages_1.Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
                return;
            }
            case "not_manager": {
                await message.reply({ ...(await usages_1.Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
                return;
            }
            case "empty_name": {
                await message.reply({
                    ...(await usages_1.Usages.invalidCommand(guildId, "`.v name <newname>`")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "invalid_name": {
                await message.reply({
                    ...(await usages_1.Usages.invalidInputWarning(guildId)),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "same_name": {
                const embed = await usages_1.Usages.alreadyAction(guildId, `The channel is already named \`${result.name}\``);
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            case "cooldown": {
                await message.reply({
                    ...(await usages_1.Usages.renameCooldown(guildId, result.retryAfterSeconds)),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "failed": {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "**__Failed to update channel name on Discord :__**")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "renamed": {
                const embed = await usages_1.Usages.executedAction(guildId, "Name", `Voice channel name updated to : \`${result.name}\``);
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
        }
    }
};
exports.renameCommand = exports.nameCommand;
