"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.musicCommand = void 0;
const discord_js_1 = require("discord.js");
const global_music_bot_schema_1 = require("../../../../database/schemas/global-music-bot.schema");
const guild_store_1 = require("../../cache/guild.store");
const usages_1 = require("../../../../shared/embeds/usages");
const theme_1 = require("../../../../core/config/theme");
exports.musicCommand = {
    name: "music",
    prefixAliases: ["music", "musicbot", "musicbots", "mbot"],
    async executePrefix(message, args) {
        const guildId = message.guildId;
        if (!guildId)
            return;
        const sub = args[0]?.toLowerCase();
        const color = theme_1.ThemeManager.getColorSync(guildId);
        const accentColor = color ? (0, discord_js_1.resolveColor)(color) : null;
        const starEmoji = "<a:white_stars:1547180877962944585>";
        if (sub === "add" || sub === "remove" || sub === "delete" || sub === "del") {
            const hasPermission = message.member?.permissions.has(discord_js_1.PermissionFlagsBits.ManageGuild) ||
                message.member?.permissions.has(discord_js_1.PermissionFlagsBits.Administrator);
            if (!hasPermission) {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "You need Manage Server or Administrator permissions to manage music bots")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
        }
        if (!sub || sub === "list") {
            const allBots = await global_music_bot_schema_1.GlobalMusicBotModel.find().lean();
            const container = new discord_js_1.ContainerBuilder();
            if (accentColor)
                container.setAccentColor(accentColor);
            if (allBots.length === 0) {
                container
                    .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# ${starEmoji} __Global Music Bots..!!__`))
                    .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
                    .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`> -# __No global music bots registered yet.__\n\n- __Add one using:__ \`.v music add @Bot <prefix>\``))
                    .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
                await message.reply({
                    flags: discord_js_1.MessageFlags.IsComponentsV2,
                    components: [container],
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const listStr = allBots
                .map((b) => `- __Bot :__ <@${b.botId}> ⌇ **Prefix :** \`${b.prefix}\` ⌇ **ID :** \`${b.botId}\``)
                .join("\n");
            container
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# ${starEmoji} __Global Music Bots (${allBots.length})..!!__`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(listStr))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
            await message.reply({
                flags: discord_js_1.MessageFlags.IsComponentsV2,
                components: [container],
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (sub === "add") {
            const config = guild_store_1.GuildMemoryStore.resolve(guildId);
            if (!config?.twoPanelsEnabled) {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "Two Panels feature is disabled. Please enable Secondary Music & Activities Panel in `.v setup` first.")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            let targetBotId = null;
            const mention = message.mentions.users.first();
            if (mention) {
                targetBotId = mention.id;
            }
            else if (args[1]) {
                targetBotId = args[1].replace(/[<@!>]/g, "").trim();
            }
            const prefix = args[2]?.trim();
            if (!targetBotId || !prefix || !/^\d{17,20}$/.test(targetBotId)) {
                await message.reply({
                    ...(await usages_1.Usages.invalidCommand(guildId, "`.v music add <@Bot | botId> <prefix>`", "`.v music add @Hydra .` or `.v music add 547905866255433758 !`")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const targetUser = await message.client.users.fetch(targetBotId).catch(() => null);
            if (!targetUser) {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "Bot user not found. Please check the provided Bot ID or mention.")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            if (!targetUser.bot) {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "Invalid Target: The specified user is not a Discord bot account.")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            await global_music_bot_schema_1.GlobalMusicBotModel.updateOne({ botId: targetBotId }, { $set: { botId: targetBotId, prefix, addedAt: new Date() } }, { upsert: true }).exec();
            const container = new discord_js_1.ContainerBuilder();
            if (accentColor)
                container.setAccentColor(accentColor);
            container
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# ${starEmoji} __Music Bot Registred..!!__`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`- __Bot :__ <@${targetBotId}>\n- __BotId :__ **\`${targetBotId}\`**\n- __Prefix :__ \`${prefix}\``))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
            await message.reply({
                flags: discord_js_1.MessageFlags.IsComponentsV2,
                components: [container],
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (sub === "remove" || sub === "delete" || sub === "del") {
            let targetBotId = null;
            const mention = message.mentions.users.first();
            if (mention) {
                targetBotId = mention.id;
            }
            else if (args[1]) {
                targetBotId = args[1].replace(/[<@!>]/g, "").trim();
            }
            if (!targetBotId || !/^\d{17,20}$/.test(targetBotId)) {
                await message.reply({
                    ...(await usages_1.Usages.invalidCommand(guildId, "`.v music remove <@Bot | botId>`", "`.v music remove @Hydra` or `.v music remove 547905866255433758`")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const deleted = await global_music_bot_schema_1.GlobalMusicBotModel.findOneAndDelete({ botId: targetBotId }).exec();
            if (!deleted) {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, `Music bot <@${targetBotId}> is not in the global registry.`)),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const container = new discord_js_1.ContainerBuilder();
            if (accentColor)
                container.setAccentColor(accentColor);
            container
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# ${starEmoji} __Music Bot Removed..!!__`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`- __Bot :__ <@${targetBotId}>\n- __BotId :__ **\`${targetBotId}\`**`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
            await message.reply({
                flags: discord_js_1.MessageFlags.IsComponentsV2,
                components: [container],
                allowedMentions: { parse: [] }
            });
            return;
        }
        await message.reply({
            ...(await usages_1.Usages.invalidCommand(guildId, "`.v music <add | remove | list>`", "`.v music add @Hydra .`")),
            allowedMentions: { parse: [] }
        });
    }
};
