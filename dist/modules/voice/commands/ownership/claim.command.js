"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimCommand = void 0;
const voice_claim_service_1 = require("../../services/voice-claim.service");
const usages_1 = require("../../../../shared/embeds/usages");
exports.claimCommand = {
    name: "claim",
    prefixAliases: ["claim"],
    async executePrefix(message) {
        const member = message.member;
        const channel = member.voice.channel;
        const guildId = message.guildId;
        const result = await voice_claim_service_1.VoiceClaimService.claimChannel(channel, member);
        switch (result.status) {
            case "not_in_voice": {
                await message.reply({ ...(await usages_1.Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
                return;
            }
            case "not_active_voice": {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "**__Channel is not managed :__**")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "already_owner": {
                await message.reply({
                    ...(await usages_1.Usages.stopDoingThat(guildId, "You are already the owner of this channel")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "owner_still_present": {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "**__The owner is still inside the voice channel :__**")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "failed": {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "**__Failed to claim channel on Discord :__**")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            case "claimed": {
                const embed = await usages_1.Usages.executedAction(guildId, "Claim", `**__Channel Claimed :__** <@${member.id}> is now the owner of the channel!`);
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
        }
    }
};
