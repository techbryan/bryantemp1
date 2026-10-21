"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixlagCommand = void 0;
const discord_js_1 = require("discord.js");
const voice_auth_service_1 = require("../../services/voice-auth.service");
const replies_1 = require("../../../../shared/embeds/replies");
const usages_1 = require("../../../../shared/embeds/usages");
exports.fixlagCommand = {
    name: "fixlag",
    prefixAliases: ["fixlag"],
    async executePrefix(message) {
        const member = message.member;
        const channel = member instanceof discord_js_1.GuildMember ? member.voice.channel : null;
        const guildId = message.guildId;
        if (!guildId)
            return;
        if (!channel) {
            await message.reply({
                ...(await replies_1.Replies.notInVoice(guildId)),
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (!voice_auth_service_1.VoiceAuthService.isManager(channel.id, member?.id ?? "")) {
            await message.reply({
                ...(await replies_1.Replies.notAuthorized(guildId)),
                allowedMentions: { parse: [] }
            });
            return;
        }
        const current = channel.rtcRegion;
        const next = current === "rotterdam" ? "frankfurt" : "rotterdam";
        await channel.setRTCRegion(next);
        await channel.setRTCRegion(null);
        const embed = await usages_1.Usages.executedAction(guildId, "Lag Resolved", "**__Voice region reset to Discord Automatic Optimization.__**");
        await message.reply({
            ...embed,
            allowedMentions: { parse: [] }
        });
    }
};
