"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onetapCommand = void 0;
const guild_store_1 = require("../../cache/guild.store");
const usages_1 = require("../../../../shared/embeds/usages");
exports.onetapCommand = {
    name: "tap",
    prefixAliases: ["tap", "onetap"],
    async executePrefix(message) {
        const guildId = message.guildId;
        if (!guildId)
            return;
        const config = await guild_store_1.GuildMemoryStore.resolve(guildId);
        if (!config || !config.generatorId) {
            await message.reply({
                ...(await usages_1.Usages.impossible(guildId, "**__Setup channel is not configured on this server :__**")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        const member = message.member;
        if (member.voice.channel) {
            const targetChannel = message.guild?.channels.cache.get(config.generatorId);
            if (targetChannel?.isVoiceBased()) {
                await member.voice.setChannel(targetChannel);
                const embed = await usages_1.Usages.executedAction(guildId, "One Tap", `**__Moved you to__** <#${config.generatorId}> **__to create your room.__**`);
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
        }
        const embed = await usages_1.Usages.executedAction(guildId, "One Tap", `**__Join__** <#${config.generatorId}> **__to instantly create your personal voice channel.__**`);
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
    }
};
