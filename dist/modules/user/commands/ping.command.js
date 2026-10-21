"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pingCommand = void 0;
const discord_js_1 = require("discord.js");
const mongoose_1 = __importDefault(require("mongoose"));
const perf_hooks_1 = require("perf_hooks");
const theme_1 = require("../../../core/config/theme");
exports.pingCommand = {
    name: "ping",
    prefixAliases: ["ping", "latency", "p"],
    async executePrefix(message) {
        const guildId = message.guildId;
        const respondSpeed = Math.max(1, Date.now() - message.createdTimestamp);
        const apiLatency = Math.max(0, Math.round(message.client.ws.ping));
        let dbSpeed = 0;
        try {
            const dbStart = perf_hooks_1.performance.now();
            if (mongoose_1.default.connection.readyState === 1 && mongoose_1.default.connection.db) {
                await mongoose_1.default.connection.db.admin().ping();
                dbSpeed = Math.round(perf_hooks_1.performance.now() - dbStart);
            }
        }
        catch {
            dbSpeed = 0;
        }
        const color = await theme_1.ThemeManager.getColor(guildId);
        const resolvedColor = color ? (0, discord_js_1.resolveColor)(color) : null;
        const container = new discord_js_1.ContainerBuilder();
        if (resolvedColor)
            container.setAccentColor(resolvedColor);
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId("help:home")
            .setLabel("Help")
            .setStyle(discord_js_1.ButtonStyle.Secondary));
        container
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("# <:hi:1537821258333552773> __Bot Latency__"))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`- __Respond Speed:__ \`${respondSpeed}ms\`\n` +
            `- __Api Latency:__ \`${apiLatency}ms\`\n` +
            `- __Database Speed:__ \`${dbSpeed}ms\``))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("-# __Click the button below to see more information about me.__"))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
            .addActionRowComponents(row);
        await message.reply({
            flags: discord_js_1.MessageFlags.IsComponentsV2,
            components: [container],
            allowedMentions: { parse: [] }
        });
    }
};
