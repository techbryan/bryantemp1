"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.regionCommand = void 0;
const voice_settings_service_1 = require("../../services/voice-settings.service");
const usages_1 = require("../../../../shared/embeds/usages");
const REGION_OPTIONS = [
    "auto",
    "brazil",
    "rotterdam",
    "hongkong",
    "india",
    "japan",
    "russia",
    "singapore",
    "southafrica",
    "sydney",
    "us-central",
    "us-east",
    "us-south",
    "us-west"
];
exports.regionCommand = {
    name: "region",
    prefixAliases: ["region", "rtc", "serverregion"],
    async executePrefix(message, args) {
        const member = message.member;
        const channel = member.voice.channel;
        const guildId = message.guildId;
        const input = args[0]?.toLowerCase().trim() || "";
        const result = await voice_settings_service_1.VoiceSettingsService.setRegion(channel, member, input);
        switch (result.status) {
            case "not_in_voice": {
                await message.reply({ ...(await usages_1.Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
                return;
            }
            case "not_manager": {
                await message.reply({ ...(await usages_1.Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
                return;
            }
            case "invalid_region": {
                const regionList = REGION_OPTIONS.map((r) => `\`${r}\``).join(", ");
                await message.reply({
                    ...(await usages_1.Usages.invalidCommand(guildId, "`.v region <location>`", `Available: ${regionList}`)),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "same_region": {
                const embed = await usages_1.Usages.alreadyAction(guildId, `Voice channel region is already set to \`${result.region || "AUTOMATIC"}\``);
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            case "failed": {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "**__Failed to update region on Discord :__**")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "updated": {
                const display = result.region ? result.region.toUpperCase() : "AUTOMATIC";
                const embed = await usages_1.Usages.executedAction(guildId, "Region", `**__Voice Region changed to__** **\`${display}\`**`);
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
        }
    }
};
