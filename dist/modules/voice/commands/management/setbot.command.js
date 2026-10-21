"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setbotCommand = void 0;
exports.buildPayload = buildPayload;
const discord_js_1 = require("discord.js");
const usages_1 = require("../../../../shared/embeds/usages");
const bot_gateway_1 = require("../../../../core/gateway/bot.gateway");
const theme_1 = require("../../../../core/config/theme");
const env_1 = require("../../../../core/config/env");
function buildPayload(target = "main", botUser, guildId) {
    const targetTag = "main";
    const mainBotId = bot_gateway_1.BotGateway.client?.user?.id || env_1.ENV.CLIENT_ID;
    const botId = botUser?.id || mainBotId;
    const botMention = `<@${botId}>`;
    const color = guildId ? theme_1.ThemeManager.getColorSync(guildId) : null;
    const accentColor = color ? (0, discord_js_1.resolveColor)(color) : null;
    const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`setbot:avatar:${targetTag}`)
        .setLabel("Avatar")
        .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId(`setbot:banner:${targetTag}`)
        .setLabel("Banner")
        .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId(`setbot:bio:${targetTag}`)
        .setLabel("Bio")
        .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId(`setbot:nameplate:${targetTag}`)
        .setLabel("Nameplate")
        .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId(`setbot:panelimage:${targetTag}`)
        .setLabel("Panel Image")
        .setStyle(discord_js_1.ButtonStyle.Success));
    const row2 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`setbot:reset:${targetTag}`)
        .setLabel("Reset...")
        .setStyle(discord_js_1.ButtonStyle.Danger));
    const container = new discord_js_1.ContainerBuilder();
    if (accentColor)
        container.setAccentColor(accentColor);
    container
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# <a:eedgy_hkwave:1545100098470416445> __You Want to Customize ${botMention} Profile..!!__`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`- __Click Buttons Below To Make a unique Profile For Bot...!!__`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
        .addActionRowComponents(row1)
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
        .addActionRowComponents(row2)
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
    return {
        flags: discord_js_1.MessageFlags.IsComponentsV2,
        components: [container]
    };
}
exports.setbotCommand = {
    name: "setbot",
    prefixAliases: ["setbot", "botprofile", "botconfig"],
    async executePrefix(message, _args) {
        const guildId = message.guildId;
        if (!guildId)
            return;
        if (!message.member?.permissions.has(discord_js_1.PermissionFlagsBits.Administrator)) {
            await message.reply({
                ...(await usages_1.Usages.impossible(guildId, "You need Administrator permissions to use this")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        const targetUser = bot_gateway_1.BotGateway.client?.user ?? (message.client.user ?? undefined);
        const payload = buildPayload("main", targetUser, guildId);
        await message.reply(payload);
    }
};
