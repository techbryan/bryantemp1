"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusCommand = void 0;
const discord_js_1 = require("discord.js");
const voice_settings_service_1 = require("../../services/voice-settings.service");
const usages_1 = require("../../../../shared/embeds/usages");
exports.statusCommand = {
    name: "status",
    prefixAliases: ["status", "vstatus", "setstatus"],
    async executePrefix(message, args) {
        const member = message.member;
        if (!member || !(member instanceof discord_js_1.GuildMember))
            return;
        const channel = member.voice.channel;
        const guildId = message.guildId;
        if (!guildId)
            return;
        const newStatus = args.join(" ").trim();
        const result = await voice_settings_service_1.VoiceSettingsService.setStatus(channel, member, newStatus);
        switch (result.status) {
            case "not_in_voice": {
                await message.reply({ ...(await usages_1.Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
                return;
            }
            case "not_manager": {
                await message.reply({ ...(await usages_1.Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
                return;
            }
            case "invalid_status": {
                await message.reply({
                    ...(await usages_1.Usages.invalidInputWarning(guildId)),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "same_status": {
                const embed = await usages_1.Usages.alreadyAction(guildId, `Voice status is already set to \`${result.textStatus}\``);
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            case "cleared": {
                const embed = await usages_1.Usages.executedAction(guildId, "Voice Status", "Voice channel status has been cleared.");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            case "failed": {
                const embed = await usages_1.Usages.impossible(guildId, "**__Failed to update voice status on Discord :__**");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            case "updated": {
                const embed = await usages_1.Usages.executedAction(guildId, "Voice Status", `Voice status updated to : \`${result.textStatus}\``);
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
        }
    }
};
