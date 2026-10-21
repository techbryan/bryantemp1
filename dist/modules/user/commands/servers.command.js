"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serversCommand = void 0;
const discord_js_1 = require("discord.js");
const bot_developer_store_1 = require("../cache/bot-developer.store");
const theme_1 = require("../../../core/config/theme");
exports.serversCommand = {
    name: "servers",
    prefixAliases: ["servers"],
    async executePrefix(message) {
        if (!bot_developer_store_1.BotDeveloperStore.isDeveloper(message.author.id))
            return;
        const guilds = Array.from(message.client.guilds.cache.values());
        const totalGuilds = guilds.length;
        const totalMembers = guilds.reduce((acc, g) => acc + (g.memberCount || 0), 0);
        const color = await theme_1.ThemeManager.getColor(message.guildId);
        const resolvedColor = color ? (0, discord_js_1.resolveColor)(color) : 0x2b2d31;
        const container = new discord_js_1.ContainerBuilder()
            .setAccentColor(resolvedColor)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# <a:eedgy_hkwave:1546983166089105449> !! __Bot Servers List__\n> ### - **__Total Servers:__** \`${totalGuilds}\` | **__Total Users:__** \`${totalMembers}\``))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
        const serverChunks = [];
        let currentChunk = "";
        for (const g of guilds) {
            const line = `- **${g.name}**\n  - **ID:** \`${g.id}\`\n  - **Owner:** <@${g.ownerId}> (\`${g.ownerId}\`)\n  - **Members:** \`${g.memberCount}\`\n\n`;
            if ((currentChunk + line).length > 3000) {
                serverChunks.push(currentChunk);
                currentChunk = line;
            }
            else {
                currentChunk += line;
            }
        }
        if (currentChunk)
            serverChunks.push(currentChunk);
        if (serverChunks.length === 0) {
            container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("No servers found."));
        }
        else {
            for (const chunk of serverChunks.slice(0, 3)) {
                container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(chunk));
                container.addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
            }
        }
        await message.reply({
            flags: discord_js_1.MessageFlags.IsComponentsV2,
            components: [container],
            allowedMentions: { parse: [] }
        });
    }
};
