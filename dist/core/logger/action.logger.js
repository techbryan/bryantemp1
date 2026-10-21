"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionLogger = void 0;
const discord_js_1 = require("discord.js");
const guild_store_1 = require("../../modules/voice/cache/guild.store");
const theme_1 = require("../config/theme");
const bot_gateway_1 = require("../gateway/bot.gateway");
const logger_1 = require("./logger");
class ActionLogger {
    static LOG_EMOJI = "<a:3644hellokittyrun:1546859794478932078>";
    static WEBHOOK_NAME = "3067 Logs";
    static webhookCache = new Map();
    static MAX_WEBHOOK_ENTRIES = 500;
    static escapeLogText(text) {
        return text.replace(/@everyone/gi, "@\u200beveryone").replace(/@here/gi, "@\u200bhere");
    }
    static async getOrCreateWebhook(channel) {
        const cached = this.webhookCache.get(channel.id);
        if (cached)
            return cached.client;
        try {
            const webhooks = await channel.fetchWebhooks().catch(() => null);
            let webhook = webhooks?.find((w) => w.name === this.WEBHOOK_NAME && Boolean(w.token));
            const botUser = bot_gateway_1.BotGateway.client?.user;
            const avatarUrl = botUser?.displayAvatarURL({ extension: "png", size: 256 });
            if (!webhook) {
                webhook = await channel.createWebhook({
                    name: this.WEBHOOK_NAME,
                    avatar: avatarUrl,
                    reason: "3067 Voice Action Logging Webhook"
                });
            }
            if (webhook && webhook.url) {
                const client = new discord_js_1.WebhookClient({ url: webhook.url });
                if (this.webhookCache.size >= this.MAX_WEBHOOK_ENTRIES) {
                    const firstKey = this.webhookCache.keys().next().value;
                    if (firstKey) {
                        const old = this.webhookCache.get(firstKey);
                        old?.client.destroy();
                        this.webhookCache.delete(firstKey);
                    }
                }
                this.webhookCache.set(channel.id, { url: webhook.url, client });
                return client;
            }
        }
        catch (error) {
            logger_1.FastLogger.warn(`Failed to resolve webhook for channel ${channel.id}: ${String(error)}`);
        }
        return null;
    }
    static async logAction(options) {
        try {
            const { guildId, executorId, action, channelName, targetId, details } = options;
            const config = await guild_store_1.GuildMemoryStore.resolve(guildId);
            if (!config?.logsChannelId)
                return;
            const color = await theme_1.ThemeManager.getColor(guildId);
            const accentColor = color ? (0, discord_js_1.resolveColor)(color) : null;
            const container = new discord_js_1.ContainerBuilder();
            if (accentColor)
                container.setAccentColor(accentColor);
            let content = `- **__User :__** <@${executorId}>\n` +
                `- **__Action :__** \`${this.escapeLogText(action)}\`\n`;
            if (channelName) {
                content += `- **__Channel :__** \`${this.escapeLogText(channelName)}\`\n`;
            }
            if (targetId) {
                content += `- **__Target :__** <@${targetId}>\n`;
            }
            if (details) {
                content += `- **__Details :__** ${this.escapeLogText(details)}\n`;
            }
            content += `- **__Time :__** <t:${Math.floor(Date.now() / 1000)}:R>`;
            container
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${this.LOG_EMOJI} __Action Log: ${this.escapeLogText(action)}__`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(content))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
            const guild = bot_gateway_1.BotGateway.client?.guilds.cache.get(guildId);
            if (!guild)
                return;
            const logsChannel = guild.channels.cache.get(config.logsChannelId);
            if (!logsChannel || !(logsChannel instanceof discord_js_1.TextChannel))
                return;
            const botUser = bot_gateway_1.BotGateway.client?.user;
            const avatarUrl = botUser?.displayAvatarURL({ extension: "png", size: 256 });
            const webhook = await this.getOrCreateWebhook(logsChannel);
            if (webhook) {
                try {
                    await webhook.send({
                        username: this.WEBHOOK_NAME,
                        avatarURL: avatarUrl,
                        flags: discord_js_1.MessageFlags.IsComponentsV2,
                        components: [container],
                        allowedMentions: { parse: [] }
                    });
                    return;
                }
                catch {
                    const old = this.webhookCache.get(logsChannel.id);
                    old?.client.destroy();
                    this.webhookCache.delete(logsChannel.id);
                }
            }
            await logsChannel.send({
                flags: discord_js_1.MessageFlags.IsComponentsV2,
                components: [container],
                allowedMentions: { parse: [] }
            }).catch((sendError) => {
                logger_1.FastLogger.warn(`Failed to send fallback action log in channel ${logsChannel.id}: ${String(sendError)}`);
            });
        }
        catch (error) {
            logger_1.FastLogger.warn(`Failed to log action: ${String(error)}`);
        }
    }
}
exports.ActionLogger = ActionLogger;
