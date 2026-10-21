"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bitrateCommand = void 0;
const voice_settings_service_1 = require("../../services/voice-settings.service");
const usages_1 = require("../../../../shared/embeds/usages");
exports.bitrateCommand = {
    name: "bitrate",
    prefixAliases: ["bitrate", "quality", "br"],
    async executePrefix(message, args) {
        const member = message.member;
        const channel = member.voice.channel;
        const guildId = message.guildId;
        const raw = args[0]?.toLowerCase().replace(/kbps|k/g, "").trim();
        const result = await voice_settings_service_1.VoiceSettingsService.setBitrate(channel, member, raw || "");
        switch (result.status) {
            case "not_in_voice": {
                await message.reply({ ...(await usages_1.Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
                return;
            }
            case "not_manager": {
                await message.reply({ ...(await usages_1.Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
                return;
            }
            case "invalid_bitrate": {
                await message.reply({
                    ...(await usages_1.Usages.invalidCommand(guildId, `\`.v bitrate <8-${result.maxAllowedKbps}>\``, "`.v bitrate 64` | `.v bitrate 128`")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "same_bitrate": {
                const embed = await usages_1.Usages.alreadyAction(guildId, `Voice channel bitrate is already \`${result.bitrateKbps} kbps\``);
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            case "failed": {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "**__Failed to update bitrate on Discord :__**")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "updated": {
                const embed = await usages_1.Usages.executedAction(guildId, "Bitrate", `**__Voice Channel Bitrate set to__** **\`${result.bitrateKbps} kbps\`**`);
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
        }
    }
};
