"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinCommand = void 0;
const discord_js_1 = require("discord.js");
const usages_1 = require("../../../../shared/embeds/usages");
const voice_persist_manager_1 = require("../../../../core/voice/voice-persist.manager");
const bot_gateway_1 = require("../../../../core/gateway/bot.gateway");
exports.joinCommand = {
    name: "join",
    prefixAliases: ["join"],
    async executePrefix(message, args) {
        const guildId = message.guildId;
        if (!guildId)
            return;
        if (!message.member?.permissions.has(discord_js_1.PermissionFlagsBits.Administrator)) {
            await message.reply({
                ...(await usages_1.Usages.impossible(guildId, "**__You need Administrator permissions to use this command :__**")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (args.length < 1) {
            await message.reply({
                ...(await usages_1.Usages.invalidCommand(guildId, "`.v join <channel_id>`", "`.v join <channel_id>`")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        let channelId = args[0].trim().replace(/[<#>]/g, "");
        if (args.length >= 2 && args[0].includes("@")) {
            channelId = args[1].trim().replace(/[<#>]/g, "");
        }
        const channel = message.guild?.channels.cache.get(channelId);
        if (!channel || !channel.isVoiceBased()) {
            await message.reply({
                ...(await usages_1.Usages.impossible(guildId, `**__Voice channel \`${channelId}\` not found in this server :__**`)),
                allowedMentions: { parse: [] }
            });
            return;
        }
        voice_persist_manager_1.VoicePersistManager.setMainBotChannel(guildId, channel.id);
        const success = await voice_persist_manager_1.VoicePersistManager.joinVoice(bot_gateway_1.BotGateway.client, guildId, channel.id);
        if (!success) {
            await message.reply({
                ...(await usages_1.Usages.impossible(guildId, `**__Failed to connect <@${bot_gateway_1.BotGateway.client.user?.id}> to \`${channel.name}\` :__**`)),
                allowedMentions: { parse: [] }
            });
            return;
        }
        const embed = await usages_1.Usages.executedAction(guildId, "Bot Voice Join", `**__<@${bot_gateway_1.BotGateway.client.user?.id}> has joined the voice channel and saved permanently :__**\n> ### - **Channel:** \`${channel.name}\` (\`${channel.id}\`)\n> ### - **Bot:** <@${bot_gateway_1.BotGateway.client.user?.id}>`);
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
    }
};
