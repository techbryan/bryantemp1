"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.needhelpCommand = exports.NeedHelpService = void 0;
const guild_store_1 = require("../../cache/guild.store");
const usages_1 = require("../../../../shared/embeds/usages");
const needHelpCooldowns = new Map();
class NeedHelpService {
    static COOLDOWN_SECONDS = 15;
    static checkCooldown(userId) {
        const lastUsed = needHelpCooldowns.get(userId);
        if (!lastUsed)
            return { onCooldown: false, remainingSeconds: 0 };
        const diff = Math.floor((Date.now() - lastUsed) / 1000);
        if (diff < this.COOLDOWN_SECONDS) {
            return { onCooldown: true, remainingSeconds: this.COOLDOWN_SECONDS - diff };
        }
        return { onCooldown: false, remainingSeconds: 0 };
    }
    static setCooldown(userId) {
        needHelpCooldowns.set(userId, Date.now());
    }
    static async execute(member, guildId) {
        const cooldown = this.checkCooldown(member.id);
        if (cooldown.onCooldown) {
            const payload = await usages_1.Usages.cooldownNotice(guildId, `${cooldown.remainingSeconds}s`);
            return { success: false, payload };
        }
        if (!member.voice.channel) {
            const payload = await usages_1.Usages.notInVoice(guildId);
            return { success: false, payload };
        }
        const config = guild_store_1.GuildMemoryStore.resolve(guildId) ?? await guild_store_1.GuildMemoryStore.resolveAsync(guildId);
        if (!config?.supportVoiceChannelId) {
            const payload = await usages_1.Usages.impossible(guildId, "Need Help voice channel has not been configured in setup");
            return { success: false, payload };
        }
        const supportChannel = member.guild.channels.cache.get(config.supportVoiceChannelId);
        if (!supportChannel || !supportChannel.isVoiceBased()) {
            const payload = await usages_1.Usages.impossible(guildId, "Configured Need Help voice channel was not found");
            return { success: false, payload };
        }
        if (member.voice.channelId === supportChannel.id) {
            const payload = await usages_1.Usages.alreadyAction(guildId, "You are already in the Need Help voice channel");
            return { success: false, payload };
        }
        try {
            await member.voice.setChannel(supportChannel);
            this.setCooldown(member.id);
            const payload = await usages_1.Usages.executedAction(guildId, "Need Help", `Moved to Need Help channel : <#${supportChannel.id}>`);
            return { success: true, payload };
        }
        catch {
            const payload = await usages_1.Usages.impossible(guildId, "Could not move you to the Need Help channel");
            return { success: false, payload };
        }
    }
}
exports.NeedHelpService = NeedHelpService;
exports.needhelpCommand = {
    name: "needhelp",
    prefixAliases: ["needhelp", "helpme", "supportvc"],
    async executePrefix(message) {
        const member = message.member;
        const guildId = message.guildId;
        if (!member || !guildId)
            return;
        const result = await NeedHelpService.execute(member, guildId);
        await message.reply({ ...result.payload, allowedMentions: { parse: [] } });
    }
};
