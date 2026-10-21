"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unclaimCommand = void 0;
const voice_auth_service_1 = require("../../services/voice-auth.service");
const voice_store_1 = require("../../cache/voice.store");
const usages_1 = require("../../../../shared/embeds/usages");
exports.unclaimCommand = {
    name: "unclaim",
    prefixAliases: ["unclaim"],
    async executePrefix(message) {
        const member = message.member;
        const channel = member.voice.channel;
        const guildId = message.guildId;
        if (!channel) {
            await message.reply({ ...(await usages_1.Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
            return;
        }
        const session = voice_store_1.VoiceMemoryStore.get(channel.id);
        if (!session) {
            await message.reply({ ...(await usages_1.Usages.impossible(guildId, "**__Channel is not managed :__**")), allowedMentions: { parse: [] } });
            return;
        }
        if (!voice_auth_service_1.VoiceAuthService.isOwner(channel.id, member.id)) {
            await message.reply({ ...(await usages_1.Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
            return;
        }
        await channel.permissionOverwrites.delete(member.id).catch(() => { });
        voice_store_1.VoiceMemoryStore.reassignOwner(channel.id, session.originalOwnerId);
        voice_store_1.VoiceMemoryStore.sync(channel.id);
        await channel.permissionOverwrites.edit(session.originalOwnerId, {
            Connect: true,
            ViewChannel: true,
            SendMessages: true,
            Speak: true,
            Stream: true,
            MoveMembers: true
        }).catch(() => { });
        const embed = await usages_1.Usages.executedAction(guildId, "Unclaim", `**__Ownership Restored :__** Ownership returned to <@${session.originalOwnerId}>.`);
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
    }
};
