"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.abCommand = void 0;
const voice_auth_service_1 = require("../../services/voice-auth.service");
const voice_store_1 = require("../../cache/voice.store");
const usages_1 = require("../../../../shared/embeds/usages");
const replies_1 = require("../../../../shared/embeds/replies");
exports.abCommand = {
    name: "ab",
    prefixAliases: ["ab", "antiabuse"],
    async executePrefix(message, args) {
        const member = message.member;
        const channel = member.voice.channel;
        const guildId = message.guildId;
        if (!channel) {
            await message.reply({ ...(await usages_1.Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
            return;
        }
        if (!voice_auth_service_1.VoiceAuthService.isOwner(channel.id, member.id)) {
            await message.reply({ ...(await replies_1.Replies.notOwner(guildId)), allowedMentions: { parse: [] } });
            return;
        }
        const session = voice_store_1.VoiceMemoryStore.get(channel.id);
        if (!session) {
            await message.reply({ ...(await usages_1.Usages.impossible(guildId, "Channel is not a managed voice room")), allowedMentions: { parse: [] } });
            return;
        }
        const sub = args[0]?.toLowerCase();
        if (sub === "on") {
            session.antiAbuseEnabled = true;
        }
        else if (sub === "off") {
            session.antiAbuseEnabled = false;
        }
        else {
            session.antiAbuseEnabled = !(session.antiAbuseEnabled ?? true);
        }
        voice_store_1.VoiceMemoryStore.sync(channel.id);
        const statusText = session.antiAbuseEnabled
            ? "__Anti Abuse System Has been Turned On__"
            : "__Anti Abuse System Has been Turned Off__";
        const embed = await usages_1.Usages.executedAction(guildId, "Anti Abuse", statusText);
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
    }
};
